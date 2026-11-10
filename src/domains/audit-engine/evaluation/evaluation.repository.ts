import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Evaluation, PublishStatus } from './entities/evaluation.entity';
import { FilterMap, SortingMap } from '@common/repositories/base.repository';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { ContextEnum } from 'src/domains/inventory/context/context.enum';
import { EvaluationContext } from './entities/contexts-evaluation.entity';
import { EvaluationScoring, EvaluationTargetMetadata } from './types';
import { ContextAwareRepository } from 'src/common/repositories/context-aware.repository';
import { EVALUATION_CONTEXT_METADATA_CONFIG } from './evaluation.constants';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { ResourceTypes } from './queue/payload.types';
import { ACTION_REGISTRY } from './registry/registry.keys';

export interface EvaluationFilter extends BaseFilter {
  id: number;
  ids: number[] | string[];
  score: string;
  pageId: number;
}

export interface EvaluationSorting extends BaseSort {
  id: SortCriteria;
  pageId: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
  score: SortCriteria;
}

type EvaluationQueryRequest = {
  filters: Partial<EvaluationFilter>;
  sortings: Partial<EvaluationSorting>;
  pagination: Partial<BasePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};

@Injectable()
export class EvaluationRepository extends ContextAwareRepository<
  Evaluation,
  EvaluationFilter,
  EvaluationSorting
> {
  protected readonly alias = 'evaluation';

  constructor(
    @InjectRepository(Evaluation)
    private readonly ormRepo: Repository<Evaluation>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    @Inject(EVALUATION_CONTEXT_METADATA_CONFIG)
    protected readonly tableConfig: RepositoryTableConfig,
    protected readonly outboxService: OutboxService,
  ) {
    super(ormRepo, logger, configService, tableConfig);
    this.logger.setContext(EvaluationRepository.name);
  }

  protected readonly filterMap: FilterMap<EvaluationFilter, Evaluation> = {
    id: (query, id) => query.andWhere({ id }),
    ids: (query, ids) =>
      ids?.length &&
      query.andWhere({ id: In(ids.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))) }),
    score: (query, score) => query.andWhere({ score }),
    pageId: (query, pageId) => query.andWhere({ pageId }),
  };

  protected readonly sortMap: SortingMap<EvaluationSorting, Evaluation> = {
    id: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.id`, order),
    pageId: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.pageId`, order),
    score: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.score`, order),
    createdAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order: SortCriteria) => query.addOrderBy(`${this.alias}.updatedAt`, order),
  };

  public async getManyEvaluations(
    websiteId: number,
    pageId: number,
    queryArgs: EvaluationQueryRequest,
  ): Promise<{ data: Evaluation[]; count: number }> {
    const query = this.ormRepo.createQueryBuilder(`${this.alias}`);
    query
      .innerJoin(`${this.alias}.page`, 'p')
      .innerJoin('p.website', 'w')
      .addSelect(`p`)
      .addSelect(`w.id`, 'websiteId')
      .where('w.id = :websiteId', { websiteId })
      .andWhere(`${this.alias}.pageId = :pageId`, { pageId });
    this.applyContextRules(query, queryArgs.contexts, queryArgs.securityContext);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);
    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  private getBaseQuery(): SelectQueryBuilder<Evaluation> {
    return this.ormRepo
      .createQueryBuilder(`${this.alias}`)
      .innerJoin(`${this.alias}.page`, 'p')
      .innerJoin('p.website', 'w');
  }

  async getEvaluationByContext(
    evaluationId: number,
    websiteId: number,
    pageId: number,
    contextId: number,
  ): Promise<Evaluation | null> {
    const query = this.getBaseQuery();

    query
      .innerJoin('evaluation_contexts', 'ec', `ec.evaluationId = ${this.alias}.id`)
      .andWhere(`${this.alias}.id = :evaluationId`, { evaluationId })
      .andWhere('w.id = :websiteId', { websiteId })
      .andWhere(`${this.alias}.pageId = :pageId`, { pageId })
      .andWhere('ec.contextId = :contextId', { contextId });

    return await query.getOne();
  }
  async createEvaluation(evaluation: Evaluation, contextId: number): Promise<Evaluation> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const savedEval = await transactionalEntityManager.save(evaluation);

      const evaluationContext = transactionalEntityManager.create(EvaluationContext, {
        evaluationId: savedEval.id,
        contextId: contextId,
      });

      await transactionalEntityManager.save(evaluationContext);

      return savedEval;
    });
  }
  async createManyEvaluations(evaluations: Evaluation[], contextId: number): Promise<Evaluation[]> {
    return await this.dataSource.transaction(async (entityManager) => {
      const savedEvals = await entityManager.save(Evaluation, evaluations);

      const contexts = savedEvals.map((evalItem) => {
        const ec = new EvaluationContext();
        ec.evaluationId = evalItem.id;
        ec.contextId = contextId;
        return ec;
      });

      await entityManager.save(EvaluationContext, contexts);

      return savedEvals;
    });
  }

  async updateEntityFromRawData(
    evaluationId: number,
    evaluationData: EvaluationScoring,
  ): Promise<Evaluation> {
    const evaluation = await this.findByIdOrFail(evaluationId);
    evaluation.pageTitle = evaluationData.title;
    evaluation.A = evaluationData.A;
    evaluation.AA = evaluationData.AA;
    evaluation.AAA = evaluationData.AAA;
    evaluation.score = evaluationData.score;
    evaluation.createdAt = new Date(evaluationData.createdAt);
    evaluation.updatedAt = new Date(evaluationData.createdAt);
    return await this.orm.save(evaluation);
  }

  async updateStatus(evaluationId: number, status: PublishStatus): Promise<Evaluation> {
    const evaluation = await this.findByIdOrFail(evaluationId);
    evaluation.status = status;
    return await this.orm.save(evaluation);
  }

  async updatePublishStatus(evaluationId: number, status: PublishStatus): Promise<Evaluation> {
    const evaluation = await this.findByIdOrFail(evaluationId);
    evaluation.status = status;
    return await this.orm.save(evaluation);
  }

  async findWithDetails(filters: EvaluationFilter): Promise<Evaluation[]> {
    const query = this.getBaseQuery();
    this.applyDynamicFilters(query, filters);

    query.orderBy(`${this.alias}.createdAt`, 'DESC');

    return await query.getMany();
  }

  async findNewestByPageId(pageId: number): Promise<Evaluation | null> {
    const query = this.getBaseQuery().where(`${this.alias}.pageId = :pageId`, { pageId });

    return await query.orderBy(`${this.alias}.createdAt`, 'DESC').getOne();
  }

  async findEvaluationById(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<Evaluation | null> {
    const query = this.getBaseQuery()
      .where(`${this.alias}.id = :evaluationId`, { evaluationId })
      .andWhere(`${this.alias}.pageId = :pageId`, { pageId })
      .andWhere('w.id = :websiteId', { websiteId });
    this.applyContextRules(query, [], securityContext);
    return await query.getOne();
  }
  async getMetadataForEvaluation(websiteId: number): Promise<EvaluationTargetMetadata> {
    const query = `
    WITH DirectoryRequirements AS (
        SELECT 
            d.id AS directory_id,
            d.tag_matching_strategy,
            COUNT(dt.tag_id) AS required_tags_count
        FROM directories d
        LEFT JOIN directory_tags dt ON dt.directory_id = d.id
        GROUP BY d.id, d.tag_matching_strategy
    ),
    WebsiteDirectoryMatches AS (
        SELECT 
            wt.website_id,
            dr.directory_id
        FROM website_tags wt
        JOIN directory_tags dt ON dt.tag_id = wt.tag_id
        JOIN DirectoryRequirements dr ON dr.directory_id = dt.directory_id
        WHERE wt.website_id = $1
        GROUP BY wt.website_id, dr.directory_id, dr.tag_matching_strategy, dr.required_tags_count
        HAVING 
            (dr.tag_matching_strategy = 'UNION')
            OR 
            (dr.tag_matching_strategy = 'INTERSECTION' AND COUNT(DISTINCT wt.tag_id) = dr.required_tags_count)
    ),
    AggregatedDirectories AS (
        SELECT 
            website_id,
            ARRAY_AGG(directory_id) AS directories_ids
        FROM WebsiteDirectoryMatches
        GROUP BY website_id
    )
    SELECT 
        w.id AS website_id,
        w.institution_id,
        COALESCE(ad.directories_ids, ARRAY[]::INTEGER[]) AS directories_ids
    FROM websites w
    LEFT JOIN AggregatedDirectories ad ON ad.website_id = w.id
    WHERE w.id = $1;
  `;

    const rows = await this.dataSource.query<EvaluationTargetMetadata[]>(query, [websiteId]);

    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Website with ID ${websiteId} not found`);
    }

    return rows[0];
  }

  async deleteEvaluation(evaluation: Evaluation, websiteId: number): Promise<void> {
    this.runInTransaction(async (queryRunner) => {
      await queryRunner.manager.delete(Evaluation, evaluation.id);
      const manager = queryRunner.manager;

      await this.outboxService.putInOutbox(manager, {
        aggregateType: ResourceTypes.EVALUATION,
        aggregateId: evaluation.id,
        eventType: 'evaluation',
        payload: {
          resourceType: ResourceTypes.EVALUATION,
          resourceId: evaluation.id,
          action: ACTION_REGISTRY.EVALUATION_DELETE,
          websiteId: websiteId,
          pageId: evaluation.pageId,
          evaluationDate: evaluation.evaluationDate!.toString(),
        },
      });
    });
  }
}
