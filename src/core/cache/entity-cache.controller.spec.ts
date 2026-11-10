import { Controller, Get, Param, Query, Body } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { CacheableBy } from './decorator/cache-resource.decorator';
import { EntityCacheInterceptor } from './interceptor/entity-cache.interceptor';
import { AppCacheService } from './cache.service';

@Controller('identifiers-matrix-test')
class IdentifierMatrixController {
  // --- PATH STRATEGIES ---
  @Get('users/:userId')
  @CacheableBy({ key: 'user_metrics', source: 'path', param: 'userId' })
  getUserByCamelCase(@Param('userId') userId: string) {
    return { userId };
  }

  @Get('organizations/:organization_id')
  @CacheableBy({ key: 'org_stats', source: 'path', param: 'organization_id' })
  getOrgBySnakeCase(@Param('organization_id') orgId: string) {
    return { orgId };
  }

  @Get('tenants/:tenant-slug')
  @CacheableBy({ key: 'tenant_data', source: 'path', param: 'tenant-slug' })
  getTenantByKebabCase(@Param('tenant-slug') slug: string) {
    return { slug };
  }

  @Get('modules/:ModuleId')
  @CacheableBy({ key: 'module_info', source: 'path', param: 'ModuleId' })
  getModuleByPascalCase(@Param('ModuleId') moduleId: string) {
    return { moduleId };
  }

  // --- QUERY STRATEGIES ---
  @Get('search-target')
  @CacheableBy({ key: 'analytics_target', source: 'query', param: 'targetId' })
  getAnalyticsByQuery(@Query('targetId') targetId: string) {
    return { targetId };
  }

  @Get('filter-bracket')
  @CacheableBy({ key: 'bracket_search', source: 'query', param: 'filter[tag]' })
  getByBracketParam(@Query('filter[tag]') tag: string) {
    return { tag };
  }

  @Get('search-wildcard')
  @CacheableBy({ key: 'wildcard_query', source: 'query', param: '*' })
  getByWildcardQuery(@Query() query: any) {
    return { query };
  }

  // --- BODY STRATEGIES ---
  @Get('batch-report')
  @CacheableBy({ key: 'batch_uuid', source: 'body', param: 'correlationId' })
  getReportByUuid(@Body('correlationId') correlationId: string) {
    return { correlationId };
  }

  @Get('flag-check')
  @CacheableBy({ key: 'feature_flag', source: 'body', param: 'isEnabled' })
  getByBooleanParam(@Body('isEnabled') isEnabled: boolean) {
    return { isEnabled };
  }

  @Get('rank-index')
  @CacheableBy({ key: 'rank_position', source: 'body', param: 'index' })
  getByNumericZeroParam(@Body('index') index: number) {
    return { index };
  }

  @Get('body-wildcard')
  @CacheableBy({ key: 'wildcard_body', source: 'body', param: '*' })
  getByWildcardBody(@Body() body: any) {
    return { body };
  }
}

describe('EntityCacheInterceptor - Exhaustive Controller Parameter Matrix', () => {
  let interceptor: EntityCacheInterceptor;
  let cacheServiceMock: jest.Mocked<AppCacheService>;
  let controller: IdentifierMatrixController;

  beforeEach(async () => {
    cacheServiceMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<AppCacheService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdentifierMatrixController],
      providers: [
        EntityCacheInterceptor,
        {
          provide: AppCacheService,
          useValue: cacheServiceMock,
        },
      ],
    }).compile();

    interceptor = module.get<EntityCacheInterceptor>(EntityCacheInterceptor);
    controller = module.get<IdentifierMatrixController>(IdentifierMatrixController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockContext(handler: Function, req: Partial<any>): any {
    return {
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          params: {},
          query: {},
          body: {},
          ...req,
        }),
      }),
    };
  }

  function createCallHandler(returnValue: any): any {
    return {
      handle: () => ({
        subscribe: (observer: any) => {
          observer.next(returnValue);
          observer.complete();
        },
        pipe: () => {},
      }),
    };
  }

  describe('Convenções de Casing e Naming de Identificadores', () => {
    it('deve extrair identifier em camelCase (:userId)', async () => {
      const context = createMockContext(controller.getUserByCamelCase, {
        params: { userId: 'usr_abc123' },
      });
      const next = createCallHandler({ userId: 'usr_abc123' });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:user_metrics:usr_abc123');
    });

    it('deve extrair identifier em snake_case (:organization_id)', async () => {
      const context = createMockContext(controller.getOrgBySnakeCase, {
        params: { organization_id: 'org_gov_99' },
      });
      const next = createCallHandler({ orgId: 'org_gov_99' });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:org_stats:org_gov_99');
    });

    it('deve extrair identifier em kebab-case (:tenant-slug)', async () => {
      const context = createMockContext(controller.getTenantByKebabCase, {
        params: { 'tenant-slug': 'portaldajustica-prod' },
      });
      const next = createCallHandler({ slug: 'portaldajustica-prod' });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:tenant_data:portaldajustica-prod');
    });

    it('deve extrair identifier em PascalCase (:ModuleId)', async () => {
      const context = createMockContext(controller.getModuleByPascalCase, {
        params: { ModuleId: 'MOD_A11Y_AUDIT' },
      });
      const next = createCallHandler({ moduleId: 'MOD_A11Y_AUDIT' });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:module_info:MOD_A11Y_AUDIT');
    });
  });

  describe('Formatos Especializados de IDs e Caracteres Especiais', () => {
    it('deve aceitar UUIDs v4 padrão sem truncar hífens', async () => {
      const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const context = createMockContext(controller.getReportByUuid, {
        body: { correlationId: uuid },
      });
      const next = createCallHandler({ correlationId: uuid });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith(`cache:batch_uuid:${uuid}`);
    });

    it('deve aceitar ObjectIds de 24 caracteres hexadecimais', async () => {
      const mongoId = '507f1f77bcf86cd799439011';
      const context = createMockContext(controller.getUserByCamelCase, {
        params: { userId: mongoId },
      });
      const next = createCallHandler({ userId: mongoId });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith(`cache:user_metrics:${mongoId}`);
    });

    it('deve preservar strings percent-encoded (ex: emails, URLs, caracteres UTF-8)', async () => {
      const encoded = 'contacto%2Bsuporte%40ama.gov.pt';
      const context = createMockContext(controller.getUserByCamelCase, {
        params: { userId: encoded },
      });
      const next = createCallHandler({ userId: encoded });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith(`cache:user_metrics:${encoded}`);
    });
  });

  describe('Tipos Primitivos e Valores Falsy', () => {
    it('deve preservar e cachear índice zero numérico (0)', async () => {
      const context = createMockContext(controller.getByNumericZeroParam, {
        body: { index: 0 },
      });
      const next = createCallHandler({ index: 0 });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:rank_position:0');
    });

    it('deve preservar e cachear boolean false', async () => {
      const context = createMockContext(controller.getByBooleanParam, {
        body: { isEnabled: false },
      });
      const next = createCallHandler({ isEnabled: false });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:feature_flag:false');
    });

    it('deve extrair chaves de query com notação de brackets plana (filter[tag])', async () => {
      const context = createMockContext(controller.getByBracketParam, {
        query: { 'filter[tag]': 'wcag_aa' },
      });
      const next = createCallHandler({ tag: 'wcag_aa' });

      await lastValueFrom(await interceptor.intercept(context, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith('cache:bracket_search:wcag_aa');
    });
  });

  describe('Wildcards e Determinismo de Hashing', () => {
    it('deve gerar exatamente a mesma chave independentemente da ordenação das propriedades na query', async () => {
      const q1 = { order: 'desc', limit: 10, filter: 'passed' };
      const q2 = { filter: 'passed', order: 'desc', limit: 10 };

      const canonicalStr = '{"filter":"passed","limit":10,"order":"desc"}';
      const expectedHash = crypto.createHash('sha256').update(canonicalStr).digest('hex');

      const ctx1 = createMockContext(controller.getByWildcardQuery, { query: q1 });
      const next1 = createCallHandler({ q1 });
      await lastValueFrom(await interceptor.intercept(ctx1, next1));

      const ctx2 = createMockContext(controller.getByWildcardQuery, { query: q2 });
      const next2 = createCallHandler({ q2 });
      await lastValueFrom(await interceptor.intercept(ctx2, next2));

      expect(cacheServiceMock.get).toHaveBeenNthCalledWith(
        1,
        `cache:wildcard_query:${expectedHash}`,
      );
      expect(cacheServiceMock.get).toHaveBeenNthCalledWith(
        2,
        `cache:wildcard_query:${expectedHash}`,
      );
    });

    it('deve normalizar matrizes aninhadas no body wildcard', async () => {
      const body = { criteria: ['table_03', 'img_01b'], page: 1 };
      const canonicalStr = '{"criteria":["table_03","img_01b"],"page":1}';
      const expectedHash = crypto.createHash('sha256').update(canonicalStr).digest('hex');

      const ctx = createMockContext(controller.getByWildcardBody, { body });
      const next = createCallHandler({ body });

      await lastValueFrom(await interceptor.intercept(ctx, next));

      expect(cacheServiceMock.get).toHaveBeenCalledWith(`cache:wildcard_body:${expectedHash}`);
    });
  });
});
