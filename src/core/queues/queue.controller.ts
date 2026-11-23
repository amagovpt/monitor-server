import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { QueueMetricsService } from './queue-metrics.service';
import { QueueManagementService } from './queue-management.service';
import { RoleSlug } from '../authentication/interfaces/types';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@Controller('queues')
export class QueuesController {
  constructor(
    private readonly queueMetricsService: QueueMetricsService,
    private readonly queueManagementService: QueueManagementService,
  ) {}

  /**
   * GET /queues/metrics
   * Retorna o estado operacional e métricas completas de todas as filas em paralelo.
   */
  @Get('metrics')
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getMetrics() {
    return await this.queueMetricsService.getDetailedMetrics();
  }

  /**
   * GET /queues/:queueName/active
   * Lista os jobs ativos correntes de uma fila específica.
   */
  @Get(':queueName/active')
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getActiveJobs(@Param('queueName') queueName: string) {
    // Podes passar paginação opcional via Query params se desejado
    return await this.queueManagementService.getActiveJobs(queueName, 0, 19);
  }

  /**
   * POST /queues/:queueName/jobs/:jobId/cancel
   * Cancela um job específico numa fila (enviando sinal cooperativo / remoção).
   */
  @Post(':queueName/jobs/:jobId/cancel')
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async cancelJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
    @Body('reason') reason?: string,
  ) {
    await this.queueManagementService.cancelJob(
      queueName,
      jobId,
      reason || 'Cancelado manualmente via API',
    );
  }

  /**
   * POST /queues/:queueName/cancel-pending
   * Cancela apenas os trabalhos que ainda não começaram (waiting e delayed) numa fila específica.
   */
  @Post(':queueName/cancel-pending')
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async cancelPendingJobs(@Param('queueName') queueName: string) {
    return await this.queueManagementService.cancelPendingJobsInQueue(queueName);
  }
}
