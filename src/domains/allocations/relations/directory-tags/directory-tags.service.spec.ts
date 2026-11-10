import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DirectoryTagsService } from 'src/domains/allocations/relations/directory-tags/directory-tags.service';
import { Directory } from 'src/domains/inventory/directory/directory.entity';
import { Tag } from 'src/domains/inventory/tag/tag.entity';

// Mock da função sanitizeDelta para isolar o teste unitário do serviço
jest.mock('../util', () => ({
  sanitizeDelta: (add: number[], remove: number[]) => ({
    add,
    remove,
  }),
}));

describe('DirectoryTagsService', () => {
  let service: DirectoryTagsService;
  let directoryRepo: Repository<Directory>;
  let dataSource: DataSource;

  const mockDirectoryRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn((entity) => {
      if (entity === Directory) return mockDirectoryRepo;
      if (entity === Tag) {
        return {
          find: jest.fn().mockResolvedValue([
            { id: 10, name: 'Tag 10' },
            { id: 20, name: 'Tag 20' },
            { id: 30, name: 'Tag 30' },
          ]),
        };
      }
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((callback) => callback(mockManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectoryTagsService,
        {
          provide: getRepositoryToken(Directory),
          useValue: mockDirectoryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DirectoryTagsService>(DirectoryTagsService);
    directoryRepo = module.get<Repository<Directory>>(getRepositoryToken(Directory));
    dataSource = module.get<DataSource>(DataSource);

    mockDataSource.transaction = jest.fn().mockImplementation((callback) => callback(mockManager));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTagsOnDirectory', () => {
    const directoryId = 1;

    it('should successfully return tags for a valid directory', async () => {
      const mockDirectory = {
        id: directoryId,
        tags: [{ id: 5, name: 'Existing Tag' }],
      };

      mockDirectoryRepo.findOne.mockResolvedValueOnce(mockDirectory);

      const result = await service.getTagsOnDirectory(directoryId);

      expect(result).toEqual(mockDirectory.tags);
      expect(mockDirectoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: directoryId },
        relations: ['tags'],
        select: {
          id: true,
          tags: { id: true, name: true },
        },
      });
    });

    it('should throw NotFoundException if directory does not exist', async () => {
      mockDirectoryRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.getTagsOnDirectory(directoryId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTagsOnDirectory', () => {
    const directoryId = 1;
    const actorId = 100;

    describe('Happy path', () => {
      it('should successfully add and remove tags within a transaction', async () => {
        const toAdd = [10, 20];
        const toRemove = [5];

        const mockDirectory = {
          id: directoryId,
          tags: [{ id: 5, name: 'Tag 5' }],
          updatedById: null,
        };

        mockDirectoryRepo.findOne.mockResolvedValueOnce(mockDirectory);
        mockDirectoryRepo.save.mockResolvedValueOnce({ ...mockDirectory });

        await service.updateTagsOnDirectory(directoryId, toAdd, toRemove, actorId);

        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
        expect(mockDirectory.updatedById).toBe(actorId);
        // Tag 5 removida, Tags 10 e 20 adicionadas
        expect(mockDirectory.tags).toEqual(expect.arrayContaining([{ id: 10 }, { id: 20 }]));
        expect(mockDirectory.tags.some((t) => t.id === 5)).toBeFalsy();
        expect(mockDirectoryRepo.save).toHaveBeenCalledWith(mockDirectory);
      });

      it('should successfully add tags when only add array is provided', async () => {
        const toAdd = [10];
        const toRemove: number[] = [];

        const mockDirectory = {
          id: directoryId,
          tags: [] as { id: number }[],
          updatedById: null,
        };

        mockDirectoryRepo.findOne.mockResolvedValueOnce(mockDirectory);
        mockDirectoryRepo.save.mockResolvedValueOnce({ ...mockDirectory });

        await service.updateTagsOnDirectory(directoryId, toAdd, toRemove, actorId);

        expect(mockDirectory.tags).toHaveLength(1);
        expect(mockDirectory.tags[0].id).toBe(10);
        expect(mockDirectory.updatedById).toBe(actorId);
      });

      it('should successfully remove tags when only remove array is provided', async () => {
        const toAdd: number[] = [];
        const toRemove = [5];

        const mockDirectory = {
          id: directoryId,
          tags: [{ id: 5, name: 'Tag 5' }],
          updatedById: null,
        };

        mockDirectoryRepo.findOne.mockResolvedValueOnce(mockDirectory);
        mockDirectoryRepo.save.mockResolvedValueOnce({ ...mockDirectory });

        await service.updateTagsOnDirectory(directoryId, toAdd, toRemove, actorId);

        expect(mockDirectory.tags).toHaveLength(0);
        expect(mockDirectory.updatedById).toBe(actorId);
      });
    });

    describe('Error Handling', () => {
      it('should throw NotFoundException if directory does not exist during update', async () => {
        mockDirectoryRepo.findOne.mockResolvedValueOnce(null);

        await expect(service.updateTagsOnDirectory(directoryId, [10], [], actorId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
