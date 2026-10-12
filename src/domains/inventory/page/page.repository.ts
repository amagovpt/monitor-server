import { Inject, Injectable } from '@nestjs/common';
import { Page } from './page.entity';
import { FilterMap, PaginationResponse, SortingMap } from 'src/common/repositories/base.repository';
import { Brackets, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { ContextEnum } from '../context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import { PageEvalDTO } from './dto/page-detailed.dto';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import type { PageFilter, PageSort, PagePagination, PageQueryRequest, PageRecord } from './types';
import {
  BASE_CONTEXT_CONFIG_TOKEN,
  RepositoryTableConfig,
} from 'src/common/repositories/base-context';

@Injectable()
export class PageRepository extends ContextAwareRepository<
  Page,
  PageFilter,
  PageSort,
  PagePagination
> {
  protected readonly alias = 'p';

  constructor(
    @InjectRepository(Page) orm: Repository<Page>,
    logger: AppLoggerService,
    configService: ConfigService,
    @Inject(BASE_CONTEXT_CONFIG_TOKEN)
    tableConfig: RepositoryTableConfig,
  ) {
    super(orm, logger, configService, tableConfig);
  }

  protected readonly filterMap: FilterMap<PageFilter, Page> = {
    id: (query, value) => this.addFilter(query, 'id', value, 'eq'),
    ids: (query, value) => this.addFilter(query, 'id', value, 'in'),
    searchTerm: (query, val) => {
      if (val && val.trim().length >= 3) {
        const term = `%${val.trim()}%`;

        query.andWhere(
          new Brackets((qb) => {
            qb.where(`${this.alias}.url ILIKE :searchTerm`, { searchTerm: term }).orWhere(
              `${this.alias}.website_id IN (
              SELECT w.id FROM websites w WHERE w.title ILIKE :searchTerm
              )`,
              { searchTerm: term },
            );
          }),
        );
      }
    },
    websiteId: (query, val) => this.addFilter(query, 'websiteId', val, 'eq'),
    contexts: (query, val) => {
      if (val && val.length > 0) {
        query
          .innerJoin(`${this.alias}.contexts`, 'context')
          .andWhere('context.code IN (:...contextCodes)', { contextCodes: val.map((c) => c.code) });
      }
    },
  };

  protected readonly sortMap: SortingMap<PageSort, Page> = {
    id: (query, order) => this.addSort(query, 'id', order),
    url: (query, order) => this.addSort(query, 'url', order),
    isInObservatory: (query, order) => query.addOrderBy(`${this.alias}.is_in_observatory`, order),
    websiteId: (query, order) => this.addSort(query, 'websiteId', order),
    createdAt: (query, order) => query.addOrderBy(`${this.alias}.created_at`, order),
  };

  async findManyWithLastEvalScore(
    queryArgs: PageQueryRequest,
  ): Promise<PaginationResponse<PageEvalDTO>> {
    const { filters, sortings, pagination } = queryArgs;
    const connection = this.getOrmRepository().manager.connection;

    const query = connection.createQueryBuilder().from(Page, this.alias);

    this.applyContextRules(query, queryArgs.contexts, queryArgs.securityContext);
    this.applyDynamicFilters(query, filters);
    this.applyDynamicSorting(query, sortings);

    const countQuery = connection.createQueryBuilder().from(Page, this.alias);
    this.applyContextRules(countQuery, queryArgs.contexts, queryArgs.securityContext);
    this.applyDynamicFilters(countQuery, filters);
    countQuery.select(`COUNT(${this.alias}.id)`, 'total');

    query.select([
      `${this.alias}.id AS id`,
      `${this.alias}.url AS url`,
      `${this.alias}.website_id AS "websiteId"`,
      `${this.alias}.created_at AS "createdAt"`,
      `${this.alias}.updated_at AS "updatedAt"`,
      ...(queryArgs.securityContext.user.context.id === 1
        ? [`${this.alias}.is_in_observatory AS "isInObservatory"`]
        : []),
      `(
      SELECT json_build_object(
        'id', e.id,
        'score', e.score,
        'createdAt', e.created_at,
        'A', e."A",
        'AA', e."AA",
        'AAA', e."AAA",
        'tagCount', e.tag_count
      )
      FROM evaluations e
      WHERE e.page_id = ${this.alias}.id
      ORDER BY e.created_at DESC
      LIMIT 1
    ) AS evaluation`,
    ]);

    this.applyPagination(query, pagination);

    const [rawData, countResult] = await Promise.all([
      query.getRawMany(),
      countQuery.getRawOne<{ total: string }>(),
    ]);

    const totalCount = parseInt(countResult?.total ?? '0', 10);

    const metadataPagination = this.calculatePaginationMeta(
      totalCount,
      pagination?.page ?? 1,
      pagination?.limit ?? 10,
    );

    return {
      data: rawData,
      meta: metadataPagination,
    };
  }
  async findByPageByWebsiteId(websiteId: number, pageId: number): Promise<Page | null> {
    const query = this.getOrmRepository().createQueryBuilder(this.alias);
    query
      .where(`${this.alias}.id = :pageId`, { pageId })
      .andWhere(`${this.alias}.website_id = :websiteId`, { websiteId });
    return await query.getOne();
  }

  async upsertPages(
    websiteId: number,
    records: PageRecord[],
    securityContext: SecurityContext,
  ): Promise<void> {
    if (!records.length) return;

    const urls = records.map((r) => r.url);
    const hashes = records.map((r) => r.urlHash);

    const query = `
      WITH incoming_data AS (
        SELECT 
          $1::int AS website_id,
          u.url,
          u.url_hash::bigint AS url_hash
        FROM unnest($2::text[], $3::text[]) AS u(url, url_hash)
      )
      INSERT INTO pages (website_id, url, url_hash, created_by_id, updated_by_id)
      SELECT website_id, url, url_hash, $4::int, $4::int
      FROM incoming_data
      ON CONFLICT (website_id, url_hash) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;

    this.runInTransaction(async (queryRunner) => {
      const rows: { id: number }[] = await queryRunner.query(query, [
        websiteId,
        urls,
        hashes,
        securityContext.user.id ?? null,
      ]);

      this.addContextRules(
        queryRunner,
        rows.map((r) => r.id),
        undefined,
        securityContext,
      );
      return rows.map((r) => r.id);
    });
  }

  async deletePagesWithContextCheck(
    pageIds: number[],
    securityContext: SecurityContext,
  ): Promise<void> {
    if (!pageIds.length) {
      return;
    }
    await this.runInTransaction(async (queryRunner) => {
      const query = `
      WITH target_pages AS (
        SELECT p.id
        FROM pages p
        WHERE p.id = ANY($1::int[])
          AND p.deleted_at IS NULL
        ORDER BY p.id ASC
        FOR UPDATE
      ),
      removed_contexts AS (
        DELETE FROM page_contexts pc
        USING target_pages tp
        WHERE pc.page_id = tp.id
          AND pc.context_id = $2::int
        RETURNING pc.page_id
      ),
      orphaned_pages AS (
        SELECT rc.page_id AS id
        FROM removed_contexts rc
        WHERE NOT EXISTS (
          SELECT 1
          FROM page_contexts pc
          WHERE pc.page_id = rc.page_id
        )
      ),
      soft_deleted_pages AS (
        -- 4. Aplica soft delete apenas às que ficaram órfãs de contexto
        UPDATE pages p
        SET 
          deleted_at = CURRENT_TIMESTAMP,
          updated_by_id = $3::int
        FROM orphaned_pages op
        WHERE p.id = op.id
        RETURNING p.id
      )
      SELECT 
        (SELECT COUNT(*)::int FROM removed_contexts) AS unlinked_count,
        (SELECT COUNT(*)::int FROM soft_deleted_pages) AS soft_deleted_count;
    `;

      await queryRunner.query(query, [
        pageIds,
        securityContext.user.context.id,
        securityContext.user.id ?? null,
      ]);
    });
  }

  public changePageContexts(
    pageId: number[],
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<void> {
    return this.runInTransaction(async (queryRunner) => {
      await this.substituteContextRules(queryRunner, pageId, contexts, securityContext);
    });
  }

  public async toggleObservatoryStatus(
    website: number,
    pageId: number,
    securityContext: SecurityContext,
  ): Promise<void> {
    const query = `
      UPDATE pages
        SET is_in_observatory = NOT is_in_observatory,
            updated_by_id = $2::int,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::int
          AND website_id = $3::int  
          AND EXISTS (
              SELECT 1 
              FROM page_contexts_ams 
              WHERE page_id = $1::int 
          );
    `;
    await this.dataSource.query(query, [pageId, securityContext.user.id ?? null, website]);
  }
}
