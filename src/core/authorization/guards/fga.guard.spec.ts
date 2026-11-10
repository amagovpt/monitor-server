import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { FgaGuard } from './fga.guard';
import { FgaService } from '../fga.service';
import { FGA_DECORATOR_KEY } from '../decorators/fga-authorization.decorator';
import { FGA_RESOURCE, ResourceType } from '../types/fga.types';

describe('FgaGuard', () => {
  let guard: FgaGuard;
  let reflector: Reflector;
  let fgaService: FgaService;

  const mockReflector = {
    get: jest.fn(),
  };

  const mockFgaService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FgaGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: FgaService, useValue: mockFgaService },
      ],
    }).compile();

    guard = module.get<FgaGuard>(FgaGuard);
    reflector = module.get<Reflector>(Reflector);
    fgaService = module.get<FgaService>(FgaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockContext(requestPayload: any): ExecutionContext {
    const mockHandler = jest.fn();

    return {
      switchToHttp: () => ({
        getRequest: () => requestPayload,
      }),
      getHandler: () => mockHandler,
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('should return true if no FGA metadata is present on the handler', async () => {
    mockReflector.get.mockReturnValue(undefined);

    const context = createMockContext({});
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should extract user id and resource id and check permissions', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.get.mockReturnValue(mockFgaMetadata);
    mockFgaService.check.mockResolvedValue(true);

    const context = createMockContext({
      user: { id: 42 },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).toHaveBeenCalledWith('user:42', 'can_view', 'website:123');
  });

  it('should throw ForbiddenException if user is not authenticated', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.get.mockReturnValue(mockFgaMetadata);

    const context = createMockContext({
      user: null,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if resource ID cannot be resolved', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => undefined,
    };

    mockReflector.get.mockReturnValue(mockFgaMetadata);

    const context = createMockContext({
      user: { id: 42 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if object ID is not provided', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => undefined,
    };

    mockReflector.get.mockReturnValue(mockFgaMetadata);

    const context = createMockContext({
      user: { id: 42 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if permission check fails', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.get.mockReturnValue(mockFgaMetadata);
    mockFgaService.check.mockResolvedValue(false);

    const context = createMockContext({
      user: { id: 42 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).toHaveBeenCalledWith('user:42', 'can_view', 'website:123');
  });

  it('should return true if permission check passes', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.get.mockReturnValue(mockFgaMetadata);
    mockFgaService.check.mockResolvedValue(true);

    const context = createMockContext({
      user: { id: 42 },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReflector.get).toHaveBeenCalledWith(FGA_DECORATOR_KEY, context.getHandler());
    expect(mockFgaService.check).toHaveBeenCalledWith('user:42', 'can_view', 'website:123');
  });
});
