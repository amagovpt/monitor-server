export enum ExportResource {
  AMS = 'ams',
  OBSERVATORY = 'observatory',
  DIRECTORY = 'directory',
  TAG = 'tag',
  WEBSITE = 'website',
  INSTITUTION = 'institution',
  GLOBAL = 'global',
  LATEST_PAGES_EVALUATION = 'latest-pages-evaluation',
  ALL_PAGES_EVALUATIONS = 'all-pages-evaluations',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PARQUET = 'parquet',
}

export enum ExportContext {
  AMS = 'ams',
  OBS = 'obs',
}

export interface ExportExecutionContext {
  resource: ExportResource;
  format: ExportFormat;
  entityId?: number;
}

export interface FormatMetadata {
  chFormat: 'CSVWithNames' | 'JSONEachRow' | 'Parquet';
  contentType: string;
  extension: string;
}

export interface ResourceQuerySet {
  summary: string;
  plotScore: string;
  scoreDistribution: string;
  scoreMetrics: string;
  metrics: string;
  rulesLatestQuartiles: string;
}

export type ExportRegistry = Record<ResourceExportTarget, ResourceExportQuery>;

export type ResourceExportTarget =
  | 'ams'
  | 'observatory'
  | 'directory'
  | 'tag'
  | 'website'
  | 'global'
  | 'institution'
  | 'latest-pages-evaluation'
  | 'all-pages-evaluations';

export interface ResourceExportQuery {
  globalAMS: string;
  globalObservatory: string;
  globalDirectory: string;
  globalWebsite: string;
  globalEntity: string;
  globalTag: string;
  latestPageEvaluation: string;
  allPagesEvaluations: string;
}

export interface FileStreamResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
  filename: string;
}

export type ResourceTarget = 'directory' | 'tag' | 'website' | 'global';

export type ContextTarget = 'ams' | 'observatory';
