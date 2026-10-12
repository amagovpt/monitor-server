import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from './queues.config';
import { ExpressAdapter } from '@bull-board/express';
import { ConfigService } from '@nestjs/config';
import { QueueMetricsService } from './queue-metrics.service';
import { QueuesController } from './queue.controller';
import { QueueManagementService } from './queue-management.service';
import { BullMQOtel } from 'bullmq-otel'; // <-- 1. Importar o pacote

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const telemetry = new BullMQOtel({
          tracerName: process.env.OTEL_SERVICE_NAME || 'monitor-server',
          meterName: process.env.OTEL_SERVICE_NAME || 'monitor-server',
          enableMetrics: true,
        });
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            db: configService.get<number>('REDIS_DB_BULL') || 0,
          },
          telemetry,
        };
      },
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.CRAWL_PRIVATE,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.EVAL_PUBLIC,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.EVAL_PUBLIC_DLQ,
      },
      {
        name: QUEUE_NAMES.EVAL_PRIVATE,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.EVAL_PRIVATE_DLQ,
      },
      {
        name: QUEUE_NAMES.CRAWL_PUBLIC,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      { name: QUEUE_NAMES.CRAWL_PRIVATE_DLQ },
      { name: QUEUE_NAMES.CRAWL_PUBLIC_DLQ },
      { name: QUEUE_NAMES.PRIVATE_PAGE_DISPATCH },
      { name: QUEUE_NAMES.PUBLIC_PAGE_DISPATCH },
      { name: QUEUE_NAMES.AUTHORIZATION, defaultJobOptions: DEFAULT_JOB_OPTIONS },
    ),
    BullBoardModule.forFeature(
      { name: QUEUE_NAMES.CRAWL_PRIVATE, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PUBLIC, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PRIVATE, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.CRAWL_PUBLIC, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.AUTHORIZATION, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PUBLIC_DLQ, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EVAL_PRIVATE_DLQ, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.CRAWL_PRIVATE_DLQ, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.CRAWL_PUBLIC_DLQ, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.PRIVATE_PAGE_DISPATCH, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.PUBLIC_PAGE_DISPATCH, adapter: BullMQAdapter },
    ),
    BullBoardModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        route: configService.get<string>('BULL_BOARD_ROUTE') || '/admin/queues',
        adapter: ExpressAdapter,
      }),
    }),
  ],
  controllers: [QueuesController],
  providers: [QueueMetricsService, QueueManagementService],
  exports: [BullModule, QueueMetricsService, QueueManagementService],
})
export class QueuesModule {}
