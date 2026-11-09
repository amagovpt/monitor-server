import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { EvaluationInitiator } from '../../contracts/evaluation-initiator.contract';
import { EvaluationInitiatorRegistry } from '../../registries/evaluation-initiator.registry';
import { EvaluationTriggerType } from '../../dto/evaluation-trigger.dto';
import { SecurityContext } from '@core/authentication/interfaces/types';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { FgaService } from 'src/core/authorization/fga.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';

@Injectable()
export class DirectoryEvaluationInitiationStrategy implements EvaluationInitiator, OnModuleInit {
  readonly triggerType = EvaluationTriggerType.DIRECTORY;

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

  async initiate(securityContext: SecurityContext, targetIds: number[]): Promise<void> {
    if (!targetIds?.length) {
      throw new BadRequestException('At least one directory ID must be provided.');
    }
    const userId = securityContext.user.id;
    if (!userId) {
      throw new ForbiddenException('User ID is required.');
    }

    const isAllowed = await this.openFgaService.check(
      `user:${userId}`,
      'can_manage_users',
      'role:ams',
    );
    if (!isAllowed) {
      throw new ForbiddenException('User is not allowed to trigger directory evaluations.');
    }
    const contextId = securityContext.user.context.id;

    const websites = await this.dataSource.query<Array<{ website_ids: number[] }>>(
      'SELECT website_ids from v_directory_websites WHERE id = 1 ',
    );

    const bulkJobs = websites.flatMap((website) =>
      website.website_ids.map((id: number) => ({
        name: 'evaluate-page',
        data: {
          contextId,
          websiteId: id,
          userId,
        },
        opts: {
          jobId: `ctx-${contextId}-website-${id}`,
          removeOnComplete: true,
          removeOnFail: { age: 3600 },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      })),
    );

    const chunkSize = 500;
    for (let i = 0; i < bulkJobs.length; i += chunkSize) {
      const chunk = bulkJobs.slice(i, i + chunkSize);
      await this.pageProcessorQueue.addBulk(chunk);
    }
  }
}
