import { Inject, Injectable } from '@nestjs/common';
import {
  ResourceRegistryHandlers,
  EvaluationPayload,
  EvaluationReportPayload,
} from '../queue/payload.types';
import { ACTION_REGISTRY } from './registry.keys';
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';
import { ClickHouseClient } from '@clickhouse/client';
import { EVALUATION_DELETE_QUERY } from '../queries/evaluation-delete.queries';
import { EvaluationStorage } from '../contracts/evaluation-storage.contract';
import type { EvaluationIdentifier } from '../types';
@Injectable()
export class EvaluationRegistry {
  constructor(
    @Inject(CLICKHOUSE_CLIENT) private readonly clickHouseClient: ClickHouseClient,
    @Inject(EvaluationStorage)
    private readonly evaluationStore: EvaluationStorage,
  ) {}

  private readonly registry: {
    [ACTION_REGISTRY.EVALUATION_DELETE]: (payload: EvaluationPayload) => Promise<void>;
    [ACTION_REGISTRY.EVALUATION_REPORT]: (payload: EvaluationReportPayload) => Promise<void>;
  } = {
    [ACTION_REGISTRY.EVALUATION_DELETE]: async (payload: EvaluationPayload): Promise<void> => {
      // Delete storage s3 related to the evaluation
      const evaluationIdentifier: EvaluationIdentifier = {
        evaluationId: payload.resourceId,
        websiteId: payload.websiteId,
        pageId: payload.pageId,
        evaluationDate: payload.evaluationDate,
      };
      await this.evaluationStore.delete(evaluationIdentifier);
      // delete from ClickHouse related to the evaluation
      await this.clickHouseClient.query({
        query: EVALUATION_DELETE_QUERY,
        query_params: {
          evaluationId: payload.resourceId,
        },
      });
    },
    [ACTION_REGISTRY.EVALUATION_REPORT]: async (
      payload: EvaluationReportPayload,
    ): Promise<void> => {
      return;
      // get all evaluations related to the evaluationQuarterId marked to be saved
      // freeze the evaluations related to the evaluationQuarterId and change status
      // migrate all records of these evaluations from evaluations_temp to evaluations in clickhouse
      // apagar as avaliações e storage delas e artifactos de evaluations não escolhidas para guardar
    },
  };

  async execute<K extends keyof ResourceRegistryHandlers>(
    type: K,
    payload: ResourceRegistryHandlers[K],
  ): Promise<void> {
    const handler = this.registry[type as keyof typeof this.registry] as
      | ((payload: ResourceRegistryHandlers[K]) => Promise<void>)
      | undefined;
    if (!handler) throw new Error(`No handler for resource: ${type}`);
    await handler(payload);
  }
}
