import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queues.config';

export interface QueueDetailedMetrics {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  isPaused: boolean;
  lag: number; // Waiting + Delayed (Backlog real)
}

@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);

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
   * Recolhe métricas analíticas e operacionais completas de todas as filas em paralelo.
   */
  async getDetailedMetrics(): Promise<QueueDetailedMetrics[]> {
    const queueMap = [
      { name: QUEUE_NAMES.CRAWL_PRIVATE, instance: this.crawlPrivateQueue },
      { name: QUEUE_NAMES.CRAWL_PRIVATE_DLQ, instance: this.crawlPrivateDlqQueue },
      { name: QUEUE_NAMES.CRAWL_PUBLIC, instance: this.crawlPublicQueue },
      { name: QUEUE_NAMES.CRAWL_PUBLIC_DLQ, instance: this.crawlPublicDlqQueue },
      { name: QUEUE_NAMES.PUBLIC_PAGE_DISPATCH, instance: this.publicPageDispatchQueue },
      { name: QUEUE_NAMES.PRIVATE_PAGE_DISPATCH, instance: this.privatePageDispatchQueue },
      { name: QUEUE_NAMES.EVAL_PUBLIC, instance: this.evalPublicQueue },
      { name: QUEUE_NAMES.EVAL_PUBLIC_DLQ, instance: this.evalPublicDlqQueue },
      { name: QUEUE_NAMES.EVAL_PRIVATE, instance: this.evalPrivateQueue },
      { name: QUEUE_NAMES.EVAL_PRIVATE_DLQ, instance: this.evalPrivateDlqQueue },
      { name: QUEUE_NAMES.AUTHORIZATION, instance: this.authorizationQueue },
    ];

    const results = await Promise.all(
      queueMap.map(async ({ name, instance }) => {
        try {
          const [counts, isPaused] = await Promise.all([
            instance.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
            instance.isPaused(),
          ]);

          const waiting = counts.waiting || 0;
          const delayed = counts.delayed || 0;
          const active = counts.active || 0;
          const failed = counts.failed || 0;
          const completed = counts.completed || 0;
          const paused = counts.paused || 0;

          return {
            name,
            counts: {
              waiting,
              active,
              completed,
              failed,
              delayed,
              paused,
            },
            isPaused,
            lag: waiting + delayed, // O backlog real por processar
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Erro ao extrair métricas detalhadas da fila ${name}: ${errorMessage}`);
          return {
            name,
            counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
            isPaused: false,
            lag: 0,
          };
        }
      }),
    );

    return results;
  }
  /**
   * Cancela/Remove um job de uma fila específica, lidando com o seu estado atual.
   */
  async cancelJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueueInstance(queueName);

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job com ID ${jobId} não foi encontrado na fila ${queueName}.`);
    }

    const state = await job.getState();
    this.logger.warn(`A cancelar job ${jobId} na fila ${queueName} (Estado atual: ${state})`);

    switch (state) {
      case 'active':
        // Um job ativo está a ser executado pelo worker neste momento.
        // Remover diretamente força o corte, mas o worker em execução pode continuar em memória
        // a menos que o worker verifique o cancelamento via Redis / AbortController.
        await job.remove();
        break;

      case 'waiting':
      case 'delayed':
      case 'failed':
      case 'completed':
        // Para estes estados, a remoção limpa diretamente o job do Redis.
        await job.remove();
        break;

      default:
        // Caso esteja num estado desconhecido ou 'stuck'
        await job.remove();
        break;
    }

    this.logger.log(`Job ${jobId} removido com sucesso da fila ${queueName}.`);
  }
}
