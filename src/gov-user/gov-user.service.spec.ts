import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { GovUserService } from "./gov-user.service";
import { GovUser } from "./entities/gov-user.entity";
import { UserService } from "../user/user.service";
import { ConflictException } from "@nestjs/common";

describe("GovUserService", () => {
  let service: GovUserService;
  let mockRepository: any;
  let mockUserService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      query: jest.fn(),
    };

    mockUserService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovUserService,
        {
          provide: getRepositoryToken(GovUser),
          useValue: mockRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<GovUserService>(GovUserService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new GovUser", async () => {
      const createDto = {
        ccNumber: "12343444",
        name: "Teste Manel",
      };

      const newUser = {
        id: 1,
        ...createDto,
        registerDate: expect.any(Date),
        lastLogin: expect.any(Date),
      };

      mockRepository.findOne.mockResolvedValue(null); // No duplicates
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(createDto);
      expect(result).toEqual(newUser);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2); // Check ccNumber and name
    });

    it("should throw ConflictException if ccNumber already exists", async () => {
      const createDto = {
        ccNumber: "12343444",
        name: "Teste Manel",
      };

      const existingUser = { id: 1, ccNumber: "12343444", name: "Other Name" };
      mockRepository.findOne.mockResolvedValue(existingUser); // CC exists

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          "GovUser with citizen card number '12343444' already exists"
        )
      );
    });

    it("should throw ConflictException if name already exists", async () => {
      const createDto = {
        ccNumber: "12343444",
        name: "Teste Manel",
      };

      const existingUser = { id: 1, ccNumber: "99999999", name: "Teste Manel" };
      mockRepository.findOne
        .mockResolvedValueOnce(null) // CC doesn't exist
        .mockResolvedValueOnce(existingUser); // Name exists

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException("GovUser with name 'Teste Manel' already exists")
      );
    });
  });

  describe("update", () => {
    it("should update a GovUser", async () => {
      const updateDto = {
        id: 1,
        name: "Teste José",
      };

      const updatedUser = {
        id: 1,
        name: "Teste José",
        ccNumber: "12343444",
      };

      mockRepository.findOne.mockResolvedValue(null); // No duplicates
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(updateDto);
      expect(result).toEqual(updatedUser);
    });

    it("should throw ConflictException if updating to duplicate name", async () => {
      const updateDto = {
        id: 1,
        name: "Teste José",
      };

      const existingUser = { id: 2, name: "Teste José" };
      mockRepository.findOne.mockResolvedValue(existingUser); // Duplicate name found

      await expect(service.update(updateDto)).rejects.toThrow(ConflictException);
    });
  });
});
