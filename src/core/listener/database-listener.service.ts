import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Client, ClientConfig } from 'pg';
import { ConfigService } from '@nestjs/config';
import { SsePublisherService } from '../sse/sse-publisher.service';

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
      throw new Error('The DB_PASSWORD variable is not defined in the environment.');
    }

    return {
      host,
      port,
      user,
      password: String(password),
      database,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      connectionTimeoutMillis: 5000,
    };
  }

  private async initListener(): Promise<void> {
    if (this.isShuttingDown) return;

    await this.cleanupClient();

    try {
      const client = new Client(this.buildClientConfig());
      this.client = client;

      client.on('notification', (msg) => this.handleNotification(msg.payload));

      client.on('error', (err) => {
        this.logger.error(`LISTEN socket error: ${err.message}`, err.stack);
        this.scheduleReconnect();
      });

      client.on('end', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('PostgreSQL LISTEN connection terminated unexpectedly.');
          this.scheduleReconnect();
        }
      });

      await client.connect();

      // Guard clause in case shutdown occurred during the connect() handshake
      if (this.isShuttingDown) {
        await client.end().catch(() => {});
        return;
      }

      await client.query(`LISTEN ${DatabaseCounterListenerService.CHANNEL}`);

      if (this.isShuttingDown) {
        await client.end().catch(() => {});
        return;
      }

      this.retryCount = 0;
      this.logger.log(`Listening on PostgreSQL channel: ${DatabaseCounterListenerService.CHANNEL}`);
    } catch (error) {
      if (this.isShuttingDown) return;

      this.logger.error(`Failed to connect/listen on channel: ${(error as Error).message}`);
      this.scheduleReconnect();
    }
  }

  private handleNotification(payload?: string): void {
    if (!payload || this.isShuttingDown) return;

    const visibilities = this.extractVisibilities(payload);
    this.logger.debug(
      `Notification received [${payload}]. Propagating to: ${visibilities.join(', ')}`,
    );

    Promise.allSettled(
      visibilities.map((visibility) =>
        this.ssePublisher.broadcastToGroups(
          'entity_count_updated',
          { entity: payload, timestamp: new Date() },
          visibility,
        ),
      ),
    ).then((results) => {
      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          this.logger.error(
            `Failed to emit SSE for visibility [${visibilities[index]}]: ${res.reason?.message || res.reason}`,
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

    const delay = Math.min(
      1000 * Math.pow(2, this.retryCount),
      DatabaseCounterListenerService.MAX_RETRY_DELAY_MS,
    );
    this.logger.log(`Reconnection attempt in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.retryCount++;
      this.initListener();
    }, delay);
    this.retryCount++;

    this.logger.warn(
      `Scheduling LISTEN channel reconnection in ${delay}ms (attempt ${this.retryCount})...`,
    );

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      await this.initListener();
    }, delay);
  }

  private async cleanupClient(): Promise<void> {
    if (this.client) {
      const client = this.client;
      this.client = null;
      client.removeAllListeners();
      try {
        await client.end();
      } catch (err) {
        this.logger.warn(`Error closing PostgreSQL client: ${(err as Error).message}`);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    await this.cleanupClient();
    this.logger.log('PostgreSQL listener destroyed successfully.');
  }
}
