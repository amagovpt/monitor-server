import { ResourceQuerySet } from './type';

import { websiteQueries as obsWebsite } from './observatory/website.queries';
import { globalQueries as obsGlobal } from './observatory/global.queries';

const MASTER_QUERY_REGISTRY = {
  observatory: {
    website: obsWebsite,
    global: obsGlobal,
  },
} as const;

export const queryRegistry = MASTER_QUERY_REGISTRY;

export type ContextTarget = keyof typeof MASTER_QUERY_REGISTRY;
export type ResourceTarget<C extends ContextTarget = ContextTarget> =
  keyof (typeof MASTER_QUERY_REGISTRY)[C];

export function getGenericQuery<
  C extends ContextTarget,
  R extends keyof (typeof MASTER_QUERY_REGISTRY)[C],
  K extends keyof (typeof MASTER_QUERY_REGISTRY)[C][R],
>(context: C, target: R, key: K): string;

export function getGenericQuery(context: string, target: string, key: string): string;

export function getGenericQuery(context: string, target: string, key: string): string {
  const ctx = MASTER_QUERY_REGISTRY[context as keyof typeof MASTER_QUERY_REGISTRY];
  if (!ctx) {
    throw new Error(`Context not found: ${context}`);
  }

  const targetQuerySet = (ctx as Record<string, any>)[target];
  if (!targetQuerySet) {
    throw new Error(`Resource target '${target}' does not exist for context '${context}'`);
  }

  const query = targetQuerySet[key];
  if (typeof query !== 'string') {
    throw new Error(`Query key '${key}' not found for target '${target}' in context '${context}'`);
  }

  return query;
}
