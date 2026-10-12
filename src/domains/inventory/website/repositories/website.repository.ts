import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { WEBSITE_CONTEXT_METADATA_CONFIG } from '../website.constants';

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
    tableConfig: RepositoryTableConfig,
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
      query.innerJoin('v_websites_metadata', 'v', `v.website_id = ${this.alias}.id`);
      query.andWhere(`v.directories_ids @> ARRAY[:directoryId]::int[]`, { directoryId: value });
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
}
