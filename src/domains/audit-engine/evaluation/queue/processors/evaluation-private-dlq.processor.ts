import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { SsePublisherService } from '@core/sse/sse-publisher.service';
import { EvaluationFailed } from '../events/types';
import { EvaluationDlqJobPayload } from './evaluation-dlq.types';

@Processor(QUEUE_NAMES.EVAL_PRIVATE_DLQ)
export class EvaluationPrivateDlqProcessor extends WorkerHost {
  private readonly logger = new Logger(EvaluationPrivateDlqProcessor.name);

  public constructor(private readonly ssePublisherService: SsePublisherService) {
    super();
  }

  async process(job: Job<EvaluationDlqJobPayload>): Promise<void> {
    const original = job.data?.data;

    if (!original) {
      this.logger.warn(`DLQ job ${job.id} has no original job data, skipping failed event`);
      return;
    }

    const { websiteId, pageId, institutionId, directoryIds, userId } = original;

    const event: EvaluationFailed = {
      event: 'evaluation:failed',
      websiteId,
      pageId,
      institutionId,
      directoryIds,
      failedReason: job.data.failedReason ?? 'Unknown failure',
    };

    await Promise.all([
      userId
        ? this.ssePublisherService.notifyUser(userId, 'evaluation:failed', event)
        : Promise.resolve(),
      this.ssePublisherService.broadcastToGroups('evaluation:failed', event, 'AMS'),
    ]);
  }
}
