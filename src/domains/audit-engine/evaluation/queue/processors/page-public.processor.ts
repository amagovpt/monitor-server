import { Processor, WorkerHost } from '@nestjs/bullmq';
import { context, trace, propagation } from '@opentelemetry/api';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PageStatus } from '../../../../inventory/page/page-contexts.entity';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EvaluationJobData } from '../../types';
import { InjectDataSource } from '@nestjs/typeorm';
import { DelayedError } from 'bullmq';
export interface WebsiteExtractorJobData {
  contextId: number;
  websiteId: number;
  institutionId: number;
  directoryIds: number[];
  lastPageId?: number;
}

@Processor(QUEUE_NAMES.PUBLIC_PAGE_DISPATCH, {
  concurrency: 1,
})
export class PublicPageExtractorProcessor extends WorkerHost {
  private readonly logger = new Logger(PublicPageExtractorProcessor.name);
  private static readonly CHUNK_SIZE = 500;
  private static readonly MAX_WAITING_PAGES_LIMIT = 1000;

  constructor(
    @InjectQueue(QUEUE_NAMES.EVAL_PUBLIC) private readonly publicPageEval: Queue<EvaluationJobData>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<WebsiteExtractorJobData>): Promise<void> {
    const { contextId, websiteId } = job.data;
    this.logger.log(`A extrair páginas para Website ID: ${websiteId} (Context ID: ${contextId})`);
    const carrier: Record<string, string> = {};
    propagation.inject(context.active(), carrier);
    let lastPageId = job.data.lastPageId ?? 0;
    let totalDispatched = 0;

    while (true) {
      await this.throttleIfQueueBusy(job);
      const pages: Array<{
        page_id: number;
        url: string;
        website_id: number;
        institution_id: number;
        directories_ids: number[];
      }> = await this.dataSource.query(
        `
        SELECT pc.page_id, p.url,p.website_id, w.institution_id , w.directories_ids
        FROM page_contexts_monitor pc
        INNER JOIN pages p ON p.id = pc.page_id
	    	INNER JOIN v_websites_metadata w ON w.website_id = p.website_id
        WHERE pc.context_id = $1
          AND p.website_id = $2
          AND pc.page_id > $3
          AND pc.page_status NOT IN ('RUNNING'::page_status_enum)
        ORDER BY pc.page_id ASC
        LIMIT $5;
        
        `,
        [
          contextId,
          websiteId,
          lastPageId,
          PageStatus.RUNNING,
          PublicPageExtractorProcessor.CHUNK_SIZE,
        ],
      );

      if (pages.length === 0) {
        break;
      }

      const pageIds = pages.map((p) => p.page_id);

      const bulkJobs = pages.map((pages) => ({
        name: 'evaluate-page',
        data: {
          contextId,
          websiteId,
          pageId: pages.page_id,
          url: pages.url,
          institutionId: pages.institution_id,
          directoryIds: pages.directories_ids,
        },
        opts: {
          jobId: `ctx-${contextId}-page-${pages.page_id}`,
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          __otelContext: carrier,
        },
      }));

      const enqueuedJobs = await this.publicPageEval.addBulk(bulkJobs);

      const successfullyEnqueuedPageIds = enqueuedJobs
        .filter((job) => job && job.data?.pageId)
        .map((job) => job.data.pageId);

      if (successfullyEnqueuedPageIds.length > 0) {
        await this.dataSource.query(
          `
            UPDATE page_contexts_monitor
            SET page_status = $1
            WHERE page_id = ANY($2::int[]);
            `,
          [PageStatus.RUNNING, successfullyEnqueuedPageIds],
        );

        totalDispatched += pageIds.length;
        lastPageId = pageIds[pageIds.length - 1];
        await job.updateData({
          ...job.data,
          lastPageId,
        });
        await job.updateProgress({ totalDispatched, lastPageId });
      }

      this.logger.log(
        `Concluído dispatch do Website ${websiteId}: ${totalDispatched} páginas enviadas para fila.`,
      );
    }
    return;
  }
  private async throttleIfQueueBusy(job: Job<WebsiteExtractorJobData>): Promise<void> {
    const pendingCount = await this.publicPageEval.getJobCountByTypes('waiting', 'delayed');

    if (pendingCount >= PublicPageExtractorProcessor.MAX_WAITING_PAGES_LIMIT) {
      await job.moveToDelayed(Date.now() + 60000, job.token);

      throw new DelayedError();
    }
  }
}
