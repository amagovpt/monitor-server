import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository.js';
import { EvaluationRegistry } from '../../registry/evaluation.registry';
import { Outbox, OutboxStatus } from 'src/core/outbox/outbox.entity';
import { ResourceRegistryHandlers } from '../../queue/payload.types';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { Inject } from '@nestjs/common';

export interface ResourceJobData<T extends keyof ResourceRegistryHandlers> {
  outboxId: string;
  action: T;
  payload: ResourceRegistryHandlers[T] extends (payload: infer P) => any ? P : never; // Extrai o payload do handler automaticamente
}

@Processor(QUEUE_NAMES.EVALUATION_RESOURCE)
export class EvaluationDeleteWorker extends WorkerHost {
  constructor(
    @InjectRepository(Outbox) private readonly outboxRepository: Repository<Outbox>,
    @Inject(EvaluationRegistry) private readonly evaluationRegistry: EvaluationRegistry,
  ) {
    super();
  }

  async process(
    job: Job<ResourceJobData<keyof ResourceRegistryHandlers>, any, string>,
  ): Promise<{ success: true }> {
    const { action, payload } = job.data;

    await this.evaluationRegistry.execute(action, payload);

    return { success: true };
  }

  @OnWorkerEvent('active')
  async onActive(job: Job) {
    console.log(`🏃 Job ${job.id} começou a ser processado.`);
    await this.outboxRepository.update(job.data.outboxId, {
      status: OutboxStatus.PROCESSING,
    });
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    await this.outboxRepository.update(job.data.outboxId, {
      status: OutboxStatus.COMPLETED,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    console.error(`❌ Job ${job.id} falhou: ${error.message}`);
    await this.outboxRepository.update(job.data.outboxId, {
      status: OutboxStatus.FAILED,
    });
  }
}
