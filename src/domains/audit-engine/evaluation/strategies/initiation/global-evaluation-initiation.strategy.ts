import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationInitiator } from '../../contracts/evaluation-initiator.contract';
import { EvaluationTriggerType } from '../../dto/evaluation-trigger.dto';
import { EvaluationInitiatorRegistry } from '../../registries/evaluation-initiator.registry';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { FgaService } from 'src/core/authorization/fga.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';

@Injectable()
export class GlobalEvaluationInitiationStrategy implements EvaluationInitiator, OnModuleInit {
  readonly triggerType = EvaluationTriggerType.GLOBAL;

  constructor(
    private readonly registry: EvaluationInitiatorRegistry,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly openFgaService: FgaService,
    @InjectQueue(QUEUE_NAMES.PRIVATE_PAGE_DISPATCH)
    private readonly pageProcessorQueue: Queue,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async initiate(securityContext: SecurityContext): Promise<void> {
    const userId = securityContext.user.id;
    const isAllowed = await this.openFgaService.check(
      `user:${userId}`,
      'can_manage_users',
      'role:ams',
    );
    if (!isAllowed) {
      throw new ForbiddenException('User is not allowed to trigger directory evaluations.');
    }
    const contextId = securityContext.user.context.id;

    const websites = await this.dataSource.query<Array<{ id: number }>>('SELECT id FROM websites');

    const bulkJobs = websites.map((website) => ({
      name: 'evaluate-page',
      data: {
        contextId,
        websiteId: website.id,
        userId,
      },
      opts: {
        jobId: `ctx-${contextId}-website-${website.id}`,
        removeOnComplete: true,
        removeOnFail: { age: 3600 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }));

    const chunkSize = 500;
    for (let i = 0; i < bulkJobs.length; i += chunkSize) {
      const chunk = bulkJobs.slice(i, i + chunkSize);
      await this.pageProcessorQueue.addBulk(chunk);
    }
  }
}
