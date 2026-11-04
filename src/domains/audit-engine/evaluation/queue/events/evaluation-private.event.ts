import { QueueEventsListener, QueueEventsHost, OnQueueEvent, InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { SsePublisherService } from '@core/sse/sse-publisher.service';
import { Queue } from 'bullmq';
import {
  EvaluationJobData,
  EvaluationStarted,
  EvaluationProgress,
  EvaluationFailed,
  EvaluationCompleted,
} from './types';
@QueueEventsListener(QUEUE_NAMES.EVAL_PRIVATE)
export class EvaluationPrivateEventsListener extends QueueEventsHost {
  public constructor(
    private readonly SsePublisherService: SsePublisherService,
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE)
    private readonly evaluationQueue: Queue<EvaluationJobData>,
  ) {
    super();
  }
  @OnQueueEvent('active')
  async onActive(job: { jobId: string; prev?: string }) {
    const jobData = await this.evaluationQueue.getJob(job.jobId);
    if (!jobData?.data) return;

    const { websiteId, pageId, institutionId, directoryIds } = jobData.data;

    const event: EvaluationStarted = {
      event: 'evaluation:started',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      previousState: job.prev,
    };

    this.SsePublisherService.notifyUser(0, 'evaluation:started', event);
    this.SsePublisherService.notifyUser(0, 'evaluation:started', event, 'AMS');
  }

  @OnQueueEvent('progress')
  async onProgress(job: { jobId: string; data: number | object }) {
    const jobData = await this.evaluationQueue.getJob(job.jobId);
    if (!jobData?.data) return;

    const { websiteId, pageId, institutionId, directoryIds } = jobData.data;

    const event: EvaluationProgress = {
      event: 'evaluation:progress',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      progress: job.data,
    };

    this.SsePublisherService.notifyUser(0, 'evaluation:progress', event);
    this.SsePublisherService.notifyUser(0, 'evaluation:progress', event, 'AMS');
  }

  @OnQueueEvent('completed')
  async onCompleted(job: { jobId: string; returnvalue: string }) {
    const evaluation = JSON.parse(job.returnvalue);

    const event: EvaluationCompleted = {
      event: 'evaluation:completed',
      evaluation,
    };

    this.SsePublisherService.notifyUser(0, 'evaluation:completed', event);
    this.SsePublisherService.notifyUser(0, 'evaluation:completed', event, 'AMS');
  }

  @OnQueueEvent('failed')
  async onFailed(job: { jobId: string; failedReason: string }) {
    const jobData = await this.evaluationQueue.getJob(job.jobId);
    if (!jobData?.data) return;

    const { websiteId, pageId, institutionId, directoryIds } = jobData.data;

    const event: EvaluationFailed = {
      event: 'evaluation:failed',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      failedReason: job.failedReason,
    };

    this.SsePublisherService.notifyUser(0, 'evaluation:failed', event);
    this.SsePublisherService.notifyUser(0, 'evaluation:failed', event, 'AMS');
  }
}
