import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { TeamMembers } from './team-members.entity';
import { User } from 'src/domains/identity/user/user.entity';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { sanitizeDelta } from '../util';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';
import { Team } from 'src/domains/identity/team/team.entity';

@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger('TeamMembersService');

  constructor(
    @InjectRepository(TeamMembers)
    private readonly assignmentRepo: Repository<TeamMembers>,
    private readonly outboxService: OutboxService,
  ) {}

  async getTeamMembers(teamId: number): Promise<{ id: number; username: string }[]> {
    return await this.assignmentRepo
      .createQueryBuilder('assignment')
      .innerJoin('assignment.user', 'user')
      .select('user.id', 'id')
      .addSelect('user.username', 'username')
      .where('assignment.teamId = :teamId', { teamId })
      .getRawMany();
  }

  async updateTeamMembers(teamId: number, toAdd: number[], toRemove: number[]): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);

    await this.assignmentRepo.manager.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const teamExists = await teamRepo.findOne({ where: { id: teamId } });
      if (!teamExists) {
        throw new NotFoundException(`Team with ID ${teamId} does not exist`);
      }
      await this.handleRemoveMembers(sanitizedRemove, manager, teamId);
      await this.handleAddMembers(sanitizedAdd, manager, teamId);
    });
  }

  private async handleAddMembers(sanitizedAdd: number[], manager: EntityManager, teamId: number) {
    if (sanitizedAdd.length === 0) return;

    const userRepo = manager.getRepository(User);
    const teamMembersRepo = manager.getRepository(TeamMembers);

    const existingUsers = await userRepo.find({
      where: { id: In(sanitizedAdd) },
      select: ['id'],
    });

    const validUserIds = existingUsers.map((u) => u.id);
    if (validUserIds.length === 0) return;

    const filteredAdd = sanitizedAdd.filter((id) => validUserIds.includes(id));

    const existingAssignments = await teamMembersRepo.find({
      where: { teamId, userId: In(filteredAdd) },
    });

    const existingIds = new Set(existingAssignments.map((e) => e.userId));
    const toInsert = filteredAdd.filter((id) => !existingIds.has(id));

    if (toInsert.length > 0) {
      await teamMembersRepo.save(toInsert.map((userId) => ({ userId, teamId })));

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.TEAM_ADD_MEMBER,
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: teamId,
          teamId,
          userIds: toInsert,
        },
      });
    }
  }

  private async handleRemoveMembers(
    sanitizedRemove: number[],
    manager: EntityManager,
    teamId: number,
  ) {
    if (sanitizedRemove.length === 0) return;

    const teamMembersRepo = manager.getRepository(TeamMembers);

    const existing = await teamMembersRepo.find({
      where: { teamId, userId: In(sanitizedRemove) },
    });

    const existingIds = new Set(existing.map((e) => e.userId));
    const idsToRemove = sanitizedRemove.filter((id) => existingIds.has(id));

    if (idsToRemove.length > 0) {
      await teamMembersRepo.delete({ teamId, userId: In(idsToRemove) });

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER,
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: teamId,
          teamId,
          userIds: idsToRemove,
        },
      });
    }
  }
}
