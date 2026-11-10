import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { EvaluationInitiator } from '../../contracts/evaluation-initiator.contract';
import { EvaluationInitiatorRegistry } from '../../registries/evaluation-initiator.registry';
import { EvaluationTriggerType } from '../../dto/evaluation-trigger.dto';
import { RoleSlug, SecurityContext } from '@core/authentication/interfaces/types';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { FgaService } from 'src/core/authorization/fga.service';

@Injectable()
export class WebsiteEvaluationInitiationStrategy implements EvaluationInitiator, OnModuleInit {
  readonly triggerType = EvaluationTriggerType.WEBSITE;

  constructor(
    private readonly registry: EvaluationInitiatorRegistry,
    @InjectQueue(QUEUE_NAMES.PRIVATE_PAGE_DISPATCH)
    private readonly privateQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PUBLIC_PAGE_DISPATCH)
    private readonly publicQueue: Queue,
    private readonly openFgaService: FgaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async initiate(context: SecurityContext, targetIds?: number[]): Promise<void> {
    if (!targetIds?.length) {
      throw new ForbiddenException('Target IDs must be provided for website evaluation.');
    }
    const uniqueWebsiteIds = Array.from(new Set(targetIds));
    const FGA_BATCH_LIMIT = 50;
    const userId = context.user.id;
    const authorizedWebsiteIds: (string | number)[] = [];
    for (let i = 0; i < uniqueWebsiteIds.length; i += FGA_BATCH_LIMIT) {
      const chunk = uniqueWebsiteIds.slice(i, i + FGA_BATCH_LIMIT);

      const authorizedChunk = await this.openFgaService.filterAuthorizedIds(
        `user:${userId}`,
        'website',
        chunk,
        ['can_manage', 'can_edit'],
      );
      authorizedWebsiteIds.push(...authorizedChunk);
    }

    const targetQueue =
      context.user.role_slug === RoleSlug.ADMIN ? this.privateQueue : this.publicQueue;

    // filtrar lista de websites ids por aqueles que o utilizador do contexto tem autorização
    const jobs = authorizedWebsiteIds.map((websiteId, _) => {
      return {
        name: 'evaluation-job',
        data: {
          websiteId: websiteId,
          contextId: context.user.context.id,
          userId,
        },
        opts: {
          jobId: `ctx-${context.user.context.id}-website-${websiteId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      };
    });
    await targetQueue.addBulk(jobs);
    // adicionar ao job queue process websites do contexto certo com idemepotency key
  }
}
