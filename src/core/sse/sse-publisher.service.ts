import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { SSE_REDIS_PUBLISHER } from 'src/redis/sse-redis.tokens';

export type SseVisibility = 'AMS' | 'MONITOR' | 'GLOBAL' | 'PRIVATE';
export const INVALID_CHANNEL = 'invalid-channel';
export const CHANNELS: Record<SseVisibility, (userId?: number) => string> = {
  AMS: () => 'ams:events',
  MONITOR: () => 'monitor:events',
  GLOBAL: () => 'global:events',
  PRIVATE: (userId?: number) => {
    if (userId == undefined || userId < 0) return INVALID_CHANNEL;
    return `user:events:${userId}`;
  },
};

@Injectable()
export class SsePublisherService implements OnModuleDestroy {
  constructor(
    @Inject(SSE_REDIS_PUBLISHER)
    private readonly redisPublisher: Redis,
  ) {}

  async notifyUser(
    userId: number,
    eventType: string,
    payload: any,
    visibility: SseVisibility = 'PRIVATE',
  ): Promise<void> {
    const channelFn = CHANNELS[visibility];
    if (!channelFn) return;

    const finalChannel = visibility === 'PRIVATE' ? channelFn(userId) : channelFn();
    if (finalChannel === INVALID_CHANNEL) return;
    const message = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });
    console.log(`Publicando mensagem no canal [${finalChannel}]: ${JSON.stringify(message)}`);
    await this.redisPublisher.publish(finalChannel, message);
  }

  async notifyUserInVisibilities(
    userId: number,
    eventType: string,
    payload: any,
    visibilities: SseVisibility[] = ['PRIVATE'],
  ): Promise<void> {
    for (const visibility of visibilities) {
      await this.notifyUser(userId, eventType, payload, visibility);
    }
  }

  async broadcast(
    eventType: string,
    payload: any,
    visibilities: SseVisibility[] = ['GLOBAL'],
  ): Promise<void> {
    for (const visibility of visibilities) {
      await this.notifyUser(0, eventType, payload, visibility);
    }
  }

  async onModuleDestroy() {
    await this.redisPublisher.quit();
  }
}
