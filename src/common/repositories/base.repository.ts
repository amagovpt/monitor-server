import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Repository,
  DeleteResult,
  SelectQueryBuilder,
  In,
  FindOptionsWhere,
  EntityTarget,
  EntityNotFoundError,
  UpdateResult,
  QueryDeepPartialEntity,
} from 'typeorm';
import { chunkArray } from '../utils/utils';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from '../interfaces/types';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { IdentifiableModel } from '../interfaces/Identifiable.interface';

export type FilterMap<F, T extends IdentifiableModel> = {
  [P in keyof F]-?: (query: SelectQueryBuilder<T>, value: F[P]) => void;
};

export type SortingMap<S, T extends IdentifiableModel> = {
  [P in keyof S]-?: (query: SelectQueryBuilder<T>, order: SortCriteria) => void;
};

export type RelationColumnConfig = { field: string };

export type RelationProjection<T> = {
  [K in keyof T]?: RelationColumnConfig[];
};
export interface QueryRequest<F, S, P> {
  filters?: Partial<F>;
  sortings?: Partial<S>;
  pagination?: Partial<P>;
  securityContext?: SecurityContext;
}
export interface PaginationMetadata {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMetadata;
}

@Injectable()
export abstract class EntityRepository<
  T extends IdentifiableModel,
  F extends BaseFilter = BaseFilter,
  S extends BaseSort = BaseSort,
  P extends BasePagination = BasePagination,
> {
  constructor(
    protected readonly orm: Repository<T>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    this.maxPaginationLimit = this.configService.get<number>('PAGINATION_MAX_LIMIT', 100);
    this.primaryKey = this.orm.metadata.primaryColumns[0].propertyName;
  }
  protected readonly maxPaginationLimit: number;
  protected readonly primaryKey: string;
  protected abstract readonly alias: string;
  protected abstract readonly filterMap: FilterMap<F, T>;
  protected abstract readonly sortMap: SortingMap<S, T>;
  protected readonly DEFAULT_BATCH_SIZE = 500;

  public getOrmRepository(): Repository<T> {
    return this.orm;
  }

  async findOneBy(filters: Partial<F>): Promise<T | null> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, filters);
    const result = await query.getOne();
    return result || null;
  }
  /** Find entities based on dynamic filters, sorting, and pagination.
   *
   * @param filters
   * @param sorts
   * @param pagination
   * @returns { data: T[]; count: number }
   */

  async findMany(queryArgs: QueryRequest<F, S, P>): Promise<PaginationResponse<T>> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    const { page, limit } = this.applyPagination(query, queryArgs.pagination);
    const [data, count] = await query.getManyAndCount();
    const metadataPagination = this.calculatePaginationMeta(count, page, limit);
    return { data: data, meta: metadataPagination };
  }

  calculatePaginationMeta(count: number, page: number, pageSize: number) {
    const totalPages = Math.ceil(count / pageSize);
    return {
      currentPage: page,
      itemsPerPage: pageSize,
      totalItems: count,
      totalPages,
    };
  }
  async findManyProjected<R>(
    queryArgs: QueryRequest<F, S, P>,
    projection: (keyof T)[],
  ): Promise<PaginationResponse<R>> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);

    const selectColumns = projection.map((field) => `${this.alias}.${String(field)}`);
    query.select(selectColumns);
    const [entities, count] = await query.getManyAndCount();
    const metadataPagination = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10,
    );
    return { data: entities as unknown as R[], meta: metadataPagination };
  }

  async findManyCustom<R>(
    queryArgs: QueryRequest<F, S, P>,
    projection: (keyof T)[],
    relations: RelationProjection<T>,
  ): Promise<PaginationResponse<R>> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);

    const selectColumns = projection.map((field) => `${this.alias}.${String(field)}`);
    query.select(selectColumns);
    for (const [relationName, configs] of Object.entries(relations)) {
      if (!configs) continue;

      query.leftJoin(`${this.alias}.${relationName}`, relationName);

      for (const config of configs) {
        const dbColumn = `${relationName}.${config.field}`;

        query.addSelect(dbColumn);
      }
    }
    const [entities, count] = await query.getManyAndCount();
    const metadataPagination = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10,
    );
    return { data: entities as unknown as R[], meta: metadataPagination };
  }

  async findById(id: string | number): Promise<T | null> {
    return await this.orm.findOneBy({
      [this.primaryKey]: id,
    } as FindOptionsWhere<T>);
  }

  async findByIdOrFail(id: string | number): Promise<T> {
    return await this.orm.findOneByOrFail({
      [this.primaryKey]: id,
    } as FindOptionsWhere<T>);
  }

  async save(data: T): Promise<T> {
    return this.orm.save(data);
  }
  /*
   * Saves multiple entities in batches to optimize performance and reduce memory usage.
   * @param data - An array of entities to be saved.
   * @returns A promise that resolves to an array of saved entities.
   */
  async saveMany(data: T[]): Promise<T[]> {
    if (!data?.length) return [];

    const chunks = chunkArray(data, 10);
    const savedEntities: T[] = [];

    for (const chunk of chunks) {
      try {
        const results = await this.orm.save(chunk);
        savedEntities.push(...results);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.logger.error(`[${this.orm.metadata.name}] Failed to save chunk`, error.stack);
        throw error;
      }
    }

    return savedEntities;
  }

  async delete(id: string | number): Promise<DeleteResult> {
    return this.orm.delete({ [this.primaryKey]: id } as FindOptionsWhere<T>);
  }

  async deleteMany(ids: Array<string | number>): Promise<DeleteResult> {
    if (!ids || ids.length === 0) {
      return { raw: [], affected: 0 } as DeleteResult;
    }
    const result = await this.orm.delete({
      [this.primaryKey]: In(ids),
    } as FindOptionsWhere<T>);
    return result;
  }

  protected applyPagination(
    query: SelectQueryBuilder<T>,
    pagination?: Partial<P>,
  ): { page: number; limit: number } {
    const rawLimit = pagination?.limit ?? 10;
    const limit = Math.min(Math.max(1, rawLimit), this.maxPaginationLimit);
    const rawPage = pagination?.page ?? 1;
    const page = Math.max(1, rawPage);

    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);

    return { page, limit };
  }

  protected applyDynamicFilters(query: SelectQueryBuilder<T>, filters?: Partial<F>): void {
    if (!filters) return;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && this.filterMap[key as keyof F]) {
        this.filterMap[key as keyof F](query, value);
      }
    });
  }

  protected applyDynamicSorting(query: SelectQueryBuilder<T>, sorting?: Partial<S>): void {
    if (!sorting) return;

    Object.entries(sorting).forEach(([key, order]) => {
      if (order && this.sortMap[key as keyof S]) {
        this.sortMap[key as keyof S](query, (order as SortCriteria) || 'DESC');
      }
    });
  }

  async rawQuery(sql: string, parameters?: any[]): Promise<any> {
    return this.orm.query(sql, parameters);
  }

  protected getColumnName(propertyName: keyof T): string {
    const column = this.orm.metadata.findColumnWithPropertyName(String(propertyName));

    if (!column) {
      throw new Error(
        `[${this.orm.metadata.name}] Property "${String(propertyName)}" does not exist in the entity.`,
      );
    }
    return `${this.alias}.${column.databaseName}`;
  }

  protected addFilter(
    query: SelectQueryBuilder<T>,
    property: keyof T,
    value: any,
    operator: 'eq' | 'in' | 'like' = 'eq',
  ) {
    const col = this.getColumnName(property);
    const param = `p_${String(property)}`;

    if (operator === 'in' && Array.isArray(value) && value.length) {
      query.andWhere(`${col} IN (:...${param})`, { [param]: value });
    } else if (operator === 'like') {
      query.andWhere(`${col} LIKE :${param}`, { [param]: `%${value}%` });
    } else if (operator === 'eq') {
      query.andWhere(`${col} = :${param}`, { [param]: value });
    }
  }

  protected addSort(
    query: SelectQueryBuilder<T>,
    propertyName: keyof T,
    order: SortCriteria = 'ASC',
  ): void {
    const columnName = this.getColumnName(propertyName);

    query.addOrderBy(columnName, order);
  }

  async executeBatchWrite<B>(
    items: B[],
    processor: (batch: B[]) => Promise<void>,
    batchSize: number = this.DEFAULT_BATCH_SIZE,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await processor(batch);
    }
  }

  async executeBatchCount<B>(
    items: B[],
    processor: (batch: B[]) => Promise<number>,
    batchSize: number = this.DEFAULT_BATCH_SIZE,
  ): Promise<number> {
    let total = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      total += await processor(batch);
    }
    return total;
  }

  async findManyByProperties(properties: Partial<T>): Promise<T[]> {
    const query = this.orm.createQueryBuilder(this.alias);

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const column = this.orm.metadata.findColumnWithPropertyName(key);
        if (column) {
          this.addFilter(query, key as keyof T, value, 'eq');
        }
      }
    });

    return query.getMany();
  }
  async exists(filters: Partial<F>): Promise<boolean> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, filters);
    return query.getExists();
  }

  async existsOrFail(filters: Partial<F>, exception?: Error): Promise<void> {
    const found = await this.exists(filters);
    if (!found) {
      throw exception || new EntityNotFoundError(this.orm.target, filters);
    }
  }
  async upsert(
    entityLike: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
    conflictPaths: (keyof T)[],
  ): Promise<void> {
    await this.orm.upsert(entityLike, {
      conflictPaths: conflictPaths as string[],
    });
  }

  async upsertCustom(
    entityLike: QueryDeepPartialEntity<T>,
    conflictPaths: (keyof T)[],
    updateColumns: (keyof T)[],
  ): Promise<void> {
    await this.orm
      .createQueryBuilder()
      .insert()
      .into(this.orm.target)
      .values(entityLike)
      .orUpdate(updateColumns as string[], conflictPaths as string[])
      .execute();
  }
  async softDelete(id: string | number): Promise<DeleteResult> {
    this.assertHasSoftDeleteColumn();
    return this.orm.softDelete({ [this.primaryKey]: id } as FindOptionsWhere<T>);
  }
  async softDeleteMany(ids: (string | number)[]): Promise<DeleteResult> {
    this.assertHasSoftDeleteColumn();
    return this.orm.softDelete({ [this.primaryKey]: In(ids) } as FindOptionsWhere<T>);
  }

  async restore(id: string | number): Promise<UpdateResult> {
    this.assertHasSoftDeleteColumn();
    return this.orm.restore({ [this.primaryKey]: id } as FindOptionsWhere<T>);
  }

  async restoreMany(ids: (string | number)[]): Promise<UpdateResult> {
    this.assertHasSoftDeleteColumn();
    return this.orm.restore({ [this.primaryKey]: In(ids) } as FindOptionsWhere<T>);
  }

  async validateIdsEntity<E extends IdentifiableModel>(
    entityClass: EntityTarget<E>,
    ids: number[],
  ): Promise<void> {
    if (!ids || ids.length === 0) return;

    const uniqueIds = [...new Set(ids)];

    await this.executeBatchCount(uniqueIds, async (batch: number[]): Promise<number> => {
      const count = await this.getOrmRepository()
        .manager.getRepository(entityClass)
        .count({
          where: { id: In(batch) } as any,
        });

      if (count !== batch.length) {
        throw new BadRequestException('One or more provided IDs do not exist.');
      }
      return count;
    });
  }
  protected assertHasSoftDeleteColumn(): void {
    const hasSoftDeleteColumn = this.orm.metadata.columns.some(
      (column) => column.propertyName === 'deletedAt' || column.databaseName === 'deleted_at',
    );
    if (!hasSoftDeleteColumn) {
      throw new Error('Entity does not have a soft delete column.');
    }
  }
}
