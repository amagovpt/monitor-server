import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { EntityCacheInterceptor } from '../interceptor/entity-cache.interceptor';

export const CACHE_OPTIONS_KEY = 'CACHE_OPTIONS_KEY';

export interface CacheRuleOptions {
  key: string;
  source?: 'path' | 'body' | 'query';
  param?: string;
  ttl?: number;
}

export function CacheableBy(options: CacheRuleOptions) {
  return applyDecorators(
    SetMetadata(CACHE_OPTIONS_KEY, options),
    UseInterceptors(EntityCacheInterceptor),
  );
}
