import { Injectable, OnModuleInit, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationInitiator } from '../../contracts/evaluation-initiator.contract';
import { EvaluationTriggerType } from '../../dto/evaluation-trigger.dto';
import { EvaluationInitiatorRegistry } from '../../registries/evaluation-initiator.registry';
import { SecurityContext } from '@core/authentication/interfaces/types';
import { FgaService } from 'src/core/authorization/fga.service';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class InstitutionEvaluationInitiationStrategy implements EvaluationInitiator, OnModuleInit {
  readonly triggerType = EvaluationTriggerType.INSTITUTION;

  constructor(
    private readonly registry: EvaluationInitiatorRegistry,
    private readonly openFgaService: FgaService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectQueue(QUEUE_NAMES.PRIVATE_PAGE_DISPATCH)
    private readonly pageProcessorQueue: Queue,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async initiate(securityContext: SecurityContext, targetIds: number[]): Promise<void> {
    if (!targetIds?.length) {
      throw new BadRequestException('At least one institution ID must be provided.');
    }
    const userId = securityContext.user.id;
    const isAllowed = await this.openFgaService.check(
      `user:${userId}`,
      'can_manage_users',
      'role:ams',
    );
    if (!isAllowed) {
      throw new ForbiddenException('User is not allowed to trigger institution evaluations.');
    }
    const contextId = securityContext.user.context.id;

    const websites = await this.dataSource.query<Array<{ id: number }>>(
      'SELECT id FROM websites WHERE institution_id IN (' + targetIds.join(',') + ')',
    );

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
