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
import { EvaluationDTO } from '../../dto/evaluation.dto';
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

    const { websiteId, pageId, institutionId, directoryIds, userId } = jobData.data;

    const event: EvaluationStarted = {
      event: 'evaluation:started',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      previousState: job.prev,
    };
    Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'evaluation:started', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('evaluation:started', event, 'AMS'),
    ]);
  }

  @OnQueueEvent('progress')
  async onProgress(job: { jobId: string; data: number | object }) {
    const jobData = await this.evaluationQueue.getJob(job.jobId);
    if (!jobData?.data) return;

    const { websiteId, pageId, institutionId, directoryIds, userId } = jobData.data;

    const event: EvaluationProgress = {
      event: 'evaluation:progress',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      progress: job.data,
    };

    Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'evaluation:progress', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('evaluation:progress', event, 'AMS'),
    ]);
  }

  @OnQueueEvent('completed')
  async onCompleted(job: { jobId: string; returnvalue: EvaluationDTO | null }) {
    if (!job.returnvalue) return;

    const userId = job.returnvalue.createdById ?? undefined;

    const event: EvaluationCompleted = {
      event: 'evaluation:completed',
      evaluation: job.returnvalue,
    };

    Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'evaluation:completed', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('evaluation:completed', event, 'AMS'),
    ]);
  }

  @OnQueueEvent('failed')
  async onFailed(job: { jobId: string; failedReason: string }) {
    const jobData = await this.evaluationQueue.getJob(job.jobId);
    if (!jobData?.data) return;

    const { websiteId, pageId, institutionId, directoryIds, userId } = jobData.data;

    const event: EvaluationFailed = {
      event: 'evaluation:failed',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      failedReason: job.failedReason,
    };

    Promise.all([
      userId
        ? this.SsePublisherService.notifyUser(userId, 'evaluation:failed', event)
        : Promise.resolve(),
      this.SsePublisherService.broadcastToGroups('evaluation:failed', event, 'AMS'),
    ]);
  }
}
