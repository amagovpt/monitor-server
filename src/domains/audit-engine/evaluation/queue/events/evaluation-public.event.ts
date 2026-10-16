import { QueueEventsListener, QueueEventsHost, OnQueueEvent } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { SsePublisherService } from '@core/sse/sse-publisher.service';

@QueueEventsListener(QUEUE_NAMES.EVAL_PUBLIC)
export class EvaluationPublicEventsListener extends QueueEventsHost {
  public constructor(private readonly SsePublisherService: SsePublisherService) {
    super();
  }
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    // Job começou a ser processado no worker
    this.SsePublisherService.notifyUser(0, 'job-active', { jobId: job.jobId });
    this.SsePublisherService.notifyUser(0, 'job-active', { jobId: job.jobId }, 'MONITOR');
  }

  @OnQueueEvent('progress')
  onProgress(job: { jobId: string; data: number | object }) {
    // Notificar frontend/gateway via SSE ou WebSocket
    this.SsePublisherService.notifyUser(0, 'job-progress', { jobId: job.jobId, data: job.data });
    this.SsePublisherService.notifyUser(
      0,
      'job-progress',
      { jobId: job.jobId, data: job.data },
      'MONITOR',
    );
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string; returnvalue: string }) {
    // Persistir estado final ou disparar próximo passo no pipeline
    this.SsePublisherService.notifyUser(0, 'job-completed', {
      jobId: job.jobId,
      returnvalue: job.returnvalue,
    });
    this.SsePublisherService.notifyUser(
      0,
      'job-completed',
      { jobId: job.jobId, returnvalue: job.returnvalue },
      'MONITOR',
    );
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; failedReason: string }) {
    // Tratar alertas, Dead Letter Queue ou retries
    this.SsePublisherService.notifyUser(0, 'job-failed', {
      jobId: job.jobId,
      failedReason: job.failedReason,
    });
    this.SsePublisherService.notifyUser(
      0,
      'job-failed',
      { jobId: job.jobId, failedReason: job.failedReason },
      'MONITOR',
    );
  }
}
