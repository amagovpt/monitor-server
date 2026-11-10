import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@core/queues/queues.config';
import { Job } from 'bullmq';
import { SsePublisherService } from '@core/sse/sse-publisher.service';
import {
  CrawlerJobData,
  CrawlerStarted,
  CrawlerProgress,
  CrawlerFailed,
  CrawlerCompleted,
  CrawlerStalled,
  CrawlerDrained,
} from '../types/events';
import { CrawlWebsiteHandler } from '../handlers/crawl-websites.handler';

@Processor(QUEUE_NAMES.CRAWL_PUBLIC, {
  concurrency: 1,
})
export class CrawlPublicWorker extends WorkerHost {
  constructor(
    private readonly crawlWebsiteHandler: CrawlWebsiteHandler,

    private readonly SsePublisherService: SsePublisherService,
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
  onActive(job: Job<CrawlerJobData>) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerStarted = {
      event: 'crawler:started',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
    };

    return Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'crawler:started', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('crawler:started', event, 'MONITOR'),
    ]);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<CrawlerJobData>, progress: number | object) {
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

    return Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'crawler:progress', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('crawler:progress', event, 'MONITOR'),
    ]);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<CrawlerJobData>, error: Error) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerFailed = {
      event: 'crawler:failed',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
      failedReason: error.message,
    };

    return Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'crawler:failed', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('crawler:failed', event, 'MONITOR'),
    ]);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<CrawlerJobData>) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerStalled = {
      event: 'crawler:stalled',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
    };

    return Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'crawler:stalled', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('crawler:stalled', event, 'MONITOR'),
    ]);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<CrawlerJobData>, result: void) {
    if (!job?.data) return;

    const { websiteId, baseUrl, userId, crawlerId } = job.data;

    const event: CrawlerCompleted = {
      event: 'crawler:completed',
      crawlerId,
      websiteId,
      baseUrl,
      userId,
    };
    if (userId) {
      await this.SsePublisherService.notifyUser(userId, 'crawler:completed', event);
    }
    await this.SsePublisherService.broadcastToGroups('crawler:completed', event, 'MONITOR');
  }

  @OnWorkerEvent('drained')
  onDrained() {
    const event: CrawlerDrained = {
      event: 'crawler:drained',
    };

    this.SsePublisherService.broadcastToGroups('crawler:drained', event, 'MONITOR');
  }
}
