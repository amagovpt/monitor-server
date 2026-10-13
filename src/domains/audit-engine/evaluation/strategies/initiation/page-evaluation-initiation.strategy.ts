import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import { EvaluationInitiator } from '../../contracts/evaluation-initiator.contract';
import { EvaluationTriggerType } from '../../dto/evaluation-trigger.dto';
import { EvaluationInitiatorRegistry } from '../../registries/evaluation-initiator.registry';
import { RoleSlug, SecurityContext } from '@core/authentication/interfaces/types';
import { FgaService } from 'src/core/authorization/fga.service';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationJobData } from '../../types';
import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';

const FGA_BATCH_LIMIT = 50;
const DB_CHUNK_SIZE = 500;

interface PageDispatchMetadata {
  page_id: number;
  url: string;
  website_id: number;
  institution_id: number;
  directories_ids: number[];
}

@Injectable()
export class PageEvaluationInitiationStrategy implements EvaluationInitiator, OnModuleInit {
  readonly triggerType = EvaluationTriggerType.PAGE;
  private readonly logger = new Logger(PageEvaluationInitiationStrategy.name);

  constructor(
    private readonly registry: EvaluationInitiatorRegistry,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly openFgaService: FgaService,
    @InjectQueue(QUEUE_NAMES.EVAL_PUBLIC)
    private readonly publicQueue: Queue<EvaluationJobData>,
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE)
    private readonly privateQueue: Queue<EvaluationJobData>,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async initiate(context: SecurityContext, targetIds?: number[]): Promise<void> {
    if (!targetIds?.length) {
      throw new BadRequestException('Target IDs must be provided for page evaluation.');
    }

    const uniquePageIds = Array.from(new Set(targetIds));
    const contextId = context.user.context.id;

    // 1. Obter a relação página -> website_id para checagem de autorização
    const pageWebsiteMappings: Array<{ id: number; website_id: number }> =
      await this.dataSource.query(
        `
        SELECT id, website_id 
        FROM pages 
        WHERE id = ANY($1::int[]);
        `,
        [uniquePageIds],
      );

    if (!pageWebsiteMappings.length) {
      throw new BadRequestException('No matching pages found for provided target IDs.');
    }

    const uniqueWebsiteIds = Array.from(new Set(pageWebsiteMappings.map((p) => p.website_id)));

    const authorizedWebsiteIds: (string | number)[] = [];
    for (let i = 0; i < uniqueWebsiteIds.length; i += FGA_BATCH_LIMIT) {
      const chunk = uniqueWebsiteIds.slice(i, i + FGA_BATCH_LIMIT);
      const authorizedChunk = await this.openFgaService.filterAuthorizedIds(
        `user:${context.user.id}`,
        'website',
        chunk,
        ['can_manage', 'can_edit'],
      );
      authorizedWebsiteIds.push(...authorizedChunk);
    }

    const authorizedWebsiteSet = new Set(authorizedWebsiteIds.map((id) => Number(id)));

    // 3. Filtrar apenas as páginas cujos websites são autorizados
    const allowedPageIds = pageWebsiteMappings
      .filter((p) => authorizedWebsiteSet.has(p.website_id))
      .map((p) => p.id);

    if (!allowedPageIds.length) {
      throw new ForbiddenException(
        'User does not have permission to evaluate any of the requested pages.',
      );
    }

    // 4. Selecionar a fila apropriada com base na Role
    const targetQueue =
      context.user.role_slug === RoleSlug.ADMIN ? this.privateQueue : this.publicQueue;

    let totalEnqueued = 0;

    // 5. Chunking do lote autorizado: busca metadata, enfileira e atualiza status
    for (let i = 0; i < allowedPageIds.length; i += DB_CHUNK_SIZE) {
      const chunkIds = allowedPageIds.slice(i, i + DB_CHUNK_SIZE);

      // Busca metadados apenas de páginas elegíveis (não em RUNNING no contexto)
      const pagesToProcess: PageDispatchMetadata[] = await this.dataSource.query(
        `
        SELECT 
          pc.page_id, 
          p.url, 
          p.website_id, 
          w.institution_id, 
          w.directories_ids
        FROM page_contexts pc
        INNER JOIN pages p ON p.id = pc.page_id
        INNER JOIN v_websites_metadata w ON w.website_id = p.website_id
        WHERE pc.context_id = $1
          AND pc.page_id = ANY($2::int[])
          AND pc.page_status != $3::page_status_enum
        ORDER BY pc.page_id ASC;
        `,
        [contextId, chunkIds, PageStatus.RUNNING],
      );

      if (!pagesToProcess.length) {
        continue;
      }

      // Monta jobs determinísticos para evitar duplicados
      const bulkJobs = pagesToProcess.map((page) => ({
        name: 'evaluate-page',
        data: {
          contextId,
          websiteId: page.website_id,
          pageId: page.page_id,
          url: page.url,
          institutionId: page.institution_id,
          directoryIds: page.directories_ids ?? [],
        },
        opts: {
          jobId: `ctx-${contextId}-page-${page.page_id}`,
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }));

      const enqueuedJobs = await targetQueue.addBulk(bulkJobs);

      const successfullyEnqueuedIds = enqueuedJobs
        .filter((j) => j && j.data?.pageId)
        .map((j) => j.data.pageId);

      // Marca como RUNNING apenas os jobs inseridos com sucesso no Redis
      if (successfullyEnqueuedIds.length > 0) {
        await this.dataSource.query(
          `
          UPDATE page_contexts_monitor
          SET page_status = $1::page_status_enum
          WHERE context_id = $2
            AND page_id = ANY($3::int[]);
          `,
          [PageStatus.RUNNING, contextId, successfullyEnqueuedIds],
        );

        totalEnqueued += successfullyEnqueuedIds.length;
      }
    }

    this.logger.log(
      `[Context ${contextId}] Despachadas ${totalEnqueued} páginas para ${targetQueue.name}.`,
    );
  }
}
