import { EvaluationJobData } from '../events/types';

/**
 * Payload of a job placed in the evaluation DLQs.
 */
export interface EvaluationDlqJobPayload {
  id?: string;
  name?: string;
  data: EvaluationJobData;
  failedReason?: string;
  stacktrace?: string[];
  attemptsMade?: number;
}
