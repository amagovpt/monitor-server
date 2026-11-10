import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FindOperator, In } from 'typeorm';
import { UserWebsitesService } from './user-websites.service';
import { UserWebsite } from './user-websites.entity';
import { User } from 'src/domains/identity/user/user.entity';
import { Website } from 'src/domains/inventory/website/website.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent, PermissionKey } from 'src/core/authorization/queue/payload.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';

describe('UserWebsitesService', () => {
  let service: UserWebsitesService;

  const userId = 1;
  const permission = 'editor' as unknown as PermissionKey;

  // State used by the fake repositories
  let assignedWebsiteIds: number[]; // websites already assigned to the user
  let existingWebsiteIds: number[] | null; // websites that exist in the DB (null = all exist)

  // Repositories returned by manager.getRepository(entity)
  const mockUserRepo = { findOne: jest.fn() };
  const mockWebsiteRepo = { find: jest.fn() };
  const mockUserWebsiteRepo = {
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  };

  // Injected repository: only its `manager` is used by the service
  const mockAssignmentRepo = { manager: mockManager };

  const mockOutboxService = { putInOutbox: jest.fn() };

  type WhereIn = { where: Record<string, FindOperator<number[]>> };
  const idsOf = (operator: FindOperator<number[]>): number[] => operator.value;

  const update = (add: number[], remove: number[], targetUserId: number = userId) =>
    service.updateUserWebsites(targetUserId, add, remove);

  const addEvent = (websiteIds: number[], uid: number = userId) => ({
    aggregateType: FGA_RESOURCE.USER,
    aggregateId: uid,
    eventType: AuthorizationEvent.AUTHORIZATION,
    payload: {
      action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
      resourceType: FGA_RESOURCE.USER,
      permission,
      resourceId: uid,
      websiteIds,
    },
  });

  const removeEvent = (websiteIds: number[], uid: number = userId) => ({
    aggregateType: FGA_RESOURCE.USER,
    aggregateId: uid,
    eventType: AuthorizationEvent.AUTHORIZATION,
    payload: {
      action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
      resourceType: FGA_RESOURCE.USER,
      resourceId: uid,
      websiteIds,
    },
  });

  const expectNothingTouched = () => {
    expect(mockWebsiteRepo.find).not.toHaveBeenCalled();
    expect(mockUserWebsiteRepo.find).not.toHaveBeenCalled();
    expect(mockUserWebsiteRepo.save).not.toHaveBeenCalled();
    expect(mockUserWebsiteRepo.delete).not.toHaveBeenCalled();
    expect(mockOutboxService.putInOutbox).not.toHaveBeenCalled();
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    assignedWebsiteIds = [];
    existingWebsiteIds = null;

    mockUserRepo.findOne.mockResolvedValue({ id: userId, permission });

    mockWebsiteRepo.find.mockImplementation(async ({ where }: WhereIn) =>
      idsOf(where.id)
        .filter((id) => existingWebsiteIds === null || existingWebsiteIds.includes(id))
        .map((id) => ({ id })),
    );

    mockUserWebsiteRepo.find.mockImplementation(async ({ where }: WhereIn) =>
      idsOf(where.websiteId)
        .filter((id) => assignedWebsiteIds.includes(id))
        .map((websiteId) => ({ websiteId, userId })),
    );
    mockUserWebsiteRepo.save.mockImplementation(async (entities: unknown) => entities);
    mockUserWebsiteRepo.delete.mockResolvedValue({ affected: 0 });

    mockManager.getRepository.mockImplementation((entity: unknown) => {
      if (entity === User) return mockUserRepo;
      if (entity === Website) return mockWebsiteRepo;
      if (entity === UserWebsite) return mockUserWebsiteRepo;
      throw new Error(`Unexpected repository requested: ${String(entity)}`);
    });

    mockManager.transaction.mockImplementation((callback) => callback(mockManager));
    mockOutboxService.putInOutbox.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWebsitesService,
        { provide: getRepositoryToken(UserWebsite), useValue: mockAssignmentRepo },
        { provide: OutboxService, useValue: mockOutboxService },
      ],
    }).compile();

    service = module.get<UserWebsitesService>(UserWebsitesService);
  });

  describe('updateUserWebsites', () => {
    describe('Happy path', () => {
      it('should add websites to a user', async () => {
        await update([2, 3, 4], []);

        expect(mockManager.transaction).toHaveBeenCalledTimes(1);
        expect(mockWebsiteRepo.find).toHaveBeenCalledWith({
          where: { id: In([2, 3, 4]) },
          select: ['id'],
        });
        expect(mockUserWebsiteRepo.find).toHaveBeenCalledWith({
          where: { userId, websiteId: In([2, 3, 4]) },
        });
        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith([
          { websiteId: 2, userId },
          { websiteId: 3, userId },
          { websiteId: 4, userId },
        ]);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledTimes(1);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          addEvent([2, 3, 4]),
        );
      });

      it('should remove websites from a user', async () => {
        assignedWebsiteIds = [2, 3];

        await update([], [2, 3]);

        expect(mockUserWebsiteRepo.find).toHaveBeenCalledWith({
          where: { userId, websiteId: In([2, 3]) },
        });
        expect(mockUserWebsiteRepo.delete).toHaveBeenCalledWith({
          userId,
          websiteId: In([2, 3]),
        });
        expect(mockWebsiteRepo.find).not.toHaveBeenCalled();
        expect(mockUserWebsiteRepo.save).not.toHaveBeenCalled();
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledTimes(1);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          removeEvent([2, 3]),
        );
      });

      it('should add and remove websites in the same call', async () => {
        assignedWebsiteIds = [2, 3];

        await update([5, 6], [2, 3]);

        expect(mockUserWebsiteRepo.delete).toHaveBeenCalledWith({
          userId,
          websiteId: In([2, 3]),
        });
        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith([
          { websiteId: 5, userId },
          { websiteId: 6, userId },
        ]);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledTimes(2);
        expect(mockOutboxService.putInOutbox).toHaveBeenNthCalledWith(
          1,
          mockManager,
          removeEvent([2, 3]),
        );
        expect(mockOutboxService.putInOutbox).toHaveBeenNthCalledWith(
          2,
          mockManager,
          addEvent([5, 6]),
        );
      });

      it('should not change anything when both arrays are empty', async () => {
        await update([], []);

        expectNothingTouched();
      });
    });

    describe('User validation', () => {
      it('should look up the user inside the transaction', async () => {
        await update([], []);

        expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      });

      it('should throw NotFoundException when the user does not exist', async () => {
        mockUserRepo.findOne.mockResolvedValue(null);

        await expect(update([10], [5], 999)).rejects.toThrow(NotFoundException);
        await expect(update([10], [5], 999)).rejects.toThrow('User with ID 999 does not exist');
      });

      it('should throw NotFoundException when the user has no permission', async () => {
        mockUserRepo.findOne.mockResolvedValue({ id: userId, permission: undefined });

        await expect(update([10], [5])).rejects.toThrow(NotFoundException);
        await expect(update([10], [5])).rejects.toThrow(
          `Permission for user with ID ${userId} not found`,
        );
      });

      it('should not touch websites, assignments or outbox when the user does not exist', async () => {
        mockUserRepo.findOne.mockResolvedValue(null);

        await expect(update([10], [5])).rejects.toThrow(NotFoundException);

        expectNothingTouched();
      });

      it('should not touch websites, assignments or outbox when the user has no permission', async () => {
        mockUserRepo.findOne.mockResolvedValue({ id: userId, permission: undefined });

        await expect(update([10], [5])).rejects.toThrow(NotFoundException);

        expectNothingTouched();
      });
    });

    describe('Deduplication via sanitizeDelta', () => {
      it('should remove duplicate IDs in the add array', async () => {
        await update([2, 3, 2, 3, 4], []);

        expect(mockWebsiteRepo.find).toHaveBeenCalledWith({
          where: { id: In([2, 3, 4]) },
          select: ['id'],
        });
        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith([
          { websiteId: 2, userId },
          { websiteId: 3, userId },
          { websiteId: 4, userId },
        ]);
      });

      it('should remove duplicate IDs in the remove array', async () => {
        assignedWebsiteIds = [2, 3, 4];

        await update([], [2, 3, 2, 3, 4]);

        expect(mockUserWebsiteRepo.find).toHaveBeenCalledWith({
          where: { userId, websiteId: In([2, 3, 4]) },
        });
        expect(mockUserWebsiteRepo.delete).toHaveBeenCalledWith({
          userId,
          websiteId: In([2, 3, 4]),
        });
      });

      it('should drop IDs that appear in both add and remove arrays', async () => {
        assignedWebsiteIds = [5];

        await update([2, 3, 4], [3, 5]);

        expect(mockUserWebsiteRepo.delete).toHaveBeenCalledWith({
          userId,
          websiteId: In([5]),
        });
        expect(mockWebsiteRepo.find).toHaveBeenCalledWith({
          where: { id: In([2, 4]) },
          select: ['id'],
        });
        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith([
          { websiteId: 2, userId },
          { websiteId: 4, userId },
        ]);
      });

      it('should do nothing when every ID conflicts', async () => {
        await update([1, 2, 3], [1, 2, 3]);

        expectNothingTouched();
      });
    });

    describe('Existing websites and assignments handling', () => {
      it('should ignore website IDs that do not exist', async () => {
        existingWebsiteIds = [2];

        await update([2, 3], []);

        expect(mockUserWebsiteRepo.find).toHaveBeenCalledWith({
          where: { userId, websiteId: In([2]) },
        });
        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith([{ websiteId: 2, userId }]);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(mockManager, addEvent([2]));
      });

      it('should not query assignments, save or emit events when none of the websites exist', async () => {
        existingWebsiteIds = [];

        await update([2, 3], []);

        expect(mockUserWebsiteRepo.find).not.toHaveBeenCalled();
        expect(mockUserWebsiteRepo.save).not.toHaveBeenCalled();
        expect(mockOutboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should not insert websites that are already assigned', async () => {
        assignedWebsiteIds = [2, 3];

        await update([2, 3, 4], []);

        expect(mockUserWebsiteRepo.save).toHaveBeenCalledTimes(1);
        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith([{ websiteId: 4, userId }]);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledTimes(1);
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(mockManager, addEvent([4]));
      });

      it('should not save or emit an event if all websites are already assigned', async () => {
        assignedWebsiteIds = [2, 3];

        await update([2, 3], []);

        expect(mockUserWebsiteRepo.save).not.toHaveBeenCalled();
        expect(mockOutboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should only delete assignments that exist', async () => {
        assignedWebsiteIds = [2, 3];

        await update([], [2, 3, 4]);

        expect(mockUserWebsiteRepo.delete).toHaveBeenCalledWith({
          userId,
          websiteId: In([2, 3]),
        });
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          removeEvent([2, 3]),
        );
      });

      it('should handle removing a partial match out of several IDs', async () => {
        assignedWebsiteIds = [10, 30, 50];

        await update([], [10, 20, 30, 40, 50]);

        expect(mockUserWebsiteRepo.delete).toHaveBeenCalledWith({
          userId,
          websiteId: In([10, 30, 50]),
        });
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          removeEvent([10, 30, 50]),
        );
      });

      it('should not delete or emit an event if none of the websites are assigned', async () => {
        assignedWebsiteIds = [];

        await update([], [2, 3, 4]);

        expect(mockUserWebsiteRepo.delete).not.toHaveBeenCalled();
        expect(mockOutboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should keep the requested order of IDs in the removal payload', async () => {
        assignedWebsiteIds = [10, 30, 50];

        await update([], [50, 10, 30]);

        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          removeEvent([50, 10, 30]),
        );
      });
    });

    describe('Outbox payload', () => {
      it('should include the user permission in the add event', async () => {
        const otherPermission = 'viewer' as unknown as PermissionKey;
        mockUserRepo.findOne.mockResolvedValue({ id: 5, permission: otherPermission });

        await update([10, 11], [], 5);

        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: 5,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
              resourceType: FGA_RESOURCE.USER,
              resourceId: 5,
              permission: otherPermission,
              websiteIds: [10, 11],
            }),
          }),
        );
      });

      it('should not include the permission in the remove event', async () => {
        assignedWebsiteIds = [10, 11];

        await update([], [10, 11]);

        const [, event] = mockOutboxService.putInOutbox.mock.calls[0];
        expect(event.payload).not.toHaveProperty('permission');
      });
    });

    describe('Large inputs', () => {
      it('should handle a large batch of websites', async () => {
        const toAdd = Array.from({ length: 1000 }, (_, i) => i + 1);

        await update(toAdd, []);

        expect(mockUserWebsiteRepo.save).toHaveBeenCalledWith(
          toAdd.map((websiteId) => ({ websiteId, userId })),
        );
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(mockManager, addEvent(toAdd));
      });
    });

    describe('Error handling', () => {
      it('should propagate errors thrown by the transaction', async () => {
        const dbError = new Error('Database connection failed');
        mockManager.transaction.mockRejectedValueOnce(dbError);

        await expect(update([10], [])).rejects.toBe(dbError);
      });

      it('should propagate delete failures', async () => {
        const deleteError = new Error('Delete failed');
        assignedWebsiteIds = [5];
        mockUserWebsiteRepo.delete.mockRejectedValueOnce(deleteError);

        await expect(update([], [5])).rejects.toBe(deleteError);
        expect(mockOutboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should propagate save failures', async () => {
        const saveError = new Error('Insert failed');
        mockUserWebsiteRepo.save.mockRejectedValueOnce(saveError);

        await expect(update([10], [])).rejects.toBe(saveError);
        expect(mockOutboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should propagate outbox failures', async () => {
        const outboxError = new Error('Outbox failed');
        mockOutboxService.putInOutbox.mockRejectedValueOnce(outboxError);

        await expect(update([10], [])).rejects.toBe(outboxError);
      });
    });

    describe('Transaction isolation and ordering', () => {
      it('should run everything inside the repository manager transaction', async () => {
        assignedWebsiteIds = [5];

        await update([10], [5]);

        expect(mockManager.transaction).toHaveBeenCalledTimes(1);
        expect(mockManager.transaction).toHaveBeenCalledWith(expect.any(Function));
        expect(mockOutboxService.putInOutbox).toHaveBeenCalledWith(mockManager, expect.anything());
      });

      it('should remove websites before adding new ones', async () => {
        assignedWebsiteIds = [5];
        const callOrder: string[] = [];

        mockUserWebsiteRepo.delete.mockImplementationOnce(async () => {
          callOrder.push('delete');
          return { affected: 1 };
        });
        mockUserWebsiteRepo.save.mockImplementationOnce(async () => {
          callOrder.push('save');
          return [];
        });

        await update([10, 20], [5]);

        expect(callOrder).toEqual(['delete', 'save']);
      });
    });
  });
});
