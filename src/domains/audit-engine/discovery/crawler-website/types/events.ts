import { JobEventType } from 'src/core/queues/types';
import { CrawlWebsiteResponseDTO } from '../dto/crawler-website-response.dto';

export interface CrawlerMeta {
  crawlerId: number;
}

export interface CrawlerMetadata {
  websiteId: number;
  baseUrl: string;
}

export interface CrawlerAdditionalMetadata {
  userId: number;
}

export interface CrawlerJobData extends CrawlerMeta, CrawlerMetadata, CrawlerAdditionalMetadata {
  __otelContext?: Record<string, unknown>;
}

export type CrawlerJobEvent = `crawler:${JobEventType}`;

export interface CrawlerStarted {
  event: 'crawler:started';
  crawlerId: number;
  websiteId: number;
  baseUrl: string;
  userId: number;
  previousState?: string;
}

export interface CrawlerProgress {
  event: 'crawler:progress';
  crawlerId: number;
  websiteId: number;
  baseUrl: string;
  userId: number;
  progress: number | object;
}

export interface CrawlerFailed {
  event: 'crawler:failed';
  crawlerId: number;
  websiteId: number;
  baseUrl: string;
  userId: number;
  failedReason: string;
}

export interface CrawlerCompleted {
  event: 'crawler:completed';
  crawlerId: number;
  websiteId: number;
  baseUrl: string;
  userId: number;
}

export interface CrawlerStalled {
  event: 'crawler:stalled';
  crawlerId: number;
  websiteId: number;
  baseUrl: string;
  userId: number;
}

export interface CrawlerDrained {
  event: 'crawler:drained';
}

export type CrawlerJobMessage =
  | CrawlerStarted
  | CrawlerProgress
  | CrawlerFailed
  | CrawlerCompleted
  | CrawlerStalled
  | CrawlerDrained;
