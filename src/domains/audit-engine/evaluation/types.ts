export interface EvaluationFileMetadata {
  timestamp: string;
  storageReference: string;
  integrityHash: string;
}
export interface EvaluationIdentifier {
  evaluationId: number;
  websiteId: number;
  pageId: number;
  evaluationDate: string;
}

export interface IMetricData {
  evaluation_id: number;
  directories_ids: number[];
  institution_id: number;
  website_id: number;
  page_id: number;
  evaluation_date: string;
  score: number;
  rule_id: string;
  count: number;
}

export interface PageMetadata {
  websiteId: number;
  pageId: number;
  url: string;
}

export interface EvaluationMeta {
  evaluationId?: number;
}

export interface AdditionalMetadata {
  institutionId: number;
  directoryIds: number[];
  userId?: number;
}

export interface EvaluationJobData extends EvaluationMeta, PageMetadata, AdditionalMetadata {}

export interface SafePaths {
  targetDir: string;
  baseFileName: string;
}
export type EvaluationFileType = 'html' | 'nodes';

export interface ConformanceErrors {
  A: number;
  AA: number;
  AAA: number;
}

export interface PageSnapshot {
  html: string;
  sizeInBytes: number;
  hash: string;
}
export interface EvaluationMetadata {
  title: string;
  url: string;
  evaluatedAt: string;
}

export interface DomTelemetry {
  totalHtmlTags: number;
  tagCounter: Record<string, number>;
  elementCounters: Record<string, number>;
  roles: Record<string, number>;
}
export type ConformanceToken = `${number}@${number}@${number}`;
export type ConformanceResultToken = `${number}@${number}`;

export interface EvaluationDetail {
  conform: ConformanceToken;
  totalTests: number;
  score: string;
  rulesOccurrences: Record<string, number>;
  assertionEvidence: Record<string, unknown>;
  conformanceResults: Record<string, ConformanceResultToken>;
}

export interface AuditReport {
  metadata: EvaluationMetadata;
  snapshot: PageSnapshot;
  telemetry: DomTelemetry;
  scoring: EvaluationDetail;
}

export interface EvaluationScoring {
  title: string;
  score: string;
  A: number;
  AA: number;
  AAA: number;
  createdAt: string;
  tagCount: number;
}

export interface EvaluationTargetMetadata {
  website_id: number;
  institution_id: number | null;
  directories_ids: number[];
}
