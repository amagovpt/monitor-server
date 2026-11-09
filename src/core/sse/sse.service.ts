import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  MessageEvent,
  BadRequestException,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, finalize, map } from 'rxjs/operators';
import Redis from 'ioredis';
import { SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import {
  CHANNELS,
  INVALID_CHANNEL,
  SseEventEnvelope,
  SseVisibility,
} from './sse-publisher.service';

interface InternalBroadcastEvent {
  channel: string;
  envelope: SseEventEnvelope;
}

@Injectable()
export class SSEService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SSEService.name);
  private readonly eventBus$ = new Subject<InternalBroadcastEvent>();
  private readonly privateChannelRefCount = new Map<string, number>();

  private static readonly STATIC_CHANNELS = [CHANNELS.AMS(), CHANNELS.MONITOR(), CHANNELS.GLOBAL()];

  constructor(
    @Inject(SSE_REDIS_SUBSCRIBER)
    private readonly redisSubscriber: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    this.redisSubscriber.on('message', (incomingChannel: string, rawMessage: string) => {
      try {
        const parsed = JSON.parse(rawMessage) as SseEventEnvelope;

        this.eventBus$.next({
          channel: incomingChannel,
          envelope: {
            event: parsed.event ?? 'message',
            visibility: parsed.visibility ?? this.inferVisibilityFromChannel(incomingChannel),
            timestamp: parsed.timestamp ?? new Date().toISOString(),
            payload: parsed.payload ?? parsed,
          },
        });
      } catch (e) {
        this.eventBus$.next({
          channel: incomingChannel,
          envelope: {
            event: 'message',
            visibility: this.inferVisibilityFromChannel(incomingChannel),
            timestamp: new Date().toISOString(),
            payload: rawMessage,
          },
        });
      }
    });

    try {
      await this.redisSubscriber.subscribe(...SSEService.STATIC_CHANNELS);
      this.logger.log(
        `Canais estáticos Redis subscritos: ${SSEService.STATIC_CHANNELS.join(', ')}`,
      );
    } catch (err) {
      this.logger.error(`Erro ao subscrever canais estáticos no Redis: ${(err as Error).message}`);
    }
  }

  getUserStream(userId: number, visibilities: SseVisibility[]): Observable<MessageEvent> {
    const activeChannels = new Set<string>();
    let privateChannel: string | null = null;

    visibilities.forEach((vis) => {
      if (vis === 'PRIVATE') {
        const channel = CHANNELS.PRIVATE(userId);
        if (channel === INVALID_CHANNEL) {
          throw new BadRequestException(
            `Cannot open private SSE stream for invalid userId: ${userId}`,
          );
        }
        privateChannel = channel;
        activeChannels.add(channel);
      } else {
        activeChannels.add(CHANNELS[vis]());
      }
    });

    const listensToPrivate = privateChannel !== null && activeChannels.has(privateChannel);

    if (listensToPrivate && privateChannel) {
      this.retainPrivateChannel(privateChannel);
    }

    return this.eventBus$.asObservable().pipe(
      filter((item) => activeChannels.has(item.channel)),
      map((item): MessageEvent => ({
        type: item.envelope.event,
        data: item.envelope,
      })),
      finalize(() => {
        if (listensToPrivate && privateChannel) {
          this.releasePrivateChannel(privateChannel);
        }
      }),
    );
  }

  private inferVisibilityFromChannel(channel: string): SseVisibility {
    if (channel === CHANNELS.GLOBAL()) return 'GLOBAL';
    if (channel === CHANNELS.AMS()) return 'AMS';
    if (channel === CHANNELS.MONITOR()) return 'MONITOR';
    return 'PRIVATE';
  }

  private retainPrivateChannel(channel: string): void {
    const current = this.privateChannelRefCount.get(channel) || 0;
    this.privateChannelRefCount.set(channel, current + 1);

    if (current === 0) {
      this.redisSubscriber.subscribe(channel).catch((err) => {
        this.logger.error(`Falha ao subscrever ${channel}: ${err.message}`);
      });
    }
  }

  private releasePrivateChannel(channel: string): void {
    const current = this.privateChannelRefCount.get(channel) || 0;
    if (current <= 1) {
      this.privateChannelRefCount.delete(channel);
      this.redisSubscriber.unsubscribe(channel).catch((err) => {
        this.logger.error(`Falha ao desubscrever ${channel}: ${err.message}`);
      });
    } else {
      this.privateChannelRefCount.set(channel, current - 1);
    }
  }

  public getVisibilitiesForRole(role: string): SseVisibility[] {
    switch (role.toUpperCase()) {
      case 'NIMDA':
        return ['GLOBAL', 'PRIVATE', 'AMS'];
      case 'MONITOR':
        return ['GLOBAL', 'PRIVATE', 'MONITOR'];
      case 'USER':
      default:
        return ['GLOBAL', 'PRIVATE'];
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.eventBus$.complete();
    await this.redisSubscriber.quit().catch(() => {});
  }
}
