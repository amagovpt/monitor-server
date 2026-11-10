import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { UserWebsite } from './user-websites.entity';
import { User } from 'src/domains/identity/user/user.entity';
import { Website } from 'src/domains/inventory/website/website.entity';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent, PermissionKey } from 'src/core/authorization/queue/payload.types';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { sanitizeDelta } from '../util';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';

@Injectable()
export class UserWebsitesService {
  private readonly logger = new Logger('UserWebsitesService');

  constructor(
    @InjectRepository(UserWebsite)
    private readonly assignmentRepo: Repository<UserWebsite>,
    private readonly outboxService: OutboxService,
  ) {}

  async getUserWebsites(userId: number): Promise<{ id: number; baseUrl: string }[]> {
    return await this.assignmentRepo
      .createQueryBuilder('assignment')
      .innerJoin('assignment.website', 'website')
      .select('website.id', 'id')
      .addSelect('website.baseUrl', 'baseUrl')
      .where('assignment.userId = :userId', { userId })
      .getRawMany();
  }

  async updateUserWebsites(userId: number, toAdd: number[], toRemove: number[]): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);
    await this.assignmentRepo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const userExists = await userRepo.findOne({ where: { id: userId } });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} does not exist`);
      }
      const permission: PermissionKey = userExists.permission;
      if (!permission) {
        throw new NotFoundException(`Permission for user with ID ${userId} not found`);
      }

      await this.handleRemoveWebsites(sanitizedRemove, manager, userId);
      await this.handleAddWebsites(sanitizedAdd, manager, userId, permission);
    });
  }

  private async handleAddWebsites(
    sanitizedAdd: number[],
    manager: EntityManager,
    userId: number,
    permission: PermissionKey,
  ) {
    if (sanitizedAdd.length === 0) return;

    const websiteRepo = manager.getRepository(Website);
    const userWebsiteRepo = manager.getRepository(UserWebsite);

    const existingWebsites = await websiteRepo.find({
      where: { id: In(sanitizedAdd) },
      select: ['id'],
    });

    const validWebsiteIds = existingWebsites.map((w) => w.id);
    if (validWebsiteIds.length === 0) return;

    const filteredAdd = sanitizedAdd.filter((id) => validWebsiteIds.includes(id));

    const existingAssignments = await userWebsiteRepo.find({
      where: { userId, websiteId: In(filteredAdd) },
    });

    const existingIds = new Set(existingAssignments.map((e) => e.websiteId));
    const toInsert = filteredAdd.filter((id) => !existingIds.has(id));

    if (toInsert.length > 0) {
      await userWebsiteRepo.save(toInsert.map((websiteId) => ({ websiteId, userId })));

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: userId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
          resourceType: FGA_RESOURCE.USER,
          permission: permission,
          resourceId: userId,
          websiteIds: toInsert,
        },
      });
    }
  }

  private async handleRemoveWebsites(
    sanitizedRemove: number[],
    manager: EntityManager,
    userId: number,
  ) {
    if (sanitizedRemove.length === 0) return;

    const userWebsiteRepo = manager.getRepository(UserWebsite);

    const existing = await userWebsiteRepo.find({
      where: { userId, websiteId: In(sanitizedRemove) },
    });

    const existingIds = new Set(existing.map((e) => e.websiteId));
    const idsToRemove = sanitizedRemove.filter((id) => existingIds.has(id));

    if (idsToRemove.length > 0) {
      await userWebsiteRepo.delete({
        userId,
        websiteId: In(idsToRemove),
      });

      await this.outboxService.putInOutbox(manager, {
        aggregateType: FGA_RESOURCE.USER,
        aggregateId: userId,
        eventType: AuthorizationEvent.AUTHORIZATION,
        payload: {
          action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
          resourceType: FGA_RESOURCE.USER,
          resourceId: userId,
          websiteIds: idsToRemove,
        },
      });
    }
  }
}
