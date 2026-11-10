import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './types';
import { SseRedisModule } from './sse-redis.module';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: Number(configService.get('REDIS_PORT') ?? 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(configService.get('REDIS_DB_MONITOR') ?? 1),
        });

        client.on('error', (err) => {
          console.error('[Redis] erro de ligação:', err.message);
        });

        return client;
      },
    },
  ],
  imports: [SseRedisModule],
  exports: [REDIS_CLIENT, SseRedisModule],
})
export class RedisModule {}
