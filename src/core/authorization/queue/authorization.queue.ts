import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository.js';
import { Outbox, OutboxStatus } from 'src/core/outbox/outbox.entity';
import { AuthorizationRegistry } from '../registry/authorization.registry';
import { AuthRegistryHandlers } from './payload.types';
export interface AuthorizationJobData<T extends keyof AuthRegistryHandlers> {
  outboxId: string;
  action: keyof AuthRegistryHandlers;
  payload: AuthRegistryHandlers[T];
}
@Processor(QUEUE_NAMES.AUTHORIZATION)
export class AuthorizationWorker extends WorkerHost {
  constructor(
    @InjectRepository(Outbox) private readonly outboxRepository: Repository<Outbox>,
    private readonly registry: AuthorizationRegistry,
  ) {
    super();
  }

  async process(
    job: Job<AuthorizationJobData<keyof AuthRegistryHandlers>, any, string>,
  ): Promise<any> {
    console.log(`Processing job ${job.id} with data:`, JSON.stringify(job.data, null, 2));
    const payload = job.data.payload;
    await this.registry.execute(payload.action, payload);

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
