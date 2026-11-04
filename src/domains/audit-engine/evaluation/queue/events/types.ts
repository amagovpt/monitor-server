import { JobEventType } from 'src/core/queues/types';
import { EvaluationDTO } from '../../dto/evaluation.dto';

export interface EvaluationMeta {
  evaluationId?: number;
}

export interface PageMetadata {
  websiteId: number;
  pageId: number;
  url: string;
}
export interface AdditionalMetadata {
  institutionId: number;
  directoryIds: number[];
}

export interface EvaluationJobData extends EvaluationMeta, PageMetadata, AdditionalMetadata {
  __otelContext?: Record<string, unknown>;
}
export type EvaluationJobEvent = `evaluation:${JobEventType}`;

export interface EvaluationStarted {
  event: 'evaluation:started';
  websiteId: number;
  pageId: number;
  institutionId: number;
  directoryIds: number[];
  previousState?: string;
}

export interface EvaluationProgress {
  event: 'evaluation:progress';
  websiteId: number;
  pageId: number;
  institutionId: number;
  directoryIds: number[];
  progress: number | object;
}

export interface EvaluationFailed {
  event: 'evaluation:failed';
  websiteId: number;
  pageId: number;
  institutionId: number;
  directoryIds: number[];
  failedReason: string;
}

export interface EvaluationCompleted {
  event: 'evaluation:completed';
  evaluation: EvaluationDTO;
}

export type EvaluationJobMessage =
  EvaluationStarted | EvaluationProgress | EvaluationFailed | EvaluationCompleted;
