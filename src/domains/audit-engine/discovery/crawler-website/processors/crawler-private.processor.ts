import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SsePublisherService } from '../../../../../core/sse/sse-publisher.service';
import { Repository } from 'typeorm';
import { CrawlerStatus, CrawlerWebsite } from '../entities/crawler-website.entity';
import { CrawlWebsiteHandler } from '../handlers/crawl-websites.handler';
import { InjectRepository } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { Logger } from '@nestjs/common';

@Processor('crawl-queue-private')
export class CrawlPrivateWorker extends WorkerHost {
  private readonly logger = new Logger(CrawlPrivateWorker.name);

  constructor(
    private readonly crawlWebsiteHandler: CrawlWebsiteHandler,
    @InjectQueue(QUEUE_NAMES.CRAWL_PRIVATE_DLQ)
    private readonly dlqQueue: Queue,
    @InjectRepository(CrawlerWebsite)
    private readonly crawlerWebsiteRepository: Repository<CrawlerWebsite>,
    private readonly eventEmitter: EventEmitter2,
    private readonly ssePublisherService: SsePublisherService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (!job?.data) {
      throw new Error(`Job ${job?.id} processado sem payload de dados (job.data é undefined).`);
    }

    await this.crawlWebsiteHandler.execute({
      id: job.data.crawlerId,
      baseUrl: job.data.baseUrl,
    });

    return { success: true };
  }

  @OnWorkerEvent('active')
  async onActive(job: Job) {
    const userId = job?.data?.userId;
    if (!userId) return;

    await Promise.all([
      this.ssePublisherService.notifyUser(userId, 'crawl-job-active', { jobId: job.id }, 'PRIVATE'),
      this.ssePublisherService.notifyUser(userId, 'ams-crawl-job-active', { jobId: job.id }, 'AMS'),
    ]);
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job, progress: number | object) {
    const userId = job?.data?.userId;
    if (!userId) return;

    this.logger.log(`Job ${job.id} está em ${JSON.stringify(progress)}%`);
    await Promise.all([
      this.ssePublisherService.notifyUser(
        userId,
        'crawl-job-progress',
        { jobId: job.id },
        'PRIVATE',
      ),
      this.ssePublisherService.notifyUser(
        userId,
        'ams-crawl-job-progress',
        { jobId: job.id },
        'AMS',
      ),
    ]);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
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

      const userId = job.data.userId;
      if (userId) {
        await Promise.all([
          this.ssePublisherService.notifyUser(
            userId,
            'crawl-job-failed',
            { jobId: job.id },
            'PRIVATE',
          ),
          this.ssePublisherService.notifyUser(
            userId,
            'ams-crawl-job-failed',
            { jobId: job.id },
            'AMS',
          ),
        ]);
      }

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
  async onCompleted(job: Job, result: any) {
    const userId = job?.data?.userId;
    if (!userId) return;

    await Promise.all([
      this.ssePublisherService.notifyUser(
        userId,
        'crawl-job-completed',
        { jobId: job.id },
        'PRIVATE',
      ),
      this.ssePublisherService.notifyUser(
        userId,
        'ams-crawl-job-completed',
        { jobId: job.id },
        'AMS',
      ),
      this.ssePublisherService.notifyUser(
        userId,
        'global-crawl-job-completed',
        { jobId: job.id },
        'GLOBAL',
      ),
    ]);

    this.logger.log(`Job ${job.id} terminou com sucesso!`);
  }

  @OnWorkerEvent('drained')
  async onDrained() {
    await this.ssePublisherService.notifyUser(0, 'ams-crawl-job-drained', {}, 'AMS');
    this.logger.log('All jobs have been processed and the queue is now empty.');
  }
}
