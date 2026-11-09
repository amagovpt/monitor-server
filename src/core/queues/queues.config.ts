export const QUEUE_NAMES = {
  //Crawling Queues
  CRAWL_PRIVATE: 'crawl-queue-private',
  CRAWL_PRIVATE_DLQ: 'crawl-queue-private-dlq',
  CRAWL_PUBLIC: 'crawl-queue-public',
  CRAWL_PUBLIC_DLQ: 'crawl-queue-public-dlq',
  //Extraction Queues for pages for evaluation
  WEBSITE_EXTRACTION: 'website-extraction',
  PUBLIC_PAGE_DISPATCH: 'public-page-dispatch',
  PRIVATE_PAGE_DISPATCH: 'private-page-dispatch',
  //Evaluation processing Queues
  EVAL_PUBLIC: 'evaluation-queue-public',
  EVAL_PUBLIC_DLQ: 'evaluation-queue-public-dlq',
  EVAL_PRIVATE: 'evaluation-queue-private',
  EVAL_PRIVATE_DLQ: 'evaluation-queue-private-dlq',
  EVAL_PRIVATE_ROLLBACK: 'evaluation-queue-private-rollback',
  EVAL_PRIVATE_ROLLBACK_DLQ: 'evaluation-queue-private-rollback-dlq',
  //Evaluation Storage Queues
  //Authorization Queue
  AUTHORIZATION: 'authorization-queue',
  //General Resource Decoupled Actions Queues
  EVALUATION_RESOURCE: 'evaluation-resource-queue',
  EVALUATION_RESOURCE_DLQ: 'evaluation-resource-queue-dlq',
};

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
