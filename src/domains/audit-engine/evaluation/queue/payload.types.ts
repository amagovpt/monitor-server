import { AggregateType } from 'src/core/outbox/types';
import { ACTION_REGISTRY } from '../registry/registry.keys';

export const ResourceEventType: Record<AggregateType, string> = {
  EVALUATION: 'evaluation',
  PAGE: 'page',
  WEBSITE: 'website',
} as const;

export type ResourceEventType = (typeof ResourceEventType)[keyof typeof ResourceEventType];

export interface ResourcePublishEventOptions<T extends keyof ResourceRegistryHandlers> {
  aggregateType: string;
  aggregateId: number;
  eventType: ResourceEventType;
  payload: ResourceRegistryHandlers[T];
}
export const AUTHORIZATION_ACTION = {
  EVALUATION_DELETE: `EVALUATION:delete`,
} as const;

export type RegistryKey = (typeof AUTHORIZATION_ACTION)[keyof typeof AUTHORIZATION_ACTION];

export type ResourceRegistryHandlers = {
  [ACTION_REGISTRY.EVALUATION_DELETE]: EvaluationPayload;
  [ACTION_REGISTRY.EVALUATION_REPORT]: EvaluationReportPayload;
};
export const ResourceTypes = {
  EVALUATION: 'evaluation',
} as const;
export type ResourcePayload = EvaluationPayload | EvaluationReportPayload;

export type ModelResources = (typeof ResourceTypes)[keyof typeof ResourceTypes];

export interface BasePayload<T extends ModelResources> {
  resourceType: T;
  resourceId: number;
  action: keyof ResourceRegistryHandlers;
}
export interface EvaluationPayload extends BasePayload<typeof ResourceTypes.EVALUATION> {
  resourceType: typeof ResourceTypes.EVALUATION;
  websiteId: number;
  pageId: number;
  evaluationDate: string;
}

export interface EvaluationReportPayload extends BasePayload<typeof ResourceTypes.EVALUATION> {
  resourceType: typeof ResourceTypes.EVALUATION;
  evaluationQuarterId: number;
}
