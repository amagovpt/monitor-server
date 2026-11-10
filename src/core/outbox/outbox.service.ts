import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Outbox, OutboxStatus } from './outbox.entity';
import {
  PublishEventAuthOptions,
  AuthRegistryHandlers,
} from '../authorization/queue/payload.types';

import { ResourceRegistryHandlers } from 'src/domains/audit-engine/evaluation/queue/payload.types';
import { ResourcePublishEventOptions } from 'src/domains/audit-engine/evaluation/queue/payload.types';

export type PublishEventOptions =
  | PublishEventAuthOptions<keyof AuthRegistryHandlers>
  | ResourcePublishEventOptions<keyof ResourceRegistryHandlers>;

@Injectable()
export class OutboxService {
  async putInOutbox<T extends PublishEventOptions>(
    manager: EntityManager,
    options: T,
  ): Promise<void> {
    const outboxEvent = new Outbox();
    outboxEvent.aggregateType = options.aggregateType;
    outboxEvent.aggregateId = options.aggregateId;
    outboxEvent.eventType = options.eventType;
    outboxEvent.payload = options.payload;
    outboxEvent.status = OutboxStatus.PENDING;
    outboxEvent.attempts = 0;

    await manager.save(Outbox, outboxEvent);
  }

  async putManyInOutbox<T extends PublishEventOptions>(
    manager: EntityManager,
    events: T[],
  ): Promise<void> {
    const outboxEvents = events.map((options) => {
      const event = new Outbox();
      event.aggregateType = options.aggregateType;
      event.aggregateId = options.aggregateId;
      event.eventType = options.eventType;
      event.payload = options.payload;
      event.status = OutboxStatus.PENDING;
      event.attempts = 0;
      return event;
    });

    await manager.save(Outbox, outboxEvents);
  }
}
