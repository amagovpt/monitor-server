import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError, lastValueFrom, delay } from 'rxjs';
import * as crypto from 'crypto';
import { EntityCacheInterceptor } from './entity-cache.interceptor';
import { AppCacheService } from '../cache.service';

describe('EntityCacheInterceptor - Full Branch Coverage & Concurrency', () => {
  let interceptor: EntityCacheInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let cacheService: jest.Mocked<AppCacheService>;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<AppCacheService>;

    interceptor = new EntityCacheInterceptor(reflector, cacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockContext(
    method = 'GET',
    reqExtras: Record<string, any> = {},
  ): ExecutionContext {
    const request = {
      method,
      params: {},
      query: {},
      body: {},
      ...reqExtras,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getHandler: () => () => {},
    } as unknown as ExecutionContext;
  }

  function createCallHandler(data: any, delayMs = 0): CallHandler {
    return {
      handle: () => (delayMs > 0 ? of(data).pipe(delay(delayMs)) : of(data)),
    };
  }

  describe('Filtros e Guards Preliminares', () => {
    it('deve dar bypass imediato se o método HTTP não for GET (ex: POST, PUT, DELETE)', async () => {
      reflector.get.mockReturnValue({ key: 'items' });
      const context = createMockContext('POST');
      const next = createCallHandler({ created: true });

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual({ created: true });
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('deve dar bypass imediato se não existirem metadados @CacheableBy no handler', async () => {
      reflector.get.mockReturnValue(undefined);
      const context = createMockContext('GET');
      const next = createCallHandler({ plain: 'response' });

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual({ plain: 'response' });
      expect(cacheService.get).not.toHaveBeenCalled();
    });

    it('deve impedir reentrância se o interceptor for executado duas vezes no mesmo pipeline HTTP', async () => {
      reflector.get.mockReturnValue({ key: 'items', ttl: 60 });
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue('OK');

      const sharedRequest = { method: 'GET', params: {} };
      const context = {
        switchToHttp: () => ({ getRequest: () => sharedRequest }),
        getHandler: () => () => {},
      } as unknown as ExecutionContext;

      const next1 = createCallHandler({ pass: 1 });
      const next2 = createCallHandler({ pass: 2 });

      // 1ª Execução legítima
      const res1$ = await interceptor.intercept(context, next1);
      await lastValueFrom(res1$);
      expect(cacheService.get).toHaveBeenCalledTimes(1);

      // 2ª Execução reentrante no mesmo request object
      const res2$ = await interceptor.intercept(context, next2);
      const res2 = await lastValueFrom(res2$);

      expect(res2).toEqual({ pass: 2 });
      // Não deve ter consultado o cache uma segunda vez
      expect(cacheService.get).toHaveBeenCalledTimes(1);
    });

    it('deve dar bypass se source for path e o parâmetro estiver indefinido no request', async () => {
      reflector.get.mockReturnValue({ key: 'users', source: 'path', param: 'id' });
      const context = createMockContext('GET', { params: {} }); // params.id falta
      const next = createCallHandler({ fallback: true });

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual({ fallback: true });
      expect(cacheService.get).not.toHaveBeenCalled();
    });

    it('deve dar bypass se source for query e o parâmetro for nulo', async () => {
      reflector.get.mockReturnValue({ key: 'search', source: 'query', param: 'term' });
      const context = createMockContext('GET', { query: { term: null } });
      const next = createCallHandler([]);

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual([]);
      expect(cacheService.get).not.toHaveBeenCalled();
    });

    it('deve dar bypass se source for body e o parâmetro estiver ausente', async () => {
      reflector.get.mockReturnValue({ key: 'reports', source: 'body', param: 'filter' });
      const context = createMockContext('GET', { body: {} });
      const next = createCallHandler({ report: [] });

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual({ report: [] });
      expect(cacheService.get).not.toHaveBeenCalled();
    });
  });

  describe('Ciclo de Leitura e Escrita (Cache Hit / Miss)', () => {
    it('deve retornar Cache HIT sem chamar next.handle() nem cacheService.set()', async () => {
      reflector.get.mockReturnValue({ key: 'website', source: 'path', param: 'id', ttl: 120 });
      const context = createMockContext('GET', { params: { id: '99' } });
      const cachedPayload = { id: 99, name: 'Observatório', score: 9.8 };

      cacheService.get.mockResolvedValue(cachedPayload);
      const nextHandleSpy = jest.fn();
      const next = { handle: nextHandleSpy } as unknown as CallHandler;

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual(cachedPayload);
      expect(cacheService.get).toHaveBeenCalledWith('cache:website:99');
      expect(nextHandleSpy).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('deve processar Cache MISS, executar o handler e gravar no Redis com TTL padrão de 60s', async () => {
      reflector.get.mockReturnValue({ key: 'global_metrics' }); // Sem TTL configurado
      const context = createMockContext('GET');
      const freshData = { totalWebsites: 1500, averageScore: 6.4 };

      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue('OK');
      const next = createCallHandler(freshData);

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toEqual(freshData);
      expect(cacheService.get).toHaveBeenCalledWith('cache:global_metrics');
      expect(cacheService.set).toHaveBeenCalledWith('cache:global_metrics', freshData, 60);
    });

    it('não deve gravar no Redis se a resposta do handler for null ou undefined', async () => {
      reflector.get.mockReturnValue({ key: 'empty_result', ttl: 30 });
      const context = createMockContext('GET');

      cacheService.get.mockResolvedValue(null);
      const next = createCallHandler(null);

      const result$ = await interceptor.intercept(context, next);
      const res = await lastValueFrom(result$);

      expect(res).toBeNull();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('Single-Flight & Concorrência Extrema (Stampede Protection)', () => {
    it('deve agrupar 50 pedidos paralelos na mesma Promise e executar o handler apenas 1 vez', async () => {
      reflector.get.mockReturnValue({ key: 'heavy_analytics', ttl: 300 });
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue('OK');

      let handlerCalls = 0;
      const sharedHandler: CallHandler = {
        handle: () => {
          handlerCalls++;
          return of({ calculated: true, timestamp: 123456 }).pipe(delay(50));
        },
      };

      // 50 requests simultâneos para a mesma chave de cache
      const requests = Array.from({ length: 50 }, () => {
        const ctx = createMockContext('GET');
        return interceptor.intercept(ctx, sharedHandler).then((obs) => lastValueFrom(obs));
      });

      const results = await Promise.all(requests);

      // Todos os 50 receberam exatamente o mesmo payload
      results.forEach((data) => {
        expect(data).toEqual({ calculated: true, timestamp: 123456 });
      });

      // O handler foi invocado estritamente uma única vez pelo leader
      expect(handlerCalls).toBe(1);
      // Gravou no Redis apenas 1 vez
      expect(cacheService.set).toHaveBeenCalledTimes(1);
    });

    it('deve limpar o mapa inFlightRequests se o handler falhar com erro (cleanup no finally)', async () => {
      reflector.get.mockReturnValue({ key: 'failing_endpoint' });
      cacheService.get.mockResolvedValue(null);

      const failingHandler: CallHandler = {
        handle: () => throwError(() => new Error('DB Connection Timeout')),
      };

      const ctx1 = createMockContext('GET');

      // 1ª Chamada falha
      await expect(
        interceptor.intercept(ctx1, failingHandler).then((obs) => lastValueFrom(obs)),
      ).rejects.toThrow('DB Connection Timeout');

      // 2ª Chamada: o mapa in-flight tem de estar limpo. Se não estivesse, ficaria preso na promessa falhada
      const recoveringHandler = createCallHandler({ recovered: true });
      const ctx2 = createMockContext('GET');

      const res2$ = await interceptor.intercept(ctx2, recoveringHandler);
      const res2 = await lastValueFrom(res2$);

      expect(res2).toEqual({ recovered: true });
    });
  });

  describe('Hashing Canónico de Estruturas Complexas (canonicalStringify)', () => {
    it('deve gerar hashes idênticos para objetos com propriedades declaradas em ordem inversa', async () => {
      reflector.get.mockReturnValue({ key: 'filtered_query', source: 'query', param: '*' });

      const obj1 = { z: 1, a: 2, m: { b: 3, a: 4 } };
      const obj2 = { a: 2, m: { a: 4, b: 3 }, z: 1 };

      const expectedCanonical = '{"a":2,"m":{"a":4,"b":3},"z":1}';
      const expectedHash = crypto.createHash('sha256').update(expectedCanonical).digest('hex');

      cacheService.get.mockResolvedValue(null);
      const next = createCallHandler({ ok: true });

      // Request com obj1
      const ctx1 = createMockContext('GET', { query: obj1 });
      await lastValueFrom(await interceptor.intercept(ctx1, next));

      // Request com obj2
      const ctx2 = createMockContext('GET', { query: obj2 });
      await lastValueFrom(await interceptor.intercept(ctx2, next));

      expect(cacheService.get).toHaveBeenNthCalledWith(1, `cache:filtered_query:${expectedHash}`);
      expect(cacheService.get).toHaveBeenNthCalledWith(2, `cache:filtered_query:${expectedHash}`);
    });

    it('deve preservar a ordem de elementos dentro de arrays na serialização canónica', async () => {
      reflector.get.mockReturnValue({ key: 'array_query', source: 'body', param: '*' });

      const bodyPayload = { tags: ['wcag', 'aria', 'section508'] };
      const expectedCanonical = '{"tags":["wcag","aria","section508"]}';
      const expectedHash = crypto.createHash('sha256').update(expectedCanonical).digest('hex');

      cacheService.get.mockResolvedValue(null);
      const next = createCallHandler({ ok: true });

      const ctx = createMockContext('GET', { body: bodyPayload });
      await lastValueFrom(await interceptor.intercept(ctx, next));

      expect(cacheService.get).toHaveBeenCalledWith(`cache:array_query:${expectedHash}`);
    });

    it('deve serializar corretamente tipos primitivos e nulos dentro de objetos canónicos', async () => {
      reflector.get.mockReturnValue({ key: 'primitives', source: 'query', param: '*' });

      const bodyPayload = { flag: true, counter: 0, empty: null, text: 'hello' };
      const expectedCanonical = '{"counter":0,"empty":null,"flag":true,"text":"hello"}';
      const expectedHash = crypto.createHash('sha256').update(expectedCanonical).digest('hex');

      cacheService.get.mockResolvedValue(null);
      const next = createCallHandler({ ok: true });

      const ctx = createMockContext('GET', { query: bodyPayload });
      await lastValueFrom(await interceptor.intercept(ctx, next));

      expect(cacheService.get).toHaveBeenCalledWith(`cache:primitives:${expectedHash}`);
    });
  });
});
