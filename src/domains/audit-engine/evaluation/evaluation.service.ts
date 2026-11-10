import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationRepository } from './evaluation.repository';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { ReadStream } from 'node:fs';
import { EvaluationStorage } from './contracts/evaluation-storage.contract';
import { EvaluationQueryDTO } from './dto/request/evaluation-request.dto';
import { EvaluationInitiatorRegistry } from './registries/evaluation-initiator.registry';
import { EvaluationTriggerType } from './dto/evaluation-trigger.dto';
import { Repository } from 'typeorm';
import { Page } from 'src/domains/inventory/page/page.entity';
import { EvaluationDTO } from './dto/evaluation.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly evaluationInitiatorRegistry: EvaluationInitiatorRegistry,
    private readonly logger: AppLoggerService,
    @Inject(EvaluationStorage)
    private readonly evaluationStore: EvaluationStorage,
  ) {
    this.logger.setContext(EvaluationService.name);
  }

  public async getEvaluations(
    websiteId: number,
    pageId: number,
    securityContext: SecurityContext,
    query: EvaluationQueryDTO,
  ): Promise<{ data: Evaluation[]; count: number }> {
    return this.evaluationRepository.getManyEvaluations(websiteId, pageId, {
      filters: query.filters,
      sortings: query.sorts,
      pagination: query.pagination,
      securityContext,
      contexts: query.contexts ?? [],
    });
  }

  public async getEvaluationById(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<EvaluationDTO> {
    const evaluation = await this.evaluationRepository.findEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${evaluationId} not found`);
    }
    const evaluationDto = plainToInstance(EvaluationDTO, evaluation);
    return evaluationDto;
  }

  public async evaluate(
    targetType: EvaluationTriggerType,
    targetIds: number[],
    securityContext: SecurityContext,
  ): Promise<void> {
    const initiator = this.evaluationInitiatorRegistry.get(targetType);
    await initiator.initiate(securityContext, targetIds);
  }

  public async saveExternalEvaluation(
    websiteId: number,
    pageId: number,
    data: string,
    securityContext: SecurityContext,
  ): Promise<void> {
    const page = await this.pageRepository.findOne({ where: { id: pageId, websiteId } });
    if (!page) {
      throw new NotFoundException(`Page with ID ${pageId} not found`);
    }

    const splittedData = data.split(';');
    if (splittedData.length < 10) {
      throw new BadRequestException('Invalid external evaluation data format.');
    }

    const newEvaluation = new Evaluation();
    newEvaluation.pageId = pageId;
    newEvaluation.score = splittedData[8].replace(',', '.');

    const criteriaParts = splittedData[2].split('@');
    if (criteriaParts.length < 3) {
      throw new BadRequestException('Invalid criteria formatting in external evaluation payload.');
    }

    newEvaluation.A = parseInt(criteriaParts[0], 10) || 0;
    newEvaluation.AA = parseInt(criteriaParts[1], 10) || 0;
    newEvaluation.AAA = parseInt(criteriaParts[2], 10) || 0;
    newEvaluation.createdAt = new Date(splittedData[9]);
    newEvaluation.createdById = securityContext.user.id;

    await this.evaluationRepository.save(newEvaluation);
  }

  public async getEvaluationResultJson(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<ReadStream> {
    const evaluation = await this.getEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );

    return this.evaluationStore.getStream(
      {
        evaluationId: evaluation.id,
        websiteId,
        pageId: evaluation.pageId,
        evaluationDate: evaluation.evaluationDate!.toString(),
      },
      'nodes',
    );
  }

  public async getEvaluationHtml(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<ReadStream> {
    const evaluation = await this.getEvaluationById(
      websiteId,
      pageId,
      evaluationId,
      securityContext,
    );

    return this.evaluationStore.getStream(
      {
        evaluationId: evaluation.id,
        websiteId,
        pageId: evaluation.pageId,
        evaluationDate: evaluation.evaluationDate!.toString(),
      },
      'html',
    );
  }

  public async deleteEvaluation(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<void> {
    const evaluation = await this.evaluationRepository.getEvaluationByContext(
      evaluationId,
      websiteId,
      pageId,
      securityContext.user.context.id,
    );
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found.');
    }
    const isFrozen = evaluation.frozenAt !== null;
    if (isFrozen) {
      throw new BadRequestException('Cannot delete a frozen evaluation.');
    }

    await this.evaluationRepository.deleteEvaluation(evaluation, websiteId);
  }

  public async deleteFrozenEvaluation(
    websiteId: number,
    pageId: number,
    evaluationId: number,
    securityContext: SecurityContext,
  ): Promise<void> {
    const evaluation = await this.evaluationRepository.getEvaluationByContext(
      evaluationId,
      websiteId,
      pageId,
      securityContext.user.context.id,
    );
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found.');
    }
    const isFrozen = evaluation.frozenAt !== null;
    if (!isFrozen) {
      throw new BadRequestException('Evaluation is not frozen.');
    }

    await this.evaluationRepository.deleteEvaluation(evaluation, websiteId);
  }
}
