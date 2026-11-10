import { Test, TestingModule } from '@nestjs/testing';
import { TagWebsitesController } from './tag-websites.controller';
import { TagWebsitesService } from './tag-website.service';
import { UpdateWebsiteTagsDto } from './dtos/tag-website-update.dto';
import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';

describe('TagWebsitesController', () => {
  let controller: TagWebsitesController;
  let service: TagWebsitesService;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 1,
    username: 'testuser',
    role_slug: RoleSlug.ADMIN,
    context: {
      id: 1,
      code: 'MONITOR',
    },
  };

  const mockService = {
    updateTagsOnWebsite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagWebsitesController],
      providers: [
        {
          provide: TagWebsitesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideGuard(RolesGuard)
      .useValue({})
      .overrideGuard(FgaGuard)
      .useValue({})
      .compile();

    controller = module.get<TagWebsitesController>(TagWebsitesController);
    service = module.get<TagWebsitesService>(TagWebsitesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /websites/:websiteId/tags', () => {
    describe('Happy path', () => {
      it('should successfully update tags when both add and remove arrays are provided', async () => {
        const websiteId = 1;
        const dto: UpdateWebsiteTagsDto = {
          add: [10, 20, 30],
          remove: [5, 6],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          dto.add,
          dto.remove,
          mockAuthenticatedUser.id,
        );
        expect(service.updateTagsOnWebsite).toHaveBeenCalledTimes(1);
      });

      it('should successfully update tags when only add array is provided', async () => {
        const websiteId = 5;
        const dto: UpdateWebsiteTagsDto = {
          add: [100, 200],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          dto.add,
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should successfully update tags when only remove array is provided', async () => {
        const websiteId = 3;
        const dto: UpdateWebsiteTagsDto = {
          remove: [5, 10],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [],
          dto.remove,
          mockAuthenticatedUser.id,
        );
      });
    });

    describe('Edge cases - Input validation', () => {
      it('should handle empty add array', async () => {
        const websiteId = 2;
        const dto: UpdateWebsiteTagsDto = {
          add: [],
          remove: [1, 2],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [],
          [1, 2],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle empty remove array', async () => {
        const websiteId = 4;
        const dto: UpdateWebsiteTagsDto = {
          add: [5, 10],
          remove: [],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [5, 10],
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle both arrays being empty (no-op)', async () => {
        const websiteId = 6;
        const dto: UpdateWebsiteTagsDto = {
          add: [],
          remove: [],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [],
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle neither add nor remove provided (both undefined)', async () => {
        const websiteId = 7;
        const dto: UpdateWebsiteTagsDto = {};

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [],
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle large tag ID numbers', async () => {
        const websiteId = 999999;
        const dto: UpdateWebsiteTagsDto = {
          add: [2147483647, 1000000000],
          remove: [999999999],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          dto.add,
          dto.remove,
          mockAuthenticatedUser.id,
        );
      });

      it('should handle duplicate IDs in add array', async () => {
        const websiteId = 8;
        const dto: UpdateWebsiteTagsDto = {
          add: [5, 5, 10, 10, 15],
          remove: [],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        // Should pass duplicates to service (service handles sanitization)
        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [5, 5, 10, 10, 15],
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle same ID in both add and remove arrays', async () => {
        const websiteId = 9;
        const dto: UpdateWebsiteTagsDto = {
          add: [5, 10, 15],
          remove: [10, 20],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        // Should pass both arrays as-is to service (service handles logic)
        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [5, 10, 15],
          [10, 20],
          mockAuthenticatedUser.id,
        );
      });
    });

    describe('Edge cases - WebsiteId variations', () => {
      it('should handle minimum valid websiteId (1)', async () => {
        const websiteId = 1;
        const dto: UpdateWebsiteTagsDto = {
          add: [1],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          1,
          [1],
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle very large websiteId', async () => {
        const websiteId = 2147483647; // Max 32-bit signed integer
        const dto: UpdateWebsiteTagsDto = {
          add: [1, 2],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [1, 2],
          [],
          mockAuthenticatedUser.id,
        );
      });
    });

    describe('Edge cases - Service errors', () => {
      it('should throw InternalServerErrorException when service fails', async () => {
        const websiteId = 10;
        const dto: UpdateWebsiteTagsDto = {
          add: [1, 2],
        };

        const errorMessage = 'Database connection failed';
        mockService.updateTagsOnWebsite.mockRejectedValueOnce(
          new InternalServerErrorException(errorMessage),
        );

        await expect(controller.updateTags(mockAuthenticatedUser, websiteId, dto)).rejects.toThrow(
          InternalServerErrorException,
        );

        expect(service.updateTagsOnWebsite).toHaveBeenCalledTimes(1);
      });

      it('should propagate service errors with original message', async () => {
        const websiteId = 11;
        const dto: UpdateWebsiteTagsDto = {
          remove: [5],
        };

        const error = new Error('Transaction failed');
        mockService.updateTagsOnWebsite.mockRejectedValueOnce(error);

        await expect(controller.updateTags(mockAuthenticatedUser, websiteId, dto)).rejects.toThrow(
          error,
        );
      });

      it('should handle timeout errors from service', async () => {
        const websiteId = 12;
        const dto: UpdateWebsiteTagsDto = {
          add: [1, 2, 3],
          remove: [4, 5, 6],
        };

        const timeoutError = new Error('Database query timeout');
        mockService.updateTagsOnWebsite.mockRejectedValueOnce(timeoutError);

        await expect(controller.updateTags(mockAuthenticatedUser, websiteId, dto)).rejects.toThrow(
          timeoutError,
        );
      });
    });

    describe('Edge cases - User context', () => {
      it('should pass the correct authenticated user ID to service', async () => {
        const websiteId = 13;
        const dto: UpdateWebsiteTagsDto = { add: [1] };
        const customUser: AuthenticatedUser = {
          id: 999,
          username: 'customuser',
          role_slug: RoleSlug.ADMIN,
          context: {
            id: 1,
            code: 'MONITOR',
          },
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(customUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(websiteId, [1], [], 999);
      });

      it('should handle user with ID 0 (edge case)', async () => {
        const websiteId = 14;
        const dto: UpdateWebsiteTagsDto = { add: [1] };
        const userWithZeroId: AuthenticatedUser = {
          id: 0,
          username: 'system',
          role_slug: RoleSlug.ADMIN,
          context: {
            id: 1,
            code: 'MONITOR',
          },
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(userWithZeroId, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(websiteId, [1], [], 0);
      });

      it('should handle user with negative ID (hypothetical edge case)', async () => {
        const websiteId = 15;
        const dto: UpdateWebsiteTagsDto = { add: [1] };
        const userWithNegativeId: AuthenticatedUser = {
          id: -1,
          username: 'testuser',
          role_slug: RoleSlug.ADMIN,
          context: {
            id: 1,
            code: 'MONITOR',
          },
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(userWithNegativeId, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(websiteId, [1], [], -1);
      });
    });

    describe('Edge cases - Array size variations', () => {
      it('should handle single item in add array', async () => {
        const websiteId = 16;
        const dto: UpdateWebsiteTagsDto = {
          add: [42],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [42],
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle many items in add array (100+)', async () => {
        const websiteId = 17;
        const addIds = Array.from({ length: 150 }, (_, i) => i + 1);
        const dto: UpdateWebsiteTagsDto = {
          add: addIds,
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          addIds,
          [],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle asymmetric array sizes (many adds, few removes)', async () => {
        const websiteId = 18;
        const addIds = Array.from({ length: 100 }, (_, i) => i + 1);
        const removeIds = [1, 2];
        const dto: UpdateWebsiteTagsDto = {
          add: addIds,
          remove: removeIds,
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          addIds,
          removeIds,
          mockAuthenticatedUser.id,
        );
      });

      it('should handle asymmetric array sizes (few adds, many removes)', async () => {
        const websiteId = 19;
        const addIds = [1];
        const removeIds = Array.from({ length: 100 }, (_, i) => i + 1);
        const dto: UpdateWebsiteTagsDto = {
          add: addIds,
          remove: removeIds,
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          addIds,
          removeIds,
          mockAuthenticatedUser.id,
        );
      });
    });

    describe('Edge cases - Special numeric values', () => {
      it('should handle zero values in arrays', async () => {
        const websiteId = 20;
        const dto: UpdateWebsiteTagsDto = {
          add: [0, 1, 2],
          remove: [0],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [0, 1, 2],
          [0],
          mockAuthenticatedUser.id,
        );
      });

      it('should handle negative tag IDs (edge case)', async () => {
        const websiteId = 21;
        const dto: UpdateWebsiteTagsDto = {
          add: [-1, -5, 10],
          remove: [-10],
        };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledWith(
          websiteId,
          [-1, -5, 10],
          [-10],
          mockAuthenticatedUser.id,
        );
      });
    });

    describe('Integration edge cases', () => {
      it('should handle rapid successive calls from same user', async () => {
        const websiteId = 22;
        const dto1: UpdateWebsiteTagsDto = { add: [1] };
        const dto2: UpdateWebsiteTagsDto = { add: [2] };
        const dto3: UpdateWebsiteTagsDto = { add: [3] };

        mockService.updateTagsOnWebsite.mockResolvedValue(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto1);
        await controller.updateTags(mockAuthenticatedUser, websiteId, dto2);
        await controller.updateTags(mockAuthenticatedUser, websiteId, dto3);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledTimes(3);
      });

      it('should handle calls with same data (idempotency check)', async () => {
        const websiteId = 23;
        const dto: UpdateWebsiteTagsDto = { add: [1, 2], remove: [3] };

        mockService.updateTagsOnWebsite.mockResolvedValue(undefined);

        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);
        await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(service.updateTagsOnWebsite).toHaveBeenCalledTimes(2);
        expect(service.updateTagsOnWebsite).toHaveBeenNthCalledWith(
          1,
          websiteId,
          [1, 2],
          [3],
          mockAuthenticatedUser.id,
        );
        expect(service.updateTagsOnWebsite).toHaveBeenNthCalledWith(
          2,
          websiteId,
          [1, 2],
          [3],
          mockAuthenticatedUser.id,
        );
      });
    });

    describe('Response validation', () => {
      it('should return void (undefined) on successful update', async () => {
        const websiteId = 24;
        const dto: UpdateWebsiteTagsDto = { add: [1] };

        mockService.updateTagsOnWebsite.mockResolvedValueOnce(undefined);

        const result = await controller.updateTags(mockAuthenticatedUser, websiteId, dto);

        expect(result).toBeUndefined();
      });
    });
  });
});
