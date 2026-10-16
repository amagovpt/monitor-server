import { ExecutionContext, Injectable, CallHandler, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_OPTIONS_KEY, CacheRuleOptions } from '../decorator/cache-resource.decorator';
import { AppCacheService } from '../cache.service'; // <-- Injetar o teu serviço direto
import { Observable, of, lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class EntityCacheInterceptor implements NestInterceptor {
  private static readonly inFlightRequests = new Map<string, Promise<any>>();
  private static readonly PROCESSED_FLAG = Symbol('ENTITY_CACHE_PROCESSED');

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: AppCacheService, // <-- Direto ao ponto
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    if (request[EntityCacheInterceptor.PROCESSED_FLAG]) {
      return next.handle();
    }

    const options = this.reflector.get<CacheRuleOptions>(CACHE_OPTIONS_KEY, context.getHandler());
    if (!options || request.method !== 'GET') {
      return next.handle();
    }

    request[EntityCacheInterceptor.PROCESSED_FLAG] = true;

    let identifier = '';
    if (options.source && options.param) {
      let rawValue: any;

      if (options.source === 'path') {
        rawValue = request.params?.[options.param];
      } else if (options.source === 'body') {
        rawValue = options.param === '*' ? request.body : request.body?.[options.param];
      } else if (options.source === 'query') {
        rawValue = options.param === '*' ? request.query : request.query?.[options.param];
      }

      if (rawValue === undefined || rawValue === null) {
        return next.handle();
      }

      identifier =
        typeof rawValue === 'object'
          ? crypto.createHash('sha256').update(this.canonicalStringify(rawValue)).digest('hex')
          : String(rawValue);
    }

    const cacheKey = identifier ? `cache:${options.key}:${identifier}` : `cache:${options.key}`;
    const ttlSeconds = options.ttl ?? 60; // TTL em segundos

    // 1. Cache HIT
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData !== null && cachedData !== undefined) {
      return of(cachedData);
    }

    // 2. Singleflight coalescing
    const inFlight = EntityCacheInterceptor.inFlightRequests.get(cacheKey);
    if (inFlight) {
      const coalescedData = await inFlight;
      return of(coalescedData);
    }

    // 3. Execução do Leader
    const leaderPromise = (async () => {
      try {
        const response = await lastValueFrom(next.handle());
        if (response !== undefined && response !== null) {
          // Gravação direta no Redis via ioredis
          await this.cacheService.set(cacheKey, response, ttlSeconds);
        }
        return response;
      } finally {
        EntityCacheInterceptor.inFlightRequests.delete(cacheKey);
      }
    })();

    EntityCacheInterceptor.inFlightRequests.set(cacheKey, leaderPromise);

    const freshResult = await leaderPromise;
    return of(freshResult);
  }

  private canonicalStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map((item) => this.canonicalStringify(item)).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    return `{${sortedKeys.map((k) => `${JSON.stringify(k)}:${this.canonicalStringify(obj[k])}`).join(',')}}`;
  }
}
