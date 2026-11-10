import { EvaluationFileType, EvaluationIdentifier } from '../types';
import { ReadStream } from 'node:fs';

export interface EvaluationStoragePayload {
  evalIdentifier: EvaluationIdentifier;
  htmlContent: string;
  nodes: any;
  conformance: any;
}

export interface EvaluationStorage {
  getStream(evaluationId: EvaluationIdentifier, fileType: EvaluationFileType): Promise<ReadStream>;
  exists(evaluationId: EvaluationIdentifier): Promise<boolean>;
  delete(evaluationId: EvaluationIdentifier): Promise<void>;
}

export const EvaluationStorage = Symbol('EvaluationStorage');
