import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import {
  FilterMap,
  QueryRequest,
  PaginationResponse,
  SortingMap,
} from 'src/common/repositories/base.repository';
import { Website } from '../website.entity';
import { WebsiteFilter, WebsiteSort, WebsitePagination, WebsiteQueryRequest } from '../types';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ContextEnum, ContextMapByRole } from '../../context/context.enum';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { WEBSITE_CONTEXT_METADATA_CONFIG } from '../website.constants';
import { query } from 'winston';
import { Exception } from 'bullmq';

@Injectable()
export class WebsiteRepository extends ContextAwareRepository<
  Website,
  WebsiteFilter,
  WebsiteSort,
  WebsitePagination
> {
  protected readonly alias = 'w';

  constructor(
    @InjectRepository(Website)
    public readonly orm: Repository<Website>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    protected readonly outboxService: OutboxService,
    @Inject(WEBSITE_CONTEXT_METADATA_CONFIG)
    protected readonly tableConfig: RepositoryTableConfig,
  ) {
    super(orm, logger, configService, tableConfig);
  }

  protected readonly filterMap: FilterMap<WebsiteFilter, Website> = {
    ids: (query, value) => query.andWhereInIds(value),
    searchTerm: (query, value) => {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${this.alias}.title ILIKE :searchTerm`, { searchTerm: `%${value}%` }).orWhere(
            `${this.alias}.base_url ILIKE :searchTerm`,
            { searchTerm: `%${value}%` },
          );
        }),
      );
    },
    baseUrl: (query, value) => {
      query.andWhere(`${this.alias}.base_url = :baseUrl`, { baseUrl: value });
    },
    directoryId: (query, value) => {
      query.andWhere(
        `${this.alias}.id IN (
        SELECT UNNEST(v.website_ids)
        FROM v_directory_websites v
        WHERE v.id = :directoryId
      )`,
        { directoryId: value },
      );
    },
    institutionId: (query, value) => {
      query.andWhere(`${this.alias}.institution_id = :institutionId`, {
        institutionId: value,
      });
    },
    tagId: (query, value) => {
      query.innerJoin('website_tags', 'wt', `wt.website_id = ${this.alias}.id`);
      query.andWhere(`wt.tag_id = :tagId`, { tagId: value });
    },
  };

  protected readonly sortMap: SortingMap<WebsiteSort, Website> = {
    id: (query, order) => this.addSort(query, 'id', order),
    title: (query, order) => this.addSort(query, 'title', order),
    createdAt: (query, order) => this.addSort(query, 'createdAt', order),
    baseUrl: (query, order) => this.addSort(query, 'baseUrl', order),
    institutionId: (query, order) => this.addSort(query, 'institutionId', order),
  };

  public async findMany(
    queryArgs: QueryRequest<WebsiteFilter, WebsiteSort, WebsitePagination>,
  ): Promise<PaginationResponse<Website>> {
    throw new Error('Not Allowed');
  }

  public async findManySecure(
    queryArgs: WebsiteQueryRequest,
  ): Promise<PaginationResponse<Website>> {
    const query = this.orm.createQueryBuilder(`${this.alias}`);
    this.applyPaginationConstraints(query, queryArgs.contexts, queryArgs.securityContext);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);

    const [data, count] = await query.getManyAndCount();
    const metadataPagination = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10,
    );
    return { data, meta: metadataPagination };
  }

  private applyPaginationConstraints(
    query: SelectQueryBuilder<Website>,
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): void {
    if (contexts && contexts.length > 0) {
      query
        .innerJoin(`${this.alias}.contexts`, this.contextAlias)
        .andWhere(`${this.contextAlias}.code IN (:...contextCodes)`, { contextCodes: contexts });
    } else {
      const contextUser = ContextMapByRole[securityContext.user.role_slug];
      if (!contextUser) {
        throw new BadRequestException('User role does not have an associated context');
      }
      query
        .innerJoin(`${this.alias}.contexts`, this.contextAlias)
        .andWhere(`${this.contextAlias}.code = :contextCode`, { contextCode: contextUser });
    }
    if (securityContext.user.role_slug !== RoleSlug.ADMIN) {
      const userId = securityContext.user.id;
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            `EXISTS (
              SELECT 1 FROM user_websites uw 
              WHERE uw.website_id = ${this.alias}.id AND uw.user_id = :userId
            )`,
          ).orWhere(
            `EXISTS (
              SELECT 1 FROM team_websites tw 
              JOIN user_teams ut ON ut.team_id = tw.team_id 
              WHERE tw.website_id = ${this.alias}.id AND ut.user_id = :userId
            )`,
          );
        }),
        { userId },
      );
    }
  }

  public createWebsite(website: Website): Promise<Website> {
    return this.runInTransaction(async (queryRunner) => {
      const savedWebsite = await this.save(website);
      await this.outboxService.putInOutbox(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.WEBSITE,
        aggregateId: 1,
        action: AUTHORIZATION_ACTION.WEBSITE_CREATE,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.WEBSITE,
          resourceId: savedWebsite.id,
          action: AUTHORIZATION_ACTION.WEBSITE_CREATE,
        },
      });
      return savedWebsite;
    });
  }
  public async deleteWebsites(
    websiteIds: number[],
    securityContext: SecurityContext,
  ): Promise<{ hardDeletedIds: number[]; softDeletedIds: number[] }> {
    if (!websiteIds.length) {
      return { hardDeletedIds: [], softDeletedIds: [] };
    }

    return await this.runInTransaction(async (queryRunner) => {
      const query = `
      WITH target_websites AS (
        SELECT w.id
        FROM websites w
        WHERE w.id = ANY($1::int[])
          AND w.deleted_at IS NULL
        ORDER BY w.id ASC
        FOR UPDATE
      ),
      -- 1. Classifica os websites: tem ou não avaliações nas páginas?
      classified_websites AS (
        SELECT 
          tw.id,
          EXISTS (
            SELECT 1
            FROM pages p
            INNER JOIN evaluations e ON e.page_id = p.id
            WHERE p.website_id = tw.id
          ) AS has_evaluations
        FROM target_websites tw
      ),
      -- 2. Limpeza prévia de dependências para HARD DELETE
      hard_targets AS (
        SELECT cw.id FROM classified_websites cw WHERE cw.has_evaluations = FALSE
      ),
      hard_target_pages AS (
        SELECT p.id 
        FROM pages p 
        WHERE p.website_id IN (SELECT id FROM hard_targets)
      ),
      deleted_contexts AS (
        DELETE FROM page_contexts pc
        USING hard_target_pages htp
        WHERE pc.page_id = htp.id
        RETURNING pc.page_id
      ),
      deleted_pages AS (
        DELETE FROM pages p
        USING hard_targets ht
        WHERE p.website_id = ht.id
        RETURNING p.id
      ),
      hard_deleted_websites AS (
        DELETE FROM websites w
        USING hard_targets ht
        WHERE w.id = ht.id
        RETURNING w.id
      ),
      -- 3. SOFT DELETE para websites com histórico de avaliações
      soft_targets AS (
        SELECT cw.id FROM classified_websites cw WHERE cw.has_evaluations = TRUE
      ),
      soft_deleted_pages AS (
        UPDATE pages p
        SET 
          deleted_at = CURRENT_TIMESTAMP,
          updated_by_id = $2::int
        FROM soft_targets st
        WHERE p.website_id = st.id
          AND p.deleted_at IS NULL
        RETURNING p.id
      ),
      soft_deleted_websites AS (
        UPDATE websites w
        SET 
          deleted_at = CURRENT_TIMESTAMP,
          updated_by_id = $2::int
        FROM soft_targets st
        WHERE w.id = st.id
        RETURNING w.id
      )
      SELECT 
        ARRAY(SELECT id FROM hard_deleted_websites) AS hard_deleted_ids,
        ARRAY(SELECT id FROM soft_deleted_websites) AS soft_deleted_ids;
    `;

      const result = await queryRunner.query(query, [websiteIds, securityContext.user.id ?? null]);

      const hardDeletedIds: number[] = result[0]?.hard_deleted_ids ?? [];
      const softDeletedIds: number[] = result[0]?.soft_deleted_ids ?? [];
      const affectedIds = [...hardDeletedIds, ...softDeletedIds];

      if (affectedIds.length > 0) {
        // Dispara o evento apenas para os recursos que sofreram mutação
        await this.outboxService.putInOutbox(queryRunner.manager, {
          aggregateType: FGA_RESOURCE.WEBSITE,
          aggregateId: affectedIds[0],
          action: AUTHORIZATION_ACTION.WEBSITE_DELETE,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: {
            resourceType: FGA_RESOURCE.WEBSITE,
            resourceId: affectedIds[0],
            action: AUTHORIZATION_ACTION.WEBSITE_DELETE,
            websiteIds: affectedIds,
            hardDeletedIds,
            softDeletedIds,
          },
        });
      }

      return { hardDeletedIds, softDeletedIds };
    });
  }

  public changeWebsiteUrl(
    Website: Website,
    baseUrl: string,
    securityContext: SecurityContext,
  ): Promise<Website> {
    return this.runInTransaction(async (queryRunner) => {
      await queryRunner.query(
        `UPDATE pages
        SET archived_at = NOW()
        WHERE website_id = $1 
          AND url <> $2 
          AND archived_at IS NULL;`,
        [Website.id, baseUrl],
      );

      await queryRunner.query(
        `UPDATE pages
        SET archived_at = NULL
        WHERE website_id = $1 
          AND (url = $2 OR url LIKE $2 || '/%')
          AND archived_at IS NOT NULL;`,
        [Website.id, baseUrl],
      );

      await queryRunner.query(
        `UPDATE websites
        SET base_url = $1
            , updated_by_id = $3::int
        WHERE id = $2;`,
        [baseUrl, Website.id, securityContext.user.id ?? null],
      );

      const updatedWebsite = await queryRunner.query(`SELECT * FROM websites WHERE id = $1;`, [
        Website.id,
      ]);

      return updatedWebsite[0];
    });
  }

  /*
  public deleteWebsites(WebsitesId: number[]): Promise<void> {
    return this.runInTransaction(async (queryRunner) => {
      await this.deleteMany(WebsitesId);

      await this.outboxService.putInOutbox(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.WEBSITE,
        aggregateId: 1,
        action: AUTHORIZATION_ACTION.WEBSITE_DELETE,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.WEBSITE,
          resourceId: 1,
          action: AUTHORIZATION_ACTION.WEBSITE_DELETE,
          websiteIds: WebsitesId,
        },
      });
    });
  }
    */
}
