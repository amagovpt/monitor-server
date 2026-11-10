import { Module, Global } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { AppCacheService } from './cache.service';
import { EntityCacheInterceptor } from './interceptor/entity-cache.interceptor';

@Global()
@Module({
  imports: [RedisModule],
  providers: [AppCacheService, EntityCacheInterceptor],
  exports: [AppCacheService, EntityCacheInterceptor],
})
export class AppCacheModule {}
