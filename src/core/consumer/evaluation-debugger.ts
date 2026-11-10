import { ClickHouseClient } from '@clickhouse/client';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface EvaluationDebuggerDeps {
  redis: Redis;
  blocking: Redis;
  clickhouse: ClickHouseClient;
  stream: string;
  group: string;
  consumer: string;
}

/**
 * Debug helper for the evaluation consumer.
 * Only enabled by default outside production. EVAL_DEBUG=true|false overrides it.
 */
export class EvaluationDebugger {
  readonly enabled: boolean;

  constructor(
    private readonly logger: Logger,
    private readonly deps: EvaluationDebuggerDeps,
    enabled: boolean = EvaluationDebugger.resolveEnabled(),
  ) {
    this.enabled = enabled;
  }

  static resolveEnabled(): boolean {
    return process.env.EVAL_DEBUG
      ? process.env.EVAL_DEBUG === 'true'
      : process.env.NODE_ENV !== 'production';
  }

  /** Accepts a lazy message so expensive work (e.g. JSON.stringify) only runs when debug is on. */
  log(msg: string | (() => string)) {
    if (!this.enabled) return;
    this.logger.debug(`[DEBUG] ${typeof msg === 'function' ? msg() : msg}`);
  }

  /** Dumps Redis and ClickHouse state. */
  async redisState(when: string) {
    if (!this.enabled) return;

    const { redis, blocking, clickhouse, stream, group, consumer } = this.deps;

    this.log(`===== Debug Redis (${when}) =====`);

    const opts = redis.options;
    this.log(
      `Redis connection: host=${opts.host} port=${opts.port} db=${opts.db} status=${redis.status} | blocking db=${blocking.options.db} status=${blocking.status}`,
    );
    this.log(`stream="${stream}" group="${group}" consumer="${consumer}"`);

    await this.probe('PING', () => redis.ping());
    await this.probe('DBSIZE (nesta db)', () => redis.dbsize());
    await this.probe('keys that contain "evaluation"', async () => {
      const [, keys] = await redis.scan(0, 'MATCH', '*evaluation*', 'COUNT', 10000);
      return keys;
    });
    await this.probe('TYPE of the stream', () => redis.type(stream));
    await this.probe('XLEN', () => redis.xlen(stream));
    await this.probe('XINFO GROUPS', () => (redis as any).xinfo('GROUPS', stream));
    await this.probe('XINFO CONSUMERS', () => (redis as any).xinfo('CONSUMERS', stream, group));
    await this.probe('XPENDING (summary)', () => redis.xpending(stream, group));
    await this.probe('XPENDING (first 10)', () =>
      (redis as any).xpending(stream, group, '-', '+', 10),
    );
    await this.probe('XRANGE (first 3)', () => redis.xrange(stream, '-', '+', 'COUNT', 3));
    await this.probe('XREVRANGE (last 3)', () => redis.xrevrange(stream, '+', '-', 'COUNT', 3));

    await this.probe('ClickHouse ping', () => clickhouse.ping());
    await this.probe('ClickHouse count(evaluations_temp)', async () => {
      const rs = await clickhouse.query({
        query: 'SELECT count() AS n FROM evaluations_temp',
        format: 'JSONEachRow',
      });
      return rs.json();
    });

    this.log(`===== End of debug (${when}) =====`);
  }

  private async probe<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
    try {
      const res = await fn();
      this.log(() => `${label}: ${JSON.stringify(res)}`);
      return res;
    } catch (err) {
      this.logger.error(`[DEBUG] ${label} FALHOU: ${(err as Error).message}`);
      return undefined;
    }
  }
}
