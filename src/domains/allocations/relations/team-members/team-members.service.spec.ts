import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { TeamMembersService } from './team-members.service';
import { TeamMembers } from './team-members.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';
import { Team } from 'src/domains/identity/team/team.entity';
import { User } from 'src/domains/identity/user/user.entity';

describe('TeamMembersService', () => {
  let service: TeamMembersService;
  let assignmentRepo: Repository<TeamMembers>;
  let outboxService: OutboxService;
  let mockManager: EntityManager;
  let mockTeamRepo: { findOne: jest.Mock };
  let mockUserRepo: { find: jest.Mock };
  let mockTeamMembersRepo: { find: jest.Mock; save: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    // Mock the Team repository returned by manager.getRepository(Team)
    mockTeamRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
    };

    // Mock the User repository: by default every requested id exists
    mockUserRepo = {
      find: jest
        .fn()
        .mockImplementation(async ({ where }) =>
          (where.id.value as number[]).map((id: number) => ({ id })),
        ),
    };

    // Mock the TeamMembers repository: by default nobody is a member yet
    mockTeamMembersRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
    };

    // Mock the EntityManager
    mockManager = {
      transaction: jest.fn((callback) => callback(mockManager)),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Team) return mockTeamRepo;
        if (entity === User) return mockUserRepo;
        if (entity === TeamMembers) return mockTeamMembersRepo;
        throw new Error(`Unexpected repository requested: ${String(entity)}`);
      }),
    } as unknown as EntityManager;

    // Mock the OutboxService
    const mockOutboxService = {
      putInOutbox: jest.fn().mockResolvedValue(undefined),
    };

    // Mock the Repository
    const mockRepository = {
      manager: mockManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamMembersService,
        {
          provide: getRepositoryToken(TeamMembers),
          useValue: mockRepository,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
      ],
    }).compile();

    service = module.get<TeamMembersService>(TeamMembersService);
    assignmentRepo = module.get<Repository<TeamMembers>>(getRepositoryToken(TeamMembers));
    outboxService = module.get<OutboxService>(OutboxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTeamMembers', () => {
    describe('Happy Path', () => {
      it('should successfully add members to a team', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4];
        const toRemove: number[] = [];

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockUserRepo.find).toHaveBeenCalledWith({
          where: { id: In(toAdd) },
          select: ['id'],
        });
        expect(mockTeamMembersRepo.find).toHaveBeenCalledWith({
          where: { teamId, userId: In(toAdd) },
        });
        expect(mockTeamMembersRepo.save).toHaveBeenCalledWith(
          toAdd.map((id) => ({ userId: id, teamId })),
        );
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(mockManager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: {
            action: AUTHORIZATION_ACTION.TEAM_ADD_MEMBER,
            resourceType: FGA_RESOURCE.TEAM,
            resourceId: teamId,
            teamId,
            userIds: toAdd,
          },
        });
      });

      it('should successfully remove members from a team', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3];

        const existingMembers = [
          { userId: 2, teamId },
          { userId: 3, teamId },
        ];

        mockTeamMembersRepo.find.mockResolvedValueOnce(existingMembers);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockTeamMembersRepo.find).toHaveBeenCalledWith({
          where: { teamId, userId: In(toRemove) },
        });
        expect(mockTeamMembersRepo.delete).toHaveBeenCalledWith({
          teamId,
          userId: In([2, 3]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(mockManager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: {
            action: AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER,
            resourceType: FGA_RESOURCE.TEAM,
            resourceId: teamId,
            teamId,
            userIds: [2, 3],
          },
        });
      });

      it('should add and remove members in the same call', async () => {
        const teamId = 1;
        const toAdd = [5, 6];
        const toRemove = [2, 3];

        mockTeamMembersRepo.find
          .mockResolvedValueOnce([
            // for remove check
            { userId: 2, teamId },
            { userId: 3, teamId },
          ])
          .mockResolvedValueOnce([]); // for add check

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockTeamMembersRepo.delete).toHaveBeenCalledWith({
          teamId,
          userId: In([2, 3]),
        });
        expect(mockTeamMembersRepo.save).toHaveBeenCalledWith([
          { userId: 5, teamId },
          { userId: 6, teamId },
        ]);
        expect(outboxService.putInOutbox).toHaveBeenCalledTimes(2);
      });

      it('should handle empty add and remove lists', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove: number[] = [];

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockUserRepo.find).not.toHaveBeenCalled();
        expect(mockTeamMembersRepo.find).not.toHaveBeenCalled();
        expect(mockTeamMembersRepo.save).not.toHaveBeenCalled();
        expect(mockTeamMembersRepo.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });
    });

    describe('Team validation', () => {
      it('should throw NotFoundException when the team does not exist', async () => {
        const teamId = 999;

        mockTeamRepo.findOne.mockResolvedValueOnce(null);

        await expect(service.updateTeamMembers(teamId, [2], [])).rejects.toThrow(NotFoundException);

        expect(mockTeamRepo.findOne).toHaveBeenCalledWith({
          where: { id: teamId },
        });
        expect(mockUserRepo.find).not.toHaveBeenCalled();
        expect(mockTeamMembersRepo.find).not.toHaveBeenCalled();
        expect(mockTeamMembersRepo.save).not.toHaveBeenCalled();
        expect(mockTeamMembersRepo.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should only add users that exist', async () => {
        const teamId = 1;

        mockUserRepo.find.mockResolvedValueOnce([{ id: 2 }, { id: 4 }]);

        await service.updateTeamMembers(teamId, [2, 3, 4], []);

        expect(mockTeamMembersRepo.save).toHaveBeenCalledWith([
          { userId: 2, teamId },
          { userId: 4, teamId },
        ]);
      });
      it('should deduplicate members in toAdd list', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 2, 3, 4]; // duplicates
        const toRemove: number[] = [];

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockUserRepo.find).toHaveBeenCalledWith({
          where: { id: In([2, 3, 4]) },
          select: ['id'],
        });
        expect(mockTeamMembersRepo.find).toHaveBeenCalledWith({
          where: { teamId, userId: In([2, 3, 4]) },
        });
        expect(mockTeamMembersRepo.save).toHaveBeenCalledWith(
          expect.arrayContaining([
            { userId: 2, teamId },
            { userId: 3, teamId },
            { userId: 4, teamId },
          ]),
        );
      });

      it('should deduplicate members in toRemove list', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 2, 3, 4]; // duplicates

        const existingMembers = [
          { userId: 2, teamId },
          { userId: 3, teamId },
          { userId: 4, teamId },
        ];

        mockTeamMembersRepo.find.mockResolvedValueOnce(existingMembers);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockTeamMembersRepo.find).toHaveBeenCalledWith({
          where: { teamId, userId: In([2, 3, 4]) },
        });
      });

      it('should not add members that already exist in the team', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4];
        const toRemove: number[] = [];

        // Simulate that users 2 and 3 already exist
        const existingMembers = [
          { userId: 2, teamId },
          { userId: 3, teamId },
        ];

        mockTeamMembersRepo.find.mockResolvedValueOnce(existingMembers);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        // Should only try to add user 4
        expect(mockTeamMembersRepo.save).toHaveBeenCalledWith([{ userId: 4, teamId }]);
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(mockManager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: {
            action: AUTHORIZATION_ACTION.TEAM_ADD_MEMBER,
            resourceType: FGA_RESOURCE.TEAM,
            resourceId: teamId,
            teamId,
            userIds: [4],
          },
        });
      });

      it('should not attempt to remove members that do not exist in the team', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4];

        // Simulate that only users 2 and 3 exist
        const existingMembers = [
          { userId: 2, teamId },
          { userId: 3, teamId },
        ];

        mockTeamMembersRepo.find.mockResolvedValueOnce(existingMembers);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        // Should only try to remove users 2 and 3, not 4
        expect(mockTeamMembersRepo.delete).toHaveBeenCalledWith({
          teamId,
          userId: In([2, 3]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(mockManager, {
          aggregateType: FGA_RESOURCE.TEAM,
          aggregateId: teamId,
          eventType: AuthorizationEvent.AUTHORIZATION,
          payload: {
            action: AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER,
            resourceType: FGA_RESOURCE.TEAM,
            resourceId: teamId,
            teamId,
            userIds: [2, 3],
          },
        });
      });

      it('should sanitize delta when same user appears in both add and remove lists', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4];
        const toRemove = [3, 5]; // 3 is in both lists

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        // Save should be called with members to add (after sanitization)
        expect(mockTeamMembersRepo.save).toHaveBeenCalled();
      });

      it('should not create outbox event if no members are added after deduplication and existence check', async () => {
        const teamId = 1;
        const toAdd = [2, 3];
        const toRemove: number[] = [];

        // Both members already exist
        const existingMembers = [
          { userId: 2, teamId },
          { userId: 3, teamId },
        ];

        mockTeamMembersRepo.find.mockResolvedValueOnce(existingMembers);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        // Should not call save if all members already exist
        expect(mockTeamMembersRepo.save).not.toHaveBeenCalled();
        // Should not create outbox event
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should not create outbox event if no members are removed', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4];

        // No members exist
        mockTeamMembersRepo.find.mockResolvedValueOnce([]);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockTeamMembersRepo.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should handle transaction correctly', async () => {
        const teamId = 1;
        const toAdd = [2];
        const toRemove: number[] = [];

        const transactionCallback = jest.fn();
        (mockManager.transaction as jest.Mock).mockImplementation((callback) => {
          transactionCallback(callback);
          return callback(mockManager);
        });

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockManager.transaction).toHaveBeenCalled();
        expect(transactionCallback).toHaveBeenCalled();
      });

      it('should handle large batch of members', async () => {
        const teamId = 1;
        const largeUserList = Array.from({ length: 1000 }, (_, i) => i + 1);
        const toAdd = largeUserList;
        const toRemove: number[] = [];

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(mockTeamMembersRepo.save).toHaveBeenCalledWith(
          expect.arrayContaining(largeUserList.map((id) => ({ userId: id, teamId }))),
        );
      });

      it('should call outbox service with correct payload structure for add operation', async () => {
        const teamId = 5;
        const toAdd = [10, 11];
        const toRemove: number[] = [];

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.TEAM_ADD_MEMBER,
              teamId,
              userIds: toAdd,
            }),
          }),
        );
      });

      it('should call outbox service with correct payload structure for remove operation', async () => {
        const teamId = 5;
        const toAdd: number[] = [];
        const toRemove = [10, 11];

        const existingMembers = [
          { userId: 10, teamId },
          { userId: 11, teamId },
        ];

        mockTeamMembersRepo.find.mockResolvedValueOnce(existingMembers);

        await service.updateTeamMembers(teamId, toAdd, toRemove);

        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER,
              teamId,
              userIds: [10, 11],
            }),
          }),
        );
      });
    });
  });
});
