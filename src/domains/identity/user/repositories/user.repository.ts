import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PermissionLevel, User } from '../user.entity';
import { BaseTransactionalRepository } from '@common/repositories/base-transactional.repository';
import { FilterMap, PaginationResponse, SortingMap } from '@common/repositories/base.repository';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { RoleSlug, UserPermission } from 'src/core/authentication/interfaces/types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';

export interface UserFilter extends BaseFilter, Pick<User, 'id' | 'username'> {
  id: number;
  username: string;
  searchTerm: string;
  role: string;
  permissionLevel: UserPermission;
}

export interface UserSorting extends BaseSort {
  id: SortCriteria;
  username: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
  lastLogin: SortCriteria;
  role: SortCriteria;
  permissionLevel: SortCriteria;
}

type UserQueryRequest = {
  filters?: Partial<UserFilter>;
  sortings?: Partial<UserSorting>;
  pagination?: Partial<BasePagination>;
  securityContext: SecurityContext;
};

@Injectable()
export class UserRepository extends BaseTransactionalRepository<User, UserFilter, UserSorting> {
  constructor(
    @InjectRepository(User) private readonly ormRepo: Repository<User>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    protected readonly outboxService: OutboxService,
  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(UserRepository.name);
  }
  protected readonly alias = 'user';

  protected readonly filterMap: FilterMap<UserFilter, User> = {
    ids: (query, ids) => ids?.length && query.andWhere(`${this.alias}.id IN (:...ids)`, { ids }),
    id: (query, id) => query.andWhere(`${this.alias}.id = :id`, { id }),
    username: (query, username) =>
      query.andWhere(`${this.alias}.username = :username`, { username }),
    searchTerm: (query, term) =>
      query.andWhere(`(${this.alias}.username ILIKE :term)`, { term: `%${term}%` }),
    role: (query, role) => query.andWhere(`role.slug = :role`, { role }),
    permissionLevel: (query, permissionLevel) =>
      query.andWhere(`${this.alias}.permission_level = :permissionLevel`, { permissionLevel }),
  };

  protected readonly sortMap: SortingMap<UserSorting, User> = {
    id: (query, order) => query.addOrderBy(`${this.alias}.id`, order),
    username: (query, order) => query.addOrderBy(`${this.alias}.username`, order),
    createdAt: (query, order) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order) => query.addOrderBy(`${this.alias}.updatedAt`, order),
    lastLogin: (query, order) => query.addOrderBy(`${this.alias}.lastLogin`, order),
    role: (query, order) => query.addOrderBy(`role.displayName`, order),
    permissionLevel: (query, order) => query.addOrderBy(`${this.alias}.permission_level`, order),
  };
  async findManyWithMetadata(queryArgs: UserQueryRequest): Promise<PaginationResponse<User>> {
    const { filters, sortings, pagination } = queryArgs;
    const connection = this.getOrmRepository().manager.connection;

    const query = connection.createQueryBuilder().from(User, this.alias);
    const countQuery = connection.createQueryBuilder().from(User, this.alias);

    // 1. PRIMEIRO: Aplicar os Joins necessários em ambas as queries (essencial para que filtros e ordenações por 'role' funcionem)
    this.joinUserRole(query);
    this.joinUserRole(countQuery);

    // 2. SEGUNDO: Aplicar filtros e ordenação dinâmica com as tabelas já ligadas no contexto
    this.applyDynamicFilters(query, filters);
    this.applyDynamicSorting(query, sortings);

    this.applyDynamicFilters(countQuery, filters);
    countQuery.select(`COUNT(${this.alias}.id)`, 'total');

    // 3. TERCEIRO: Definir a projeção dos campos (SELECT) e colunas computadas
    query.select([
      `${this.alias}.id AS id`,
      `${this.alias}.username AS username`,
      `${this.alias}.created_at AS "createdAt"`,
      `${this.alias}.updated_at AS "updatedAt"`,
      `${this.alias}.last_login AS "lastLogin"`,
      `${this.alias}.permission AS "permission"`,
      `json_build_object(
        'id', role.id,
        'displayName', role.display_name,
        'description', role.description
      ) AS role`,
      `( SELECT COUNT(1) FROM team_member TM WHERE TM.user_id = ${this.alias}.id) AS "teamCount"`,
      `( SELECT COUNT(1) FROM users_websites UW WHERE UW.user_id = ${this.alias}.id) AS "websiteCount"`,
    ]);

    // 4. QUARTO: Paginação e execução paralela
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

  async joinUserRole(query: SelectQueryBuilder<User>): Promise<void> {
    query.leftJoin('roles', 'role', `role.id = ${this.alias}.role_id`);
  }

  async findByUniqueCriteria(criteria: {
    ccNumber?: string;
    username: string;
  }): Promise<User[] | null> {
    const { ccNumber, username } = criteria;

    const whereConditions: FindOptionsWhere<User>[] = [{ username }];

    if (ccNumber) {
      whereConditions.push({ ccNumber });
    }

    return this.ormRepo.find({
      where: whereConditions,
    });
  }

  async createUser(user: User, role: RoleSlug, permission: PermissionLevel): Promise<User> {
    return this.runInTransaction(async (queryRunner) => {
      const savedUser = await queryRunner.manager.save(User, user);
      const manager = queryRunner.manager;
      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: savedUser.id,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.USER,
          resourceId: savedUser.id,
          action: AUTHORIZATION_ACTION.USER_CREATE,
          userId: savedUser.id,
          role: role,
          permission: permission,
        },
      });

      return savedUser;
    });
  }

  async updateUser(
    user: User,
    options: {
      role: RoleSlug;
      newRoleSlug?: RoleSlug;
      permission: PermissionLevel;
      newPermission?: PermissionLevel;
    },
  ): Promise<User> {
    const hasAuthorizationChanges = Boolean(options.newRoleSlug || options.newPermission);

    if (!hasAuthorizationChanges) {
      return this.getOrmRepository().save(user);
    }

    return this.runInTransaction(async (queryRunner) => {
      const updatedUser = await queryRunner.manager.save(User, user);
      const manager = queryRunner.manager;

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: updatedUser.id,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.USER_UPDATE,
          resourceType: FGA_RESOURCE.USER,
          resourceId: updatedUser.id,
          userId: updatedUser.id,
          role: options.role,
          permission: options.permission,
          newRole: options.newRoleSlug,
          newPermission: options.newPermission,
        },
      });

      return updatedUser;
    });
  }

  async deleteUser(userId: number): Promise<void> {
    return this.runInTransaction(async (queryRunner) => {
      await queryRunner.manager.delete(User, { id: userId });
      const manager = queryRunner.manager;

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: userId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        action: AUTHORIZATION_ACTION.USER_DELETE,
        payload: {
          resourceType: FGA_RESOURCE.USER,
          resourceId: userId,
          action: AUTHORIZATION_ACTION.USER_DELETE,
        },
      });
    });
  }
}
