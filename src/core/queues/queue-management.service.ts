import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { QUEUE_NAMES } from './queues.config';

@Injectable()
export class QueueManagementService {
  private readonly logger = new Logger(QueueManagementService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.CRAWL_PRIVATE) private readonly crawlPrivateQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CRAWL_PRIVATE_DLQ) private readonly crawlPrivateDlqQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CRAWL_PUBLIC) private readonly crawlPublicQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CRAWL_PUBLIC_DLQ) private readonly crawlPublicDlqQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PUBLIC_PAGE_DISPATCH) private readonly publicPageDispatchQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PRIVATE_PAGE_DISPATCH)
    private readonly privatePageDispatchQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EVAL_PUBLIC) private readonly evalPublicQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EVAL_PUBLIC_DLQ) private readonly evalPublicDlqQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE) private readonly evalPrivateQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EVAL_PRIVATE_DLQ) private readonly evalPrivateDlqQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AUTHORIZATION) private readonly authorizationQueue: Queue,
  ) {}

  private getQueueInstance(queueName: string): Queue {
    const queues: Record<string, Queue> = {
      [QUEUE_NAMES.CRAWL_PRIVATE]: this.crawlPrivateQueue,
      [QUEUE_NAMES.CRAWL_PRIVATE_DLQ]: this.crawlPrivateDlqQueue,
      [QUEUE_NAMES.CRAWL_PUBLIC]: this.crawlPublicQueue,
      [QUEUE_NAMES.CRAWL_PUBLIC_DLQ]: this.crawlPublicDlqQueue,
      [QUEUE_NAMES.PUBLIC_PAGE_DISPATCH]: this.publicPageDispatchQueue,
      [QUEUE_NAMES.PRIVATE_PAGE_DISPATCH]: this.privatePageDispatchQueue,
      [QUEUE_NAMES.EVAL_PUBLIC]: this.evalPublicQueue,
      [QUEUE_NAMES.EVAL_PUBLIC_DLQ]: this.evalPublicDlqQueue,
      [QUEUE_NAMES.EVAL_PRIVATE]: this.evalPrivateQueue,
      [QUEUE_NAMES.EVAL_PRIVATE_DLQ]: this.evalPrivateDlqQueue,
      [QUEUE_NAMES.AUTHORIZATION]: this.authorizationQueue,
    };

    const queue = queues[queueName];
    if (!queue) {
      throw new BadRequestException(`Fila inválida ou não mapeada: ${queueName}`);
    }
    return queue;
  }

  /**
   * Lista jobs ativos de uma fila específica com paginação segura.
   */
  async getActiveJobs(queueName: string, start = 0, end = 19): Promise<Job[]> {
    const queue = this.getQueueInstance(queueName);
    return queue.getJobs(['active'], start, end, true);
  }

  /**
   * Cancela ou remove um job de uma fila específica.
   */
  async cancelJob(queueName: string, jobId: string, reason = 'Cancelado via API'): Promise<void> {
    const queue = this.getQueueInstance(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} não encontrado na fila ${queueName}.`);
    }

    const state = await job.getState();
    this.logger.warn(
      `A cancelar job ${jobId} na fila ${queueName} | Estado: ${state} | Razão: ${reason}`,
    );

    await job.remove();
  }

  async cancelPendingJobsInQueue(queueName: string): Promise<{ count: number; queue: string }> {
    const queue = this.getQueueInstance(queueName);

    // 1. Obter apenas os jobs que estão em espera (waiting) ou adiados (delayed)
    // O range 0 a 9999 cobre o lote pendente (respeitando o teto máximo de 3000 jobs)
    const pendingJobs = await queue.getJobs(['waiting', 'delayed'], 0, 9999, true);

    if (pendingJobs.length === 0) {
      this.logger.log(`Nenhum job pendente encontrado para cancelar na fila ${queueName}.`);
      return { count: 0, queue: queueName };
    }

    this.logger.warn(
      `A cancelar ${pendingJobs.length} jobs pendentes (waiting/delayed) na fila ${queueName}...`,
    );

    // 2. Remover em paralelo e de forma segura
    await Promise.all(
      pendingJobs.map(async (job: Job) => {
        try {
          await job.remove();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Falha ao remover o job pendente ${job.id} na fila ${queueName}: ${errorMessage}`,
          );
        }
      }),
    );

    this.logger.log(
      `Com sucesso: ${pendingJobs.length} jobs pendentes cancelados na fila ${queueName}.`,
    );

    return {
      count: pendingJobs.length,
      queue: queueName,
    };
  }
}
