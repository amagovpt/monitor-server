import { Module } from '@nestjs/common';
import { ClickhouseModule } from 'src/core/clickhouse/clickhouse.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticRepository } from './analytics.repository';
import { AnalyticsController } from './analytics.controller';
import { ExportService } from './services/export.service';
import { ExportQueryRegistryService } from './services/export-query-registry.service';

@Module({
  imports: [ClickhouseModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticRepository,
    ExportService,
    ExportQueryRegistryService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
