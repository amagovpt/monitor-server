import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { TeamWebsites } from './team-websites.entity';
import { Website } from 'src/domains/inventory/website/website.entity';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';
import { sanitizeDelta } from '../util';
import { Team } from 'src/domains/identity/team/team.entity';

@Injectable()
export class TeamWebsitesService {
  constructor(
    @InjectRepository(TeamWebsites)
    private readonly assignmentRepo: Repository<TeamWebsites>,
    private readonly outboxService: OutboxService,
  ) {}

  async getTeamWebsites(teamId: number): Promise<{ id: number; baseUrl: string }[]> {
    return await this.assignmentRepo
      .createQueryBuilder('assignment')
      .innerJoin('assignment.website', 'website')
      .select('website.id', 'id')
      .addSelect('website.baseUrl', 'baseUrl')
      .where('assignment.teamId = :teamId', { teamId })
      .getRawMany();
  }

  async updateTeamWebsites(teamId: number, toAdd: number[], toRemove: number[]): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);

    await this.assignmentRepo.manager.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const teamExists = await teamRepo.findOne({ where: { id: teamId } });
      if (!teamExists) {
        throw new BadRequestException(`Team with ID ${teamId} does not exist`);
      }
      await this.handleRemoveWebsites(sanitizedRemove, manager, teamId);
      await this.handleAddWebsites(sanitizedAdd, manager, teamId);
    });
  }

  private async handleAddWebsites(sanitizedAdd: number[], manager: EntityManager, teamId: number) {
    if (sanitizedAdd.length === 0) return;

    const websiteRepo = manager.getRepository(Website);
    const teamWebsitesRepo = manager.getRepository(TeamWebsites);

    const existingWebsites = await websiteRepo.find({
      where: { id: In(sanitizedAdd) },
      select: ['id'],
    });

    const validWebsiteIds = existingWebsites.map((w) => w.id);
    if (validWebsiteIds.length === 0) return;

    const filteredAdd = sanitizedAdd.filter((id) => validWebsiteIds.includes(id));

    const existingAssignments = await teamWebsitesRepo.find({
      where: { teamId, websiteId: In(filteredAdd) },
    });

    const existingIds = new Set(existingAssignments.map((e) => e.websiteId));
    const toInsert = filteredAdd.filter((id) => !existingIds.has(id));

    if (toInsert.length > 0) {
      await teamWebsitesRepo.save(toInsert.map((id) => ({ websiteId: id, teamId })));

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE,
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: teamId,
          teamId,
          websiteIds: toInsert,
        },
      });
    }
  }

  private async handleRemoveWebsites(
    sanitizedRemove: number[],
    manager: EntityManager,
    teamId: number,
  ) {
    if (sanitizedRemove.length === 0) return;

    const teamWebsitesRepo = manager.getRepository(TeamWebsites);

    const existing = await teamWebsitesRepo.find({
      where: { teamId, websiteId: In(sanitizedRemove) },
    });

    const existingIds = new Set(existing.map((e) => e.websiteId));
    const idsToRemove = sanitizedRemove.filter((id) => existingIds.has(id));

    if (idsToRemove.length > 0) {
      await teamWebsitesRepo.delete({ teamId, websiteId: In(idsToRemove) });

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.TEAM,
        aggregateId: teamId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE,
          resourceType: FGA_RESOURCE.TEAM,
          resourceId: teamId,
          teamId,
          websiteIds: idsToRemove,
        },
      });
    }
  }
}
