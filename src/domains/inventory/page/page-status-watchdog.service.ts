import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { metrics } from '@opentelemetry/api';
import { PageStatus } from './page-contexts.entity'; // Ajusta o caminho do teu enum

const meter = metrics.getMeter('evaluation-watchdog-service');
const zombiePagesCounter = meter.createCounter('zombie_pages_cleaned_total', {
  description: 'Total number of zombie pages cleaned by the watchdog',
});
@Injectable()
export class PageStatusWatchdogService {
  private readonly logger = new Logger(PageStatusWatchdogService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleZombieEvaluationsCleanup() {
    this.logger.debug('A executar verificação de jobs zombies em RUNNING...');

    try {
      const result = await this.dataSource.query(
        `
        UPDATE page_contexts
        SET 
          page_status = $1::page_status_enum,
          updated_at = NOW()
        WHERE page_status = $2::page_status_enum
          AND updated_at < NOW() - INTERVAL '30 minutes'
        RETURNING context_id, page_id;
        `,
        [PageStatus.FAILED, PageStatus.RUNNING],
      );

      const affectedRows = result.length;

      if (affectedRows > 0) {
        this.logger.warn(
          `[Watchdog] Limpeza concluída: ${affectedRows} páginas presas em RUNNING foram transacionadas para FAILED por timeout/crash do worker.`,
        );
        zombiePagesCounter.add(affectedRows, {
          reason: 'worker_timeout_or_crash',
          target_status: PageStatus.FAILED,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[Watchdog] Erro crítico ao limpar páginas zombies em RUNNING: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
