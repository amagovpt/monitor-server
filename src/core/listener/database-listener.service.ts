import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Client, ClientConfig } from 'pg';
import { ConfigService } from '@nestjs/config';
import { SsePublisherService } from '../sse/sse-publisher.service';
type Visibility = 'AMS' | 'MONITOR' | 'GLOBAL';
@Injectable()
export class DatabaseCounterListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseCounterListenerService.name);
  private client: Client | null = null;
  private isShuttingDown = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private retryCount = 0;

  private static readonly MAX_RETRY_DELAY_MS = 30000;
  private static readonly CHANNEL = 'entity_counts_channel';

  constructor(
    private readonly ssePublisher: SsePublisherService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initListener();
  }
  private buildClientConfig(): ClientConfig {
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT', 5432);
    const user = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');
    const database = this.configService.get<string>('DB_DATABASE');

    if (!password) {
      throw new Error('A variável DB_PASSWORD não está definida no ambiente.');
    }

    return {
      host,
      port,
      user,
      password: String(password),
      database,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };
  }

  private async initListener(): Promise<void> {
    if (this.isShuttingDown) return;

    this.cleanupClient();

    try {
      this.client = new Client(this.buildClientConfig());

      this.client.on('notification', (msg) => this.handleNotification(msg.payload));

      this.client.on('error', (err) => {
        this.logger.error(`Erro no socket do LISTEN: ${err.message}`, err.stack);
        this.scheduleReconnect();
      });

      this.client.on('end', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('Conexão PostgreSQL LISTEN terminada inesperadamente.');
          this.scheduleReconnect();
        }
      });

      await this.client.connect();
      await this.client.query(`LISTEN ${DatabaseCounterListenerService.CHANNEL}`);

      this.retryCount = 0;
      this.logger.log(
        `Escuta ativa no canal PostgreSQL: ${DatabaseCounterListenerService.CHANNEL}`,
      );
    } catch (error) {
      this.logger.error(`Falha ao conectar/escutar no canal: ${(error as Error).message}`);
      this.scheduleReconnect();
    }
  }

  private handleNotification(payload?: string): void {
    if (!payload) return;
    console.log(`Notificação recebida: ${JSON.stringify(payload)}`);
    const visibilities = this.extractVisibilities(payload);
    console.log(`Visibilidades extraídas: ${JSON.stringify(visibilities)}`);
    this.logger.debug(
      `Notificação recebida [${payload}]. A propagar para: ${visibilities.join(', ')}`,
    );

    // Dispara a notificação para cada escopo de visibilidade em paralelo
    Promise.allSettled(
      visibilities.map((visibility) =>
        this.ssePublisher.notifyUser(
          0,
          'entity_count_updated',
          { entity: payload, timestamp: new Date() },
          visibility,
        ),
      ),
    ).then((results) => {
      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          this.logger.error(
            `Falha ao emitir SSE para visibilidade [${visibilities[index]}]: ${res.reason?.message || res.reason}`,
          );
        }
      });
    });
  }

  private extractVisibilities(payload: string): ('AMS' | 'MONITOR')[] {
    const list: ('AMS' | 'MONITOR')[] = ['AMS'];

    if (payload.toLowerCase().includes('monitor')) {
      list.push('MONITOR');
    }

    return list;
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown || this.reconnectTimeout) return;

    // Exponential backoff com teto de 30s
    const delay = Math.min(
      1000 * Math.pow(2, this.retryCount),
      DatabaseCounterListenerService.MAX_RETRY_DELAY_MS,
    );
    this.retryCount++;

    this.logger.warn(
      `Agendando reconexão do canal LISTEN em ${delay}ms (tentativa ${this.retryCount})...`,
    );

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      await this.initListener();
    }, delay);
  }

  private cleanupClient(): void {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end().catch(() => {});
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.cleanupClient();
    this.logger.log('Listener PostgreSQL destruído com sucesso.');
  }
}
