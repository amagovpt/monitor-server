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
    getAllAndOverride: jest.fn(),
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
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const context = createMockContext({});
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should extract user id and resource id and check permissions', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.getAllAndOverride.mockReturnValue(mockFgaMetadata);
    mockFgaService.check.mockResolvedValue(true);

    const context = createMockContext({
      user: { id: 42 },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).toHaveBeenCalledWith('user:42', 'can_view', 'website:123');
  });

  it('should throw ForbiddenException if user is not authenticated', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.getAllAndOverride.mockReturnValue(mockFgaMetadata);

    const context = createMockContext({
      user: null,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if resource ID cannot be resolved', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => undefined,
    };

    mockReflector.getAllAndOverride.mockReturnValue(mockFgaMetadata);

    const context = createMockContext({
      user: { id: 42 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if object ID is not provided', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => undefined,
    };

    mockReflector.getAllAndOverride.mockReturnValue(mockFgaMetadata);

    const context = createMockContext({
      user: { id: 42 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if permission check fails', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.getAllAndOverride.mockReturnValue(mockFgaMetadata);
    mockFgaService.check.mockResolvedValue(false);

    const context = createMockContext({
      user: { id: 42 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).toHaveBeenCalledWith('user:42', 'can_view', 'website:123');
  });

  it('should return true if permission check passes', async () => {
    const mockFgaMetadata = {
      objectType: FGA_RESOURCE.WEBSITE,
      action: 'can_view',
      resourceIdResolver: (ctx: ExecutionContext) => '123',
    };

    mockReflector.getAllAndOverride.mockReturnValue(mockFgaMetadata);
    mockFgaService.check.mockResolvedValue(true);

    const context = createMockContext({
      user: { id: 42 },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(FGA_DECORATOR_KEY, [context.getHandler(), expect.anything()]);
    expect(mockFgaService.check).toHaveBeenCalledWith('user:42', 'can_view', 'website:123');
  });

  describe('multiple tuples (OR)', () => {
    const tuple = (id: string | undefined, action = 'can_view') => ({
      objectType: FGA_RESOURCE.WEBSITE,
      action,
      resourceIdResolver: () => id,
    });

    it('grants access if any tuple passes, stopping at the first success', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([tuple('1'), tuple('2', 'can_edit'), tuple('3')]);
      mockFgaService.check.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      await expect(guard.canActivate(createMockContext({ user: { id: 42 } }))).resolves.toBe(true);
      expect(mockFgaService.check).toHaveBeenCalledTimes(2);
      expect(mockFgaService.check).toHaveBeenLastCalledWith('user:42', 'can_edit', 'website:2');
    });

    it('denies if all tuples fail', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([tuple('1'), tuple('2')]);
      mockFgaService.check.mockResolvedValue(false);

      await expect(guard.canActivate(createMockContext({ user: { id: 42 } }))).rejects.toThrow(ForbiddenException);
      expect(mockFgaService.check).toHaveBeenCalledTimes(2);
    });

    it('skips an unresolvable tuple but still evaluates the others', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([tuple(undefined), tuple('2')]);
      mockFgaService.check.mockResolvedValue(true);

      await expect(guard.canActivate(createMockContext({ user: { id: 42 } }))).resolves.toBe(true);
      expect(mockFgaService.check).toHaveBeenCalledTimes(1);
    });

    it('denies if no tuple can be resolved', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([tuple(undefined), tuple(undefined)]);

      await expect(guard.canActivate(createMockContext({ user: { id: 42 } }))).rejects.toThrow(ForbiddenException);
      expect(mockFgaService.check).not.toHaveBeenCalled();
    });

    it('denies on an empty list (fail-closed)', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      await expect(guard.canActivate(createMockContext({ user: { id: 42 } }))).rejects.toThrow(ForbiddenException);
      expect(mockFgaService.check).not.toHaveBeenCalled();
    });
  });
});
