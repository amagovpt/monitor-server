import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { SsePublisherService } from '../../../../../core/sse/sse-publisher.service';
import { Repository } from 'typeorm';
import { CrawlerStatus, CrawlerWebsite } from '../entities/crawler-website.entity';
import { CrawlWebsiteHandler } from '../handlers/crawl-websites.handler';
import { InjectRepository } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { Logger } from '@nestjs/common';
import {
  CrawlerJobData,
  CrawlerStarted,
  CrawlerProgress,
  CrawlerFailed,
  CrawlerCompleted,
  CrawlerDrained,
} from '../types/events';

@Processor(QUEUE_NAMES.CRAWL_PRIVATE, {
  concurrency: 1,
})
export class CrawlPrivateWorker extends WorkerHost {
  private readonly logger = new Logger(CrawlPrivateWorker.name);

  constructor(
    private readonly crawlWebsiteHandler: CrawlWebsiteHandler,
    @InjectQueue(QUEUE_NAMES.CRAWL_PRIVATE_DLQ)
    private readonly dlqQueue: Queue,
    @InjectRepository(CrawlerWebsite)
    private readonly crawlerWebsiteRepository: Repository<CrawlerWebsite>,
    private readonly ssePublisherService: SsePublisherService,
  ) {
    super();
  }

  async process(job: Job<CrawlerJobData, void, string>): Promise<void> {
    if (!job?.data) {
      throw new Error(`Job ${job?.id} processado sem payload de dados (job.data é undefined).`);
    }

    await this.crawlWebsiteHandler.execute({
      id: job.data.crawlerId,
      baseUrl: job.data.baseUrl,
    });
  }

  @OnWorkerEvent('active')
  async onActive(job: Job<CrawlerJobData>) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerStarted = {
      event: 'crawler:started',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
    };

    await Promise.all([
      userId
        ? this.ssePublisherService.notifyUser(userId, 'crawler:started', event)
        : Promise.resolve(),
      this.ssePublisherService.broadcastToGroups('crawler:started', event, 'AMS'),
    ]);
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job<CrawlerJobData>, progress: number | object) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerProgress = {
      event: 'crawler:progress',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
      progress,
    };

    this.logger.log(`Job ${job.id} está em ${JSON.stringify(progress)}%`);
    await Promise.all([
      userId
        ? this.ssePublisherService.notifyUser(userId, 'crawler:progress', event)
        : Promise.resolve(),
      this.ssePublisherService.broadcastToGroups('crawler:progress', event, 'AMS'),
    ]);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<CrawlerJobData>, error: Error) {
    if (!job?.data) {
      this.logger.error(`Job falhado sem dados de payload. ID: ${job?.id}, Erro: ${error.message}`);
      return;
    }

    const maxAttempts = job.opts.attempts || 3;

    if (job.attemptsMade < maxAttempts) {
      this.logger.warn(
        `Job ${job.id} falhou na tentativa ${job.attemptsMade}/${maxAttempts}. A aguardar retry automático...`,
      );
      return;
    }

    try {
      await this.dlqQueue.add('failed-job', {
        ...job.data,
        lastError: error.message,
        failedAt: new Date().toISOString(),
      });

      await this.crawlerWebsiteRepository.update(
        { id: job.data.crawlerId },
        { status: CrawlerStatus.FAILED },
      );

      const { websiteId, baseUrl, userId, crawlerId } = job.data;

      const event: CrawlerFailed = {
        event: 'crawler:failed',
        crawlerId,
        websiteId,
        baseUrl,
        userId,
        failedReason: error.message,
      };

      await Promise.all([
        userId
          ? this.ssePublisherService.notifyUser(userId, 'crawler:failed', event)
          : Promise.resolve(),
        this.ssePublisherService.broadcastToGroups('crawler:failed', event, 'AMS'),
      ]);

      this.logger.error(
        `Job ${job.id} falhou definitivamente após ${job.attemptsMade} tentativas: ${error.message}`,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      this.logger.error(
        `Erro crítico ao processar falha definitiva do job ${job.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<CrawlerJobData>, result: never) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerCompleted = {
      event: 'crawler:completed',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
    };

    await Promise.all([
      userId
        ? this.ssePublisherService.notifyUser(userId, 'crawler:completed', event)
        : Promise.resolve(),
      this.ssePublisherService.broadcastToGroups('crawler:completed', event, 'AMS'),
    ]);

    this.logger.log(`Job ${job.id} terminou com sucesso!`);
  }

  @OnWorkerEvent('drained')
  async onDrained() {
    const event: CrawlerDrained = {
      event: 'crawler:drained',
    };

    await this.ssePublisherService.notifyUser(0, 'crawler:drained', event);
    this.logger.log('All jobs have been processed and the queue is now empty.');
  }
}
