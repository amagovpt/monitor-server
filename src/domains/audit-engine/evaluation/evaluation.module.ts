import { Logger, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationController } from './evaluation.controller';
import { Page } from 'src/domains/inventory/page/page.entity';
import { AccessibilityStatementModule } from 'src/domains/compliance/accessibility-statement/accessibility-statement.module';
import { EvaluationRepository } from './evaluation.repository';

import { RedisModule } from 'src/redis/redis.module';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';
import { EvaluationContext } from './entities/contexts-evaluation.entity';

import { Website } from 'src/domains/inventory/website/website.entity';
import { RepositoryTableConfig } from 'src/common/repositories/base-context';
import { EVALUATION_CONTEXT_METADATA_CONFIG } from './evaluation.constants';
import { EvaluationStorage } from './contracts/evaluation-storage.contract';
import { EvaluationInitiatorRegistry } from './registries/evaluation-initiator.registry';
import {
  GlobalEvaluationInitiationStrategy,
  TagEvaluationInitiationStrategy,
  DirectoryEvaluationInitiationStrategy,
  PageEvaluationInitiationStrategy,
  WebsiteEvaluationInitiationStrategy,
  InstitutionEvaluationInitiationStrategy,
} from './strategies/initiation';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { PublicPageExtractorProcessor } from './queue/processors/page-public.processor';
import { PrivatePageExtractorProcessor } from './queue/processors/page-private.processor';
import { EvaluationS3StorageStrategy } from './strategies/storage/evaluation-s3-aws-storage.strategy';
import { EvaluationPrivateEventsListener } from './queue/events/evaluation-private.event';
import { EvaluationPublicEventsListener } from './queue/events/evaluation-public.event';
import { QueuesModule } from 'src/core/queues/queues.module';
import { EvaluationArtifact } from './entities/evaluation-artifacts.entity';

export const EvaluationTableConfigProvider: Provider = {
  provide: EVALUATION_CONTEXT_METADATA_CONFIG,
  useFactory: (): RepositoryTableConfig => ({
    mainTable: {
      table: 'evaluations',
      alias: 'evaluation',
      pk: 'id',
      fk: 'evaluation_id',
    },
    contextTable: {
      table: 'evaluation_contexts',
      alias: 'evaluation_context',
      pk: 'id',
      fk: 'evaluation_id',
    },
    hasHelperTable: false,
  }),
};

@Module({
  imports: [
    QueuesModule,
    TypeOrmModule.forFeature([EvaluationArtifact, Website, Page, Evaluation, EvaluationContext]),
    RedisModule,
    AccessibilityStatementModule,
    ClickhouseModule,
  ],
  exports: [EvaluationService],
  providers: [
    {
      provide: EvaluationStorage,
      useClass: EvaluationS3StorageStrategy,
    },

    EvaluationInitiatorRegistry,
    EvaluationService,
    EvaluationRepository,
    PublicPageExtractorProcessor,
    PrivatePageExtractorProcessor,
    Logger,
    EvaluationTableConfigProvider,
    DirectoryEvaluationInitiationStrategy,
    TagEvaluationInitiationStrategy,
    PageEvaluationInitiationStrategy,
    WebsiteEvaluationInitiationStrategy,
    InstitutionEvaluationInitiationStrategy,
    GlobalEvaluationInitiationStrategy,
    EvaluationPrivateEventsListener,
    EvaluationPublicEventsListener,
  ],
  controllers: [EvaluationController],
})
export class EvaluationModule {}
