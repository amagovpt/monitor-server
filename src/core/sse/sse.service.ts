import { Inject, Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, finalize, map } from 'rxjs/operators';
import Redis from 'ioredis';
import { SSE_REDIS_SUBSCRIBER } from '../../redis/sse-redis.tokens';
import { CHANNELS, SseVisibility } from './sse-publisher.service';

interface BroadcastEvent {
  channel: string;
  type?: string;
  data: any;
}

@Injectable()
export class SSEService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SSEService.name);
  private readonly eventBus$ = new Subject<BroadcastEvent>();
  private readonly privateChannelRefCount = new Map<string, number>();

  // Canais permanentes do sistema
  private static readonly STATIC_CHANNELS = [CHANNELS.AMS(), CHANNELS.MONITOR(), CHANNELS.GLOBAL()];

  constructor(
    @Inject(SSE_REDIS_SUBSCRIBER)
    private readonly redisSubscriber: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    this.redisSubscriber.on('message', (incomingChannel: string, rawMessage: string) => {
      try {
        const parsed = JSON.parse(rawMessage);
        console.log(`Mensagem recebida no canal [${incomingChannel}]: ${rawMessage}`);

        this.eventBus$.next({
          channel: incomingChannel,
          type: parsed.event, // <--- OBRIGATÓRIO: 'entity_count_updated'
          data: parsed.data ?? parsed,
        });
      } catch (e) {
        this.eventBus$.next({
          channel: incomingChannel,
          type: 'message',
          data: rawMessage,
        });
      }
    });

    // Subscreve canais partilhados permanentemente
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

    visibilities.forEach((vis) => {
      if (vis === 'PRIVATE') {
        activeChannels.add(CHANNELS.PRIVATE(userId));
      } else {
        activeChannels.add(CHANNELS[vis]());
      }
    });

    const privateChannel = CHANNELS.PRIVATE(userId);
    const listensToPrivate = activeChannels.has(privateChannel);

    if (listensToPrivate) {
      this.retainPrivateChannel(privateChannel);
    }

    return this.eventBus$.asObservable().pipe(
      filter((event) => activeChannels.has(event.channel)),
      map(
        (event) =>
          ({
            type: event.type,
            data: event.data,
          }) as MessageEvent,
      ),
      finalize(() => {
        if (listensToPrivate) {
          this.releasePrivateChannel(privateChannel);
        }
      }),
    );
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

  async onModuleDestroy(): Promise<void> {
    this.eventBus$.complete();
    await this.redisSubscriber.quit().catch(() => {});
  }
}
