import { Module, Global, OnApplicationShutdown, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { SSE_REDIS_PUBLISHER, SSE_REDIS_SUBSCRIBER } from './sse-redis.tokens';

const createSseRedisClient = (): Redis => {
  const password = process.env.REDIS_PASSWORD;
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(password ? { password } : {}),
  });
};

@Global()
@Module({
  providers: [
    {
      provide: SSE_REDIS_PUBLISHER,
      useFactory: () => createSseRedisClient(),
    },
    {
      provide: SSE_REDIS_SUBSCRIBER,
      useFactory: () => createSseRedisClient(),
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
