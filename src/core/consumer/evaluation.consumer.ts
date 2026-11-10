import { ClickHouseClient } from '@clickhouse/client';
import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';
import { IMetricData } from 'src/domains/audit-engine/evaluation/types';
import { REDIS_CLIENT, REDIS_STREAMS, REDIS_GROUPS } from 'src/redis/types';
import { EvaluationDebugger } from './evaluation-debugger';

export interface EvaluationResult {
  evaluation_id: number;
  institution_id: number;
  directory_id: number;
  website_id: number;
  page_id: number;
  evaluation_date: string;
  rules_counts: Record<string, number>;
  score: number;
}

type StreamEntry = [id: string, fields: string[] | null];
type ReadResult = [stream: string, entries: StreamEntry[]][] | null;
type ClaimResult = [nextId: string, entries: StreamEntry[], deleted?: string[]];

@Injectable()
export class EvaluationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationConsumer.name);

  private readonly stream = REDIS_STREAMS.ANALYTICS_EVALUATION_BUFFER;
  private readonly group = REDIS_GROUPS.ANALYTICS_EVALUATION_GROUP;
  private readonly deadStream = `${REDIS_STREAMS.ANALYTICS_EVALUATION_BUFFER}:dead`;
  private readonly consumer = 'analytics-evaluation-main';

  private readonly readCount = 500;
  private readonly blockMs = 2000;
  private readonly maxBatch = 1000;
  private readonly maxBuffer = 5000; // backpressure se o ClickHouse estiver em baixo
  private readonly flushIntervalMs = Number(process.env.EVAL_FLUSH_INTERVAL_MS ?? 60_000);

  private readonly blocking: Redis;
  private readonly dbg: EvaluationDebugger;

  private running = false;
  private runPromise?: Promise<void>;
  private lastHeartbeat = 0;

  private readonly buffer = new Map<string, IMetricData | IMetricData[]>();
  private bufferSince = 0;
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CLICKHOUSE_CLIENT) private readonly clickhouse: ClickHouseClient,
  ) {
    this.blocking = redis.duplicate();
    this.dbg = new EvaluationDebugger(this.logger, {
      redis,
      blocking: this.blocking,
      clickhouse,
      stream: this.stream,
      group: this.group,
      consumer: this.consumer,
    });
  }

  async onModuleInit() {
    await this.dbg.redisState('Before do ensureGroup');
    await this.ensureGroup();
    await this.dbg.redisState('After do ensureGroup');

    this.running = true;
    this.runPromise = this.run();
    this.logger.log(`Consuming "${this.stream}" (group=${this.group}, consumer=${this.consumer})`);
  }

  async onModuleDestroy() {
    this.running = false;
    await this.runPromise;

    try {
      await this.flush();
    } catch (err) {
      this.logger.error(
        `Shutdown with ${this.buffer.size} messages pending insertion (remain pending in Redis): ${(err as Error).message}`,
      );
    }
    await this.blocking.quit();
  }
  // --- Ensure group exists or create it if missing
  private async ensureGroup() {
    try {
      await this.redis.xgroup('CREATE', this.stream, this.group, '$', 'MKSTREAM');
      this.dbg.log(`group "${this.group}" created`);
    } catch (e: any) {
      if (!e.message.includes('BUSYGROUP')) throw e;
      this.dbg.log(`group "${this.group}" already existed`);
    }
  }

  // ───────────────────────── bootstrap ─────────────────────────

  private async run() {
    try {
      this.dbg.log('run: adopting old consumers...');
      await this.adoptOldConsumers();
      this.dbg.log('run: recovering own pending...');
      await this.recoverOwnPending();
      this.dbg.log(`run: recovery completed, buffer=${this.buffer.size}`);
    } catch (err) {
      this.logger.error(`Initial recovery failed: ${(err as Error).stack}`);
    }
    this.dbg.log('run: entering main loop');
    await this.loop();
  }

  // Get pending messages from old consumers and recover own pending messages
  private async adoptOldConsumers() {
    let cursor = '0-0';
    let total = 0;
    do {
      const [next, entries] = (await this.redis.xautoclaim(
        this.stream,
        this.group,
        this.consumer,
        0,
        cursor,
        'COUNT',
        1000,
      )) as unknown as ClaimResult;
      this.dbg.log(`XAUTOCLAIM: cursor=${cursor} -> next=${next}, entradas=${entries.length}`);
      total += entries.length;
      cursor = next;
    } while (cursor !== '0-0');

    if (total) this.logger.warn(`Adopted ${total} messages from old consumers`);
  }

  // Read this consumer's pending messages (including adopted ones) and insert them into the buffer
  private async recoverOwnPending() {
    let cursor = '0';

    while (this.running) {
      const res = (await (this.redis as any).xreadgroup(
        'GROUP',
        this.group,
        this.consumer,
        'COUNT',
        this.readCount,
        'STREAMS',
        this.stream,
        cursor,
      )) as ReadResult;

      const entries = res?.[0]?.[1] ?? [];
      this.dbg.log(`XREADGROUP pending (cursor=${cursor}): ${entries.length} entries`);
      if (entries.length === 0) break;

      this.dbg.log(() => `example: ${JSON.stringify(entries[0]).slice(0, 300)}`);
      cursor = entries[entries.length - 1][0];
      await this.addToBuffer(entries);

      if (this.buffer.size >= this.maxBatch) await this.flush();
    }

    if (this.buffer.size) await this.flush();
  }

  // ───────────────────────── Loop principal ─────────────────────────

  private async loop() {
    while (this.running) {
      try {
        if (this.buffer.size < this.maxBuffer) {
          await this.readNew();
        } else {
          await new Promise((r) => setTimeout(r, 1000));
        }

        if (this.dbg.enabled && Date.now() - this.lastHeartbeat > 10_000) {
          this.lastHeartbeat = Date.now();
          const len = await this.redis.xlen(this.stream);
          this.dbg.log(
            `heartbeat: buffer=${this.buffer.size} xlen=${len} idadeBuffer=${this.bufferSince ? Date.now() - this.bufferSince : 0}ms`,
          );
        }

        if (this.shouldFlush()) await this.flush();
      } catch (err) {
        this.logger.error(`Error in loop: ${(err as Error).stack}`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  private async readNew() {
    const res = (await (this.blocking as any).xreadgroup(
      'GROUP',
      this.group,
      this.consumer,
      'COUNT',
      this.readCount,
      'BLOCK',
      this.blockMs,
      'STREAMS',
      this.stream,
      '>',
    )) as ReadResult;

    const entries = res?.[0]?.[1] ?? [];
    if (entries.length) {
      this.dbg.log(
        () =>
          `readNew: ${entries.length} new. Example: ${JSON.stringify(entries[0]).slice(0, 300)}`,
      );
      await this.addToBuffer(entries);
    }
  }

  private async addToBuffer(entries: StreamEntry[]) {
    for (const [id, fields] of entries) {
      if (!fields || this.buffer.has(id)) continue;

      try {
        this.buffer.set(id, JSON.parse(fields[1]) as IMetricData | IMetricData[]);
        if (this.bufferSince === 0) this.bufferSince = Date.now();
      } catch {
        // invalid message will never pass: dead letter + ACK
        this.logger.error(`Invalid JSON in ${id}, moved to ${this.deadStream}`);
        await this.redis.xadd(
          this.deadStream,
          '*',
          'original_id',
          id,
          'fields',
          JSON.stringify(fields),
        );
        await this.redis.xack(this.stream, this.group, id);
      }
    }
  }

  private shouldFlush(): boolean {
    if (this.buffer.size === 0) return false;
    return (
      this.buffer.size >= this.maxBatch || Date.now() - this.bufferSince >= this.flushIntervalMs
    );
  }

  /** Throws an error if the insert fails: the buffer remains and the loop will retry. */
  private async flush() {
    if (this.buffer.size === 0) return;

    const ids = [...this.buffer.keys()];
    const values = [...this.buffer.values()].flat();

    this.dbg.log(
      () => `flush: a inserir ${values.length} linhas. Exemplo: ${JSON.stringify(values[0])}`,
    );

    try {
      await this.clickhouse.insert({
        table: 'evaluations_temp',
        values,
        format: 'JSONEachRow',
      });
      this.logger.log(`flush: inserido ${values.length} linhas com sucesso.`);
    } catch (err) {
      this.logger.error(`INSERT ClickHouse FALHOU: ${(err as Error).stack}`);
      throw err;
    }

    const acked = await this.redis.xack(this.stream, this.group, ...ids);
    this.dbg.log(`XACK devolveu ${acked} (esperado ${ids.length})`);
    this.redis.xdel(this.stream, ...ids);
    ids.forEach((id) => this.buffer.delete(id));
    this.bufferSince = this.buffer.size ? Date.now() : 0;

    this.logger.log(`Batch de ${ids.length} inserido e confirmado.`);
  }
}
