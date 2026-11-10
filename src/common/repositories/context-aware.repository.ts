import {
  Brackets,
  DataSource,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
  WhereExpressionBuilder,
} from 'typeorm';

import { BaseFilter, BasePagination, BaseSort } from '../interfaces/types';
import { AppLoggerService } from '@core/app-logger/app-logger.service';
import { IdentifiableModel } from '../interfaces/Identifiable.interface';
import { ConfigService } from '@nestjs/config';
import { BaseTransactionalRepository } from './base-transactional.repository';
import {
  ADMIN_CONTEXT_ID,
  ContextEnum,
  getContextIdByCode,
} from 'src/domains/inventory/context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';
import {
  ContextRuleTablesMap,
  RepositoryTableConfig,
  DEFAULT_CONTEXT_METADATA,
} from './base-context';
import { chunkArray } from '../utils/utils';

export abstract class ContextAwareRepository<
  T extends IdentifiableModel,
  F extends BaseFilter = BaseFilter,
  S extends BaseSort = BaseSort,
  P extends BasePagination = BasePagination,
> extends BaseTransactionalRepository<T, F, S, P> {
  protected readonly dataSource: DataSource;
  protected readonly tables: ContextRuleTablesMap;

  constructor(
    orm: Repository<T>,
    logger: AppLoggerService,
    configService: ConfigService,
    tableConfig: RepositoryTableConfig,
  ) {
    super(orm, logger, configService);
    this.dataSource = orm.manager.connection;

    this.tables = Object.freeze({
      mainTable: tableConfig.mainTable,
      contextTable: tableConfig.contextTable,
      helperTable: tableConfig.helperTable,
      hasHelperTable: tableConfig.hasHelperTable,
      teamUserTable: {
        ...DEFAULT_CONTEXT_METADATA.teamUserTable,
        ...tableConfig.teamUserTable,
      },
      teamWebsiteTable: {
        ...DEFAULT_CONTEXT_METADATA.teamWebsiteTable,
        ...tableConfig.teamWebsiteTable,
      },
    });
  }

  protected get contextAlias(): string {
    return this.tables.contextTable.alias;
  }

  protected get isMainTableContextAware(): boolean {
    return !this.tables.hasHelperTable;
  }

  protected applyContextRules(
    query: SelectQueryBuilder<T>,
    contexts: ContextEnum[] | undefined,
    securityContext: SecurityContext,
  ): void {
    const contextId = securityContext?.user?.context?.id;
    if (!contextId) {
      throw new Error('User does not have an associated context');
    }

    const { mainTable, contextTable, helperTable, hasHelperTable } = this.tables;

    if (hasHelperTable) {
      if (!helperTable) {
        throw new Error('helperTable metadata must be defined when hasHelperTable is true');
      }

      const isHelperAlreadyJoined = query.expressionMap.joinAttributes.some(
        (join) => join.alias.name === helperTable.alias,
      );

      if (!isHelperAlreadyJoined) {
        query.innerJoin(
          helperTable.table,
          helperTable.alias,
          `${helperTable.alias}.${helperTable.pk} = ${mainTable.alias}.${mainTable.fk}`,
        );
      }
    }

    const targetTable = hasHelperTable ? helperTable! : mainTable;

    const isContextAlreadyJoined = query.expressionMap.joinAttributes.some(
      (join) => join.alias.name === contextTable.alias,
    );

    if (!isContextAlreadyJoined) {
      query.innerJoin(
        contextTable.table,
        contextTable.alias,
        `${contextTable.alias}.${contextTable.fk} = ${targetTable.alias}.${targetTable.pk}`,
      );
    }

    if (contexts?.length) {
      query.andWhere(`${contextTable.alias}.context_id IN (:...contextIds)`, {
        contextIds: contexts.map((ctx) => getContextIdByCode(ctx)),
      });
    } else {
      query.andWhere(`${contextTable.alias}.context_id = :contextId`, {
        contextId,
      });
    }
  }

  protected async upsertContextRules(
    queryRunner: QueryRunner,
    relationIds: number[],
    contexts: ContextEnum[] | undefined,
    securityContext: SecurityContext,
  ): Promise<void> {
    if (!relationIds?.length) {
      return;
    }

    const resolvedIds: number[] =
      contexts && contexts.length > 0
        ? contexts
            .map((code) => getContextIdByCode(code))
            .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id))
        : [securityContext.user.context.id];

    const uniqueContextIds = Array.from(new Set(resolvedIds));

    if (uniqueContextIds.length === 0) {
      return;
    }

    const { contextTable } = this.tables;
    const query = `
    INSERT INTO ${contextTable.table} (${contextTable.fk}, context_id)
    SELECT rel.id, ctx.id
    FROM unnest($1::int[]) AS rel(id)
    CROSS JOIN unnest($2::int[]) AS ctx(id)
    ON CONFLICT (${contextTable.fk}, context_id) DO NOTHING
  `;

    await queryRunner.query(query, [relationIds, uniqueContextIds]);
  }
  protected customContextRuleQuery(
    query: WhereExpressionBuilder,
    securityContext: SecurityContext,
  ): void {
    const { mainTable, contextTable, teamUserTable, teamWebsiteTable, helperTable } = this.tables;
    const contextId = securityContext?.user?.context?.id;
    const userId = securityContext?.user?.id;

    if (!contextId || !userId) {
      throw new Error('Incomplete security context provided');
    }

    const relatedTable = this.isMainTableContextAware ? mainTable : helperTable;
    if (!relatedTable) {
      throw new Error('Relation target table cannot be undefined');
    }

    query.andWhere(
      `EXISTS (
        SELECT 1 FROM "${contextTable.table}" "${contextTable.alias}"
        WHERE "${contextTable.alias}"."${contextTable.fk}" = "${relatedTable.alias}"."${relatedTable.pk}"
          AND "${contextTable.alias}".context_id = :contextId
      )`,
      { contextId },
    );

    if (contextId !== ADMIN_CONTEXT_ID) {
      const joinHelper = helperTable
        ? `EXISTS (
            SELECT 1 FROM users_websites uw
            WHERE "${relatedTable.alias}".website_id = uw.website_id
              AND uw.user_id = :userId
          )`
        : '1=0';

      query.andWhere(
        new Brackets((qb) => {
          qb.where(joinHelper).orWhere(
            `EXISTS (
              SELECT 1 FROM "${teamWebsiteTable.table}" "${teamWebsiteTable.alias}" 
              INNER JOIN "${teamUserTable.table}" "${teamUserTable.alias}"
                ON "${teamUserTable.alias}".team_id = "${teamWebsiteTable.alias}".team_id
              WHERE "${teamWebsiteTable.alias}".website_id = "${relatedTable.alias}".website_id
                AND "${teamUserTable.alias}".user_id = :userId
            )`,
          );
        }),
        { userId },
      );
    }
  }
  protected async addContextRules(
    queryRunner: QueryRunner,
    relationIds: number[],
    contexts?: ContextEnum[],
    securityContext?: SecurityContext,
  ): Promise<void> {
    const cleanRelationIds = Array.from(new Set(relationIds))
      .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)
      .sort((a, b) => a - b);

    if (cleanRelationIds.length === 0) {
      return;
    }

    let resolvedIds: number[] = [];

    if (contexts !== undefined) {
      resolvedIds = contexts
        .map((code) => getContextIdByCode(code))
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id));
    } else if (securityContext?.user?.context?.id) {
      resolvedIds = [securityContext.user.context.id];
    }

    const uniqueContextIds = Array.from(new Set(resolvedIds)).sort((a, b) => a - b);

    if (uniqueContextIds.length === 0) {
      return;
    }

    const { contextTable } = this.tables;

    const insertQuery = `
    INSERT INTO "${contextTable.table}" ("${contextTable.fk}", context_id)
    SELECT r_id, c_id
    FROM unnest($1::int[]) AS r_id
    CROSS JOIN unnest($2::int[]) AS c_id
    ON CONFLICT ("${contextTable.fk}", context_id) DO NOTHING;
  `;

    const BATCH_SIZE = 1000;
    const idBatches = chunkArray(cleanRelationIds, BATCH_SIZE);

    for (const batch of idBatches) {
      await queryRunner.query(insertQuery, [batch, uniqueContextIds]);
    }
  }
  protected async substituteContextRules(
    queryRunner: QueryRunner,
    relationIds: number[],
    contexts?: ContextEnum[],
    securityContext?: SecurityContext,
  ): Promise<void> {
    const cleanRelationIds = Array.from(new Set(relationIds))
      .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)
      .sort((a, b) => a - b);

    if (cleanRelationIds.length === 0) {
      return;
    }

    let resolvedIds: number[] = [];

    if (contexts !== undefined) {
      resolvedIds = contexts
        .map((code) => getContextIdByCode(code))
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id));
    } else if (securityContext?.user?.context?.id) {
      resolvedIds = [securityContext.user.context.id];
    }

    const uniqueContextIds = Array.from(new Set(resolvedIds)).sort((a, b) => a - b);
    const { contextTable } = this.tables;

    const BATCH_SIZE = 1000;
    const idBatches = chunkArray(cleanRelationIds, BATCH_SIZE);

    if (uniqueContextIds.length === 0) {
      const clearQuery = `
      DELETE FROM "${contextTable.table}"
      WHERE "${contextTable.fk}" = ANY($1::int[]);
    `;

      for (const batch of idBatches) {
        await queryRunner.query(clearQuery, [batch]);
      }
      return;
    }

    // Caso 2: Sincronização diferencial em lote
    const syncQuery = `
    WITH target_pairs AS (
      SELECT r_id, c_id
      FROM unnest($1::int[]) AS r_id
      CROSS JOIN unnest($2::int[]) AS c_id
    ),
    pruned_associations AS (
      DELETE FROM "${contextTable.table}"
      WHERE "${contextTable.fk}" = ANY($1::int[])
        AND NOT (context_id = ANY($2::int[]))
    )
    INSERT INTO "${contextTable.table}" ("${contextTable.fk}", context_id)
    SELECT r_id, c_id
    FROM target_pairs
    ON CONFLICT ("${contextTable.fk}", context_id) DO NOTHING;
  `;

    for (const batch of idBatches) {
      await queryRunner.query(syncQuery, [batch, uniqueContextIds]);
    }
  }
}
