import { Injectable, Inject, OnApplicationBootstrap, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/types';

@Injectable()
export class AppCacheService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationBootstrap() {
    try {
      await this.set('cache:ping_test', { status: 'ok' }, 60);
      const val = await this.get('cache:ping_test');
      this.logger.log(
        `[Redis Cache Test]: Conexão e escrita com sucesso! Valor: ${JSON.stringify(val)}`,
      );
    } catch (err: any) {
      this.logger.error(`[Redis Cache Test]: Falha de escrita no Redis: ${err.message}`, err.stack);
    }
  }

  /**
   * Obtém um valor da cache (desserializa se for JSON)
   */
  async get<T = any>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  /**
   * Grava na cache.
   * @param ttlSeconds TTL em segundos (padrão de mercado para Redis)
   */
  async set(key: string, value: any, ttlSeconds = 60): Promise<'OK' | null> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds > 0) {
      return this.redis.set(key, payload, 'EX', ttlSeconds);
    }
    return this.redis.set(key, payload);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }
}
