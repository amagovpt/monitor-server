import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { EvaluationsQuarterClosure } from '../entities/evaluations-quarter.entity';
import { Repository } from 'typeorm';
import { ResourceTypes } from '../queue/payload.types';
import { ACTION_REGISTRY } from '../registry/registry.keys';

@Injectable()
export class QuarterReportService {
  constructor(
    private readonly logger: Logger,
    private readonly outboxService: OutboxService,
    @InjectRepository(EvaluationsQuarterClosure)
    private readonly evaluationsQuarterClosureRepository: Repository<EvaluationsQuarterClosure>,
  ) {}

  @Cron('0 0 1 1,4,7,10 *', {
    name: 'quarterly-report',
    timeZone: 'Europe/Lisbon',
  })
  async handleQuarterlyCron() {
    this.logger.log('A iniciar a execução da tarefa trimestral...');

    try {
      await this.evaluationsQuarterClosureRepository.manager.transaction(async (manager) => {
        const evaluationsQuarterClosures = new EvaluationsQuarterClosure();
        const savedEntity = await this.evaluationsQuarterClosureRepository.save(
          evaluationsQuarterClosures,
        );
        await this.outboxService.putInOutbox(manager, {
          aggregateType: ResourceTypes.EVALUATION,
          aggregateId: 0,
          eventType: 'evaluation',
          payload: {
            resourceType: ResourceTypes.EVALUATION,
            resourceId: 0,
            evaluationQuarterId: savedEntity.id,
            action: ACTION_REGISTRY.EVALUATION_REPORT,
          },
        });
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro ao Registar tarefa trimestral: ${message}`, stack);
    }
  }
}
