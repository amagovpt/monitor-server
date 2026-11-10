import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, FindOperator, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TagWebsitesService } from './tag-website.service';
import { TagWebsite } from './tag-website.entity';
import { Tag } from 'src/domains/inventory/tag/tag.entity';
import { Website } from 'src/domains/inventory/website/website.entity';

describe('TagWebsitesService', () => {
  let service: TagWebsitesService;

  const websiteId = 1;
  const actorId = 100;

  // State used by the fake repositories
  let assignedTagIds: number[]; // tags already assigned to the website
  let existingTagIds: number[] | null; // tags that exist in the DB (null = all exist)

  // Injected repository (must NOT be used, everything runs through the transaction manager)
  const mockRepository = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  // Repositories returned by manager.getRepository(entity)
  const mockWebsiteRepo = { findOne: jest.fn() };
  const mockTagRepo = { find: jest.fn() };
  const mockTagWebsiteRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  const mockManager = { getRepository: jest.fn() };
  const mockDataSource = { transaction: jest.fn() };

  type WhereIn = { where: Record<string, FindOperator<number[]>> };
  const idsOf = (operator: FindOperator<number[]>): number[] => operator.value;

  const update = (
    add: number[],
    remove: number[],
    targetWebsiteId: number = websiteId,
    actor: number = actorId,
  ) => service.updateTagsOnWebsite(targetWebsiteId, add, remove, actor);

  beforeEach(async () => {
    jest.resetAllMocks();

    assignedTagIds = [];
    existingTagIds = null;

    mockWebsiteRepo.findOne.mockResolvedValue({ id: websiteId });

    mockTagRepo.find.mockImplementation(async ({ where }: WhereIn) =>
      idsOf(where.id)
        .filter((id) => existingTagIds === null || existingTagIds.includes(id))
        .map((id) => ({ id })),
    );

    mockTagWebsiteRepo.find.mockImplementation(async ({ where }: WhereIn) =>
      idsOf(where.tagId)
        .filter((id) => assignedTagIds.includes(id))
        .map((tagId) => ({ tagId, websiteId })),
    );
    mockTagWebsiteRepo.save.mockImplementation(async (entities: unknown) => entities);
    mockTagWebsiteRepo.delete.mockResolvedValue({ affected: 0 });

    mockManager.getRepository.mockImplementation((entity: unknown) => {
      if (entity === Website) return mockWebsiteRepo;
      if (entity === Tag) return mockTagRepo;
      if (entity === TagWebsite) return mockTagWebsiteRepo;
      throw new Error(`Unexpected repository requested: ${String(entity)}`);
    });

    mockDataSource.transaction.mockImplementation((callback) => callback(mockManager));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagWebsitesService,
        {
          provide: getRepositoryToken(TagWebsite),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TagWebsitesService>(TagWebsitesService);
  });

  describe('updateTagsOnWebsite', () => {
    describe('Happy path', () => {
      it('should add and remove tags in a single transaction', async () => {
        assignedTagIds = [5, 6];

        await update([10, 20, 30], [5, 6]);

        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([5, 6]),
        });
        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 10, websiteId, createdBy: actorId },
          { tagId: 20, websiteId, createdBy: actorId },
          { tagId: 30, websiteId, createdBy: actorId },
        ]);
      });

      it('should only add tags when the remove array is empty', async () => {
        await update([10, 20], []);

        expect(mockTagWebsiteRepo.delete).not.toHaveBeenCalled();
        expect(mockTagRepo.find).toHaveBeenCalledWith({
          where: { id: In([10, 20]) },
          select: ['id'],
        });
        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId, tagId: In([10, 20]) },
        });
        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 10, websiteId, createdBy: actorId },
          { tagId: 20, websiteId, createdBy: actorId },
        ]);
      });

      it('should only remove tags when the add array is empty', async () => {
        assignedTagIds = [5, 6];

        await update([], [5, 6]);

        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId, tagId: In([5, 6]) },
        });
        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([5, 6]),
        });
        expect(mockTagRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.save).not.toHaveBeenCalled();
      });

      it('should not change assignments when both arrays are empty', async () => {
        await update([], []);

        expect(mockTagRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.delete).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('Website validation', () => {
      it('should look up the website inside the transaction', async () => {
        await update([], []);

        expect(mockWebsiteRepo.findOne).toHaveBeenCalledWith({ where: { id: websiteId } });
      });

      it('should throw NotFoundException when the website does not exist', async () => {
        mockWebsiteRepo.findOne.mockResolvedValue(null);

        await expect(update([10], [5], 999)).rejects.toThrow(NotFoundException);
        await expect(update([10], [5], 999)).rejects.toThrow('Website with ID 999 does not exist');
      });

      it('should not touch tags or assignments when the website does not exist', async () => {
        mockWebsiteRepo.findOne.mockResolvedValueOnce(null);

        await expect(update([10], [5])).rejects.toThrow(NotFoundException);

        expect(mockTagRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.delete).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('Deduplication via sanitizeDelta', () => {
      it('should drop IDs that appear in both add and remove arrays', async () => {
        assignedTagIds = [20];

        await update([5, 10, 15], [5, 20]);

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([20]),
        });
        expect(mockTagRepo.find).toHaveBeenCalledWith({
          where: { id: In([10, 15]) },
          select: ['id'],
        });
        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 10, websiteId, createdBy: actorId },
          { tagId: 15, websiteId, createdBy: actorId },
        ]);
      });

      it('should do nothing when every ID conflicts', async () => {
        await update([1, 2, 3], [1, 2, 3]);

        expect(mockTagRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.delete).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.save).not.toHaveBeenCalled();
      });

      it('should handle partial conflicts', async () => {
        assignedTagIds = [10, 11];

        await update([1, 2, 3, 4, 5], [3, 4, 10, 11]);

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([10, 11]),
        });
        expect(mockTagRepo.find).toHaveBeenCalledWith({
          where: { id: In([1, 2, 5]) },
          select: ['id'],
        });
      });

      it('should remove duplicate IDs in the add array', async () => {
        await update([5, 5, 10, 10, 15], []);

        expect(mockTagRepo.find).toHaveBeenCalledWith({
          where: { id: In([5, 10, 15]) },
          select: ['id'],
        });
      });

      it('should remove duplicate IDs in the remove array', async () => {
        assignedTagIds = [5, 10];

        await update([], [5, 5, 10, 10]);

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([5, 10]),
        });
      });
    });

    describe('Existing tags and assignments handling', () => {
      it('should ignore tag IDs that do not exist', async () => {
        existingTagIds = [10];

        await update([10, 20], []);

        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId, tagId: In([10]) },
        });
        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 10, websiteId, createdBy: actorId },
        ]);
      });

      it('should not query or save assignments when none of the tags exist', async () => {
        existingTagIds = [];

        await update([10, 20], []);

        expect(mockTagWebsiteRepo.find).not.toHaveBeenCalled();
        expect(mockTagWebsiteRepo.save).not.toHaveBeenCalled();
      });

      it('should not insert tags that are already assigned', async () => {
        assignedTagIds = [10, 20];

        await update([10, 20, 30], []);

        expect(mockTagWebsiteRepo.save).toHaveBeenCalledTimes(1);
        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 30, websiteId, createdBy: actorId },
        ]);
      });

      it('should not save anything if all tags are already assigned', async () => {
        assignedTagIds = [10, 20];

        await update([10, 20], []);

        expect(mockTagWebsiteRepo.save).not.toHaveBeenCalled();
      });

      it('should only delete assignments that exist', async () => {
        assignedTagIds = [5];

        await update([], [5, 6]);

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([5]),
        });
      });

      it('should not delete anything if none of the tags are assigned', async () => {
        assignedTagIds = [];

        await update([], [5, 6]);

        expect(mockTagWebsiteRepo.delete).not.toHaveBeenCalled();
      });
    });

    describe('Array sizes and special values', () => {
      it('should handle a single tag addition', async () => {
        await update([42], []);

        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 42, websiteId, createdBy: actorId },
        ]);
      });

      it('should handle a single tag removal', async () => {
        assignedTagIds = [42];

        await update([], [42]);

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([42]),
        });
      });

      it('should handle large numbers of tags', async () => {
        const toAdd = Array.from({ length: 100 }, (_, i) => i + 1);
        const toRemove = Array.from({ length: 50 }, (_, i) => i + 101);
        assignedTagIds = toRemove;

        await update(toAdd, toRemove);

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In(toRemove),
        });
        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId, tagId: In(toAdd) },
        });
        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith(
          toAdd.map((tagId) => ({ tagId, websiteId, createdBy: actorId })),
        );
      });

      it('should handle zero values that conflict between arrays', async () => {
        await update([0, 1, 2], [0]);

        expect(mockTagWebsiteRepo.delete).not.toHaveBeenCalled();
        expect(mockTagRepo.find).toHaveBeenCalledWith({
          where: { id: In([1, 2]) },
          select: ['id'],
        });
      });

      it('should handle large numeric IDs', async () => {
        const toAdd = [2147483647, 1000000000];

        await update(toAdd, []);

        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId, tagId: In(toAdd) },
        });
      });
    });

    describe('WebsiteId and ActorId variations', () => {
      it('should handle the minimum websiteId (1)', async () => {
        await update([1], [], 1);

        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId: 1, tagId: In([1]) },
        });
      });

      it('should handle a large websiteId', async () => {
        const largeWebsiteId = 2147483647;

        await update([1], [], largeWebsiteId);

        expect(mockWebsiteRepo.findOne).toHaveBeenCalledWith({ where: { id: largeWebsiteId } });
        expect(mockTagWebsiteRepo.find).toHaveBeenCalledWith({
          where: { websiteId: largeWebsiteId, tagId: In([1]) },
        });
      });

      it('should pass actorId to the createdBy field', async () => {
        await update([1], [], websiteId, 999);

        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 1, websiteId, createdBy: 999 },
        ]);
      });

      it('should handle actorId as 0', async () => {
        await update([1], [], websiteId, 0);

        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId: 1, websiteId, createdBy: 0 },
        ]);
      });
    });

    describe('Error handling', () => {
      it('should propagate errors thrown by the transaction', async () => {
        const dbError = new Error('Database connection failed');
        mockDataSource.transaction.mockRejectedValueOnce(dbError);

        await expect(update([10], [])).rejects.toBe(dbError);
      });

      it('should propagate delete failures', async () => {
        const deleteError = new Error('Delete failed');
        assignedTagIds = [5];
        mockTagWebsiteRepo.delete.mockRejectedValueOnce(deleteError);

        await expect(update([], [5])).rejects.toBe(deleteError);
      });

      it('should propagate find failures', async () => {
        const findError = new Error('Find query failed');
        mockTagWebsiteRepo.find.mockRejectedValueOnce(findError);

        await expect(update([10], [])).rejects.toBe(findError);
      });

      it('should propagate save failures', async () => {
        const saveError = new Error('Insert failed');
        mockTagWebsiteRepo.save.mockRejectedValueOnce(saveError);

        await expect(update([10], [])).rejects.toBe(saveError);
      });
    });

    describe('Transaction isolation and atomicity', () => {
      it('should run all operations inside a single transaction', async () => {
        await update([10, 20], [5]);

        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
        expect(mockDataSource.transaction).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should use the transaction manager and not the injected repository', async () => {
        assignedTagIds = [5];

        await update([10], [5]);

        expect(mockRepository.delete).not.toHaveBeenCalled();
        expect(mockRepository.find).not.toHaveBeenCalled();
        expect(mockRepository.save).not.toHaveBeenCalled();

        expect(mockTagWebsiteRepo.delete).toHaveBeenCalled();
        expect(mockTagWebsiteRepo.find).toHaveBeenCalled();
        expect(mockTagWebsiteRepo.save).toHaveBeenCalled();
      });

      it('should remove tags before adding new ones', async () => {
        assignedTagIds = [5];
        const callOrder: string[] = [];

        mockTagWebsiteRepo.delete.mockImplementationOnce(async () => {
          callOrder.push('delete');
          return { affected: 1 };
        });
        mockTagWebsiteRepo.save.mockImplementationOnce(async () => {
          callOrder.push('save');
          return [];
        });

        await update([10, 20], [5]);

        expect(callOrder).toEqual(['delete', 'save']);
      });
    });

    describe('Idempotency and repeated operations', () => {
      it('should handle multiple sequential calls with the same data', async () => {
        await update([10], []);
        await update([10], []);

        expect(mockDataSource.transaction).toHaveBeenCalledTimes(2);
      });

      it('should correctly handle adding the same tag after removal', async () => {
        const tagId = 10;

        assignedTagIds = [tagId];
        await update([], [tagId]);
        expect(mockTagWebsiteRepo.delete).toHaveBeenCalledWith({
          websiteId,
          tagId: In([tagId]),
        });

        assignedTagIds = [];
        mockTagWebsiteRepo.save.mockClear();
        await update([tagId], []);

        expect(mockTagWebsiteRepo.save).toHaveBeenCalledWith([
          { tagId, websiteId, createdBy: actorId },
        ]);
      });
    });
  });
});
