import { Inject, Injectable, OnModuleDestroy, Logger, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';
import { SSE_REDIS_PUBLISHER } from 'src/redis/sse-redis.tokens';

export type SseGroupVisibility = 'AMS' | 'MONITOR' | 'GLOBAL';
export type SseVisibility = SseGroupVisibility | 'PRIVATE';

export const INVALID_CHANNEL = 'invalid-channel';

export interface SseEventEnvelope<T = unknown> {
  event: string;
  visibility: SseVisibility;
  timestamp: string;
  payload: T;
}

export const GROUP_CHANNELS: Record<SseGroupVisibility, string> = {
  AMS: 'ams:events',
  MONITOR: 'monitor:events',
  GLOBAL: 'global:events',
};

// Mantemos o helper CHANNELS para retrocompatibilidade com o SSEService e Testes
export const CHANNELS = {
  AMS: () => GROUP_CHANNELS.AMS,
  MONITOR: () => GROUP_CHANNELS.MONITOR,
  GLOBAL: () => GROUP_CHANNELS.GLOBAL,
  PRIVATE: (userId: number) => {
    if (!Number.isInteger(userId) || userId <= 0) return INVALID_CHANNEL;
    return `user:events:${userId}`;
  },
} as const;

@Injectable()
export class SsePublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(SsePublisherService.name);

  constructor(
    @Inject(SSE_REDIS_PUBLISHER)
    private readonly redisPublisher: Redis,
  ) {}

  private buildMessage(eventType: string, visibility: SseVisibility, payload: unknown): string {
    const envelope: SseEventEnvelope = {
      event: eventType,
      visibility,
      timestamp: new Date().toISOString(),
      payload,
    };
    return JSON.stringify(envelope);
  }

  /**
   * 1. UNICAST: Envia estritamente para o canal PRIVADO de um utilizador específico.
   * Não aceita `visibility` como parâmetro porque o propósito é exclusivo para o utilizador.
   */
  async notifyUser(userId: number, eventType: string, payload: unknown): Promise<void> {
    const channel = CHANNELS.PRIVATE(userId);
    if (channel === INVALID_CHANNEL) {
      this.logger.warn(`Ignored notifyUser: Invalid userId (${userId}).`);
      return;
    }

    const message = this.buildMessage(eventType, 'PRIVATE', payload);
    await this.redisPublisher.publish(channel, message);
  }

  /**
   * 2. MULTICAST / GROUP BROADCAST: Envia para um ou mais grupos (AMS, MONITOR, GLOBAL).
   * Não pede userId. O TypeScript impede passar 'PRIVATE' aqui!
   */
  async broadcastToGroups(
    eventType: string,
    payload: unknown,
    groups: SseGroupVisibility | SseGroupVisibility[] = ['GLOBAL'],
  ): Promise<void> {
    const targetGroups = Array.isArray(groups) ? groups : [groups];
    // Remove duplicados caso alguém passe ['AMS', 'AMS']
    const uniqueGroups = [...new Set(targetGroups)];

    await Promise.all(
      uniqueGroups.map(async (group) => {
        const channel = GROUP_CHANNELS[group];
        if (!channel) {
          throw new BadRequestException(`Invalid SSE group visibility: ${group}`);
        }

        const message = this.buildMessage(eventType, group, payload);
        await this.redisPublisher.publish(channel, message);
      }),
    );
  }

  /**
   * 3. HYBRID (User Action): Quando uma ação de um utilizador precisa de notificar
   * o canal PRIVADO dele E simultaneamente atualizar grupos (ex: GLOBAL ou AMS).
   */
  async notifyUserAndGroups(
    userId: number,
    eventType: string,
    payload: unknown,
    groups: SseGroupVisibility[] = [],
  ): Promise<void> {
    await Promise.all([
      this.notifyUser(userId, eventType, payload),
      groups.length > 0 ? this.broadcastToGroups(eventType, payload, groups) : Promise.resolve(),
    ]);
  }

  async onModuleDestroy() {
    await this.redisPublisher.quit();
  }
}
