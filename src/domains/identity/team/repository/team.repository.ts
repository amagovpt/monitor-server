import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseTransactionalRepository } from '@common/repositories/base-transactional.repository';
import { FilterMap, PaginationResponse, SortingMap } from '@common/repositories/base.repository';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { Team } from '../team.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { User } from '../../user/user.entity';
import { Website } from 'src/domains/inventory/website/website.entity';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';
import { SecurityContext } from 'src/core/authentication/interfaces/types';

export interface TeamFilter extends BaseFilter, Pick<Team, 'id' | 'teamName'> {
  id: number;
  teamName: string;
  searchTerm: string;
}

export interface TeamSorting extends BaseSort {
  id: SortCriteria;
  teamName: SortCriteria;
  createdAt: SortCriteria;
  updatedAt: SortCriteria;
  usersCount: SortCriteria;
  websitesCount: SortCriteria;
}

type TeamQueryRequest = {
  filters: Partial<TeamFilter>;
  sortings: Partial<TeamSorting>;
  pagination: Partial<BasePagination>;
  securityContext: SecurityContext;
};

@Injectable()
export class TeamRepository extends BaseTransactionalRepository<
  Team,
  TeamFilter,
  TeamSorting,
  BasePagination
> {
  constructor(
    @InjectRepository(Team) private readonly ormRepo: Repository<Team>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
    protected readonly outboxService: OutboxService,
  ) {
    super(ormRepo, logger, configService);
    this.logger.setContext(TeamRepository.name);
  }
  protected readonly alias = 'team';

  protected readonly filterMap: FilterMap<TeamFilter, Team> = {
    ids: (query, ids) => ids?.length && query.andWhere(`${this.alias}.id IN (:...ids)`, { ids }),
    id: (query, id) => query.andWhere(`${this.alias}.id = :id`, { id }),
    teamName: (query, teamName) =>
      query.andWhere(`${this.alias}.teamName = :teamName`, { teamName }),
    searchTerm: (query, term) =>
      query.andWhere(`(${this.alias}.teamName LIKE :term)`, { term: `%${term}%` }),
  };

  protected readonly sortMap: SortingMap<TeamSorting, Team> = {
    id: (query, order) => query.addOrderBy(`${this.alias}.id`, order),
    teamName: (query, order) => query.addOrderBy(`${this.alias}.teamName`, order),
    createdAt: (query, order) => query.addOrderBy(`${this.alias}.createdAt`, order),
    updatedAt: (query, order) => query.addOrderBy(`${this.alias}.updatedAt`, order),
    usersCount: (query, order) => query.addOrderBy(`${this.alias}.usersCount`, order),
    websitesCount: (query, order) => query.addOrderBy(`${this.alias}.websitesCount`, order),
  };

  public async getTeamById(teamId: number): Promise<Team> {
    const team = await this.ormRepo.findOneOrFail({
      where: { id: teamId },
    });
    return team;
  }

  async findMany(queryArgs: TeamQueryRequest): Promise<PaginationResponse<Team>> {
    const query = this.orm.createQueryBuilder(this.alias);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sortings);
    this.applyPagination(query, queryArgs.pagination);
    const [data, count] = await query.getManyAndCount();
    const metadataPagination = this.calculatePaginationMeta(
      count,
      queryArgs.pagination?.page ?? 1,
      queryArgs.pagination?.limit ?? 10,
    );
    return { data: data, meta: metadataPagination };
  }

  public createTeam(
    teamName: string,
    websiteIds: number[],
    userIds: number[],
    actorId: number,
  ): Promise<Team> {
    return this.runInTransaction(async (queryRunner) => {
      const manager = queryRunner.manager;
      if (websiteIds?.length > 0) {
        await this.validatingWebsiteIds(websiteIds);
      }
      if (userIds?.length > 0) {
        await this.validatingUserIds(userIds);
      }
      const team = new Team();
      team.teamName = teamName;
      team.createdById = actorId;

      const savedTeam = await manager.save(Team, team);

      await this.outboxService.putInOutbox(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: savedTeam.id,
        action: AUTHORIZATION_ACTION.TEAM_CREATE,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: savedTeam.id,
          action: AUTHORIZATION_ACTION.TEAM_CREATE,
          teamId: savedTeam.id,
        },
      });
      return savedTeam;
    });
  }

  public deleteTeam(id: number): Promise<void> {
    return this.runInTransaction(async (queryRunner) => {
      const manager = queryRunner.manager;
      const team = await manager.findOne(Team, { where: { id } });
      const usersTeamRaw: Array<{ user_id: number }> = await manager.query(
        `SELECT user_id FROM team_member WHERE team_id = $1`,
        [id],
      );
      const websitesTeamRaw: Array<{ website_id: number }> = await manager.query(
        `SELECT website_id FROM team_websites WHERE team_id = $1`,
        [id],
      );
      const websiteIds = websitesTeamRaw.map((row) => row.website_id);
      const userIds = usersTeamRaw.map((user) => user.user_id);
      if (!team) {
        throw new BadRequestException(`Team with id ${id} not found.`);
      }

      const updateResult = await queryRunner.manager.delete(Team, id);
      if (updateResult.affected === 0) {
        throw new Error(`Team with id ${id} not found.`);
      }

      await this.outboxService.putInOutbox(queryRunner.manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: team.id,
        action: AUTHORIZATION_ACTION.TEAM_DELETE,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: team.id,
          action: AUTHORIZATION_ACTION.TEAM_DELETE,
          teamId: team.id,
          websiteIds,
          userIds,
        },
      });
    });
  }

  async validatingWebsiteIds(websiteIds: number[]): Promise<void> {
    await this.executeBatchCount(websiteIds, async (batch: number[]): Promise<number> => {
      const uniqueWebsiteIds = [...new Set(batch)];
      const count = await this.getOrmRepository()
        .manager.getRepository(Website)
        .count({
          where: { id: In(uniqueWebsiteIds) },
        });
      if (count !== uniqueWebsiteIds.length) {
        throw new BadRequestException('One or more provided websiteIds do not exist.');
      }
      return count;
    });
  }

  async validatingUserIds(userIds: number[]): Promise<void> {
    await this.executeBatchCount(userIds, async (batch: number[]): Promise<number> => {
      const uniqueUserIds = [...new Set(batch)];
      const count = await this.getOrmRepository()
        .manager.getRepository(User)
        .count({
          where: { id: In(uniqueUserIds) },
        });
      if (count !== uniqueUserIds.length) {
        throw new BadRequestException('One or more provided userIds do not exist.');
      }
      return count;
    });
  }
}
