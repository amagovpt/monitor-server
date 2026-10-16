import { Module, Global, OnApplicationShutdown, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { SSE_REDIS_PUBLISHER, SSE_REDIS_SUBSCRIBER } from './sse-redis.tokens';

@Global()
@Module({
  providers: [
    {
      provide: SSE_REDIS_PUBLISHER,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        });
      },
    },
    {
      provide: SSE_REDIS_SUBSCRIBER,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        });
      },
    },
  ],
  exports: [SSE_REDIS_PUBLISHER, SSE_REDIS_SUBSCRIBER],
})
export class SseRedisModule implements OnApplicationShutdown {
  constructor(
    @Inject(SSE_REDIS_PUBLISHER) private readonly publisher: Redis,
    @Inject(SSE_REDIS_SUBSCRIBER) private readonly subscriber: Redis,
  ) {}

  async onApplicationShutdown() {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }
}
