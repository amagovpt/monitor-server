import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Outbox } from './outbox.entity';
import { OutboxRouter } from './outbox.router';
import { OutboxRelayerService } from './outbox.cron';
import { OutboxService } from './outbox.service';
import { QUEUE_NAMES } from '../queues/queues.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Outbox]),
    BullModule.registerQueue({ name: QUEUE_NAMES.AUTHORIZATION }),
  ],
  providers: [OutboxService, OutboxRouter, OutboxRelayerService],
  exports: [OutboxService],
})
export class OutboxModule {}
