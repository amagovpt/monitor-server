import { EventType } from 'src/core/outbox/types';

export const ACTION_REGISTRY: Record<string, EventType> = {
  EVALUATION_DELETE: 'EVALUATION_DELETED',
};
export type RegistryKey = (typeof ACTION_REGISTRY)[keyof typeof ACTION_REGISTRY];
