import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IWebsiteScraper } from '../types/scraper.interface';
import { Inject } from '@nestjs/common';
import { SsePublisherService } from '../../../../../core/sse/sse-publisher.service';

@Processor('crawl-queue-public', {
  concurrency: 1,
})
export class CrawlPublicWorker extends WorkerHost {
  constructor(
    @Inject(IWebsiteScraper)
    private readonly websiteScraper: IWebsiteScraper,

    private readonly SsePublisherService: SsePublisherService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'crawl-job':
        console.log('Processing crawl job for websiteId:', job.data.websiteId);
        await this.websiteScraper.scrapeWebsite(job.data.websiteId);

      default:
        throw new Error(`No handler for job ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Job ${job.id} is now active.`);
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-active',
      { jobId: job.id },
      'PRIVATE',
    );
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-active',
      { jobId: job.id },
      'MONITOR',
    );
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    console.log(`Job ${job.id} está em ${progress}%`);
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-progress',
      { jobId: job.id },
      'PRIVATE',
    );
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-progress',
      { jobId: job.id },
      'MONITOR',
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} falhou. Erro:`, error);
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-failed',
      { jobId: job.id },
      'PRIVATE',
    );
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-failed',
      { jobId: job.id },
      'MONITOR',
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    console.warn(`Job ${job.id} ficou 'stalled' (possível crash do processo)`);
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-stalled',
      { jobId: job.id },
      'PRIVATE',
    );
    this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-stalled',
      { jobId: job.id },
      'MONITOR',
    );
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job, result: any) {
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'crawl-job-completed',
      { jobId: job.id },
      'PRIVATE',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'ams-crawl-job-completed',
      { jobId: job.id },
      'MONITOR',
    );
    await this.SsePublisherService.notifyUser(
      job.data.userId,
      'global-crawl-job-completed',
      { jobId: job.id },
      'GLOBAL',
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    console.log('All jobs have been processed and the queue is now empty.');
    this.SsePublisherService.notifyUser(0, 'ams-crawl-job-drained', {}, 'MONITOR');
  }

  @OnWorkerEvent('paused')
  onPaused() {
    console.log('Queue has been paused.');
  }

  @OnWorkerEvent('resumed')
  onResumed() {
    console.log('Queue has been resumed.');
  }
}
