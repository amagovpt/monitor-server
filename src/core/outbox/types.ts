export type AggregateType = 'EVALUATION' | 'WEBSITE' | 'PAGE';

export type EventType =
  `${AggregateType}_CREATED` | `${AggregateType}_UPDATED` | `${AggregateType}_DELETED`;
