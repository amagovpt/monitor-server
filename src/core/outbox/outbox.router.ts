import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queues/queues.config';
import { ResourceRegistryHandlers } from 'src/domains/audit-engine/evaluation/queue/payload.types';
import { AuthRegistryHandlers } from '../authorization/queue/payload.types';

export type AllEventPayloads =
  | AuthRegistryHandlers[keyof AuthRegistryHandlers]
  | ResourceRegistryHandlers[keyof ResourceRegistryHandlers];

@Injectable()
export class OutboxRouter implements OnModuleInit {
  private readonly routes: Record<string, string> = {
    authorization: QUEUE_NAMES.AUTHORIZATION,
    evaluation: QUEUE_NAMES.EVALUATION_RESOURCE,
  };

  private readonly queueCache = new Map<string, Queue>();

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {}

  async routeAndDispatch(eventType: string, outboxId: string, payload: any): Promise<void> {
    const queueName = this.routes[eventType];

    if (!queueName) {
      throw new Error(`No queue route defined for event type: ${eventType}`);
    }

    let queue = this.queueCache.get(queueName);

    if (!queue) {
      const queueToken = getQueueToken(queueName);
      queue = this.moduleRef.get<Queue>(queueToken, { strict: false });
      this.queueCache.set(queueName, queue);
    }

    await queue.add(
      eventType,
      {
        outboxId,
        payload,
      },
      {
        jobId: outboxId,
      },
    );
  }
}
