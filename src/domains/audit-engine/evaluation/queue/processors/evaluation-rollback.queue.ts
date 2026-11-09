import { ClickHouseClient } from '@clickhouse/client';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';
import { QUEUE_NAMES } from 'src/core/queues/queues.config';
import { EVALUATION_DELETE_ROLLBACK_QUERY } from 'src/domains/audit-engine/evaluation/queries/evaluation-delete.queries';

export interface EvaluationRollbackJobData {
  evaluationId: string;
}
@Processor(QUEUE_NAMES.EVAL_PRIVATE_ROLLBACK)
export class EvaluationRollbackWorker extends WorkerHost {
  constructor(
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE_ROLLBACK_DLQ)
    private readonly rollbackDlqQueue: Queue,
    @Inject(CLICKHOUSE_CLIENT) private readonly clickHouseClient: ClickHouseClient,
  ) {
    super();
  }

  async process(job: Job<EvaluationRollbackJobData, void, string>): Promise<void> {
    const { evaluationId } = job.data;
    const attemptNumber = job.attemptsMade;

    try {
      await this.clickHouseClient.query({
        query: EVALUATION_DELETE_ROLLBACK_QUERY,
        query_params: {
          evaluationId,
        },
      });

      return;
    } catch (error) {
      // if already attempted 3 times, move to DLQ
      if (attemptNumber >= 2) {
        // add to DLQ
        await this.rollbackDlqQueue.add(
          'failed-rollback',
          {
            evaluationId,
            originalJobId: job.id,
            error: error instanceof Error ? error.message : String(error),
            attempts: attemptNumber + 1,
          },
          {
            removeOnComplete: true,
          },
        );

        // Do not throw to avoid retrying
        return;
      }

      // Throw to retry
      throw error;
    }
  }
}
