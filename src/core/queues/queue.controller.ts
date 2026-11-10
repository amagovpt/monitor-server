import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FgaGuard } from '../authorization/guards/fga.guard';
import { QueueMetricsService } from './queue-metrics.service';
import { QueueManagementService } from './queue-management.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authorization/guards/roles.guard';
import { Roles } from '../authorization/decorators/roles.decorator';
import { RoleSlug } from '../authentication/interfaces/types';

@Controller('queues')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class QueuesController {
  constructor(
    private readonly queueMetricsService: QueueMetricsService,
    private readonly queueManagementService: QueueManagementService,
  ) {}

  /**
   * GET /queues/metrics
   * Retorna o estado operacional e métricas completas de todas as filas em paralelo.
   */
  @Roles(RoleSlug.ADMIN)
  @Get('metrics')
  async getMetrics() {
    return await this.queueMetricsService.getDetailedMetrics();
  }

  /**
   * GET /queues/:queueName/active
   * Lista os jobs ativos correntes de uma fila específica.
   */
  @Roles(RoleSlug.ADMIN)
  @Get(':queueName/active')
  async getActiveJobs(@Param('queueName') queueName: string) {
    // Podes passar paginação opcional via Query params se desejado
    return await this.queueManagementService.getActiveJobs(queueName, 0, 19);
  }

  /**
   * POST /queues/:queueName/jobs/:jobId/cancel
   * Cancela um job específico numa fila (enviando sinal cooperativo / remoção).
   */
  @Roles(RoleSlug.ADMIN)
  @Post(':queueName/jobs/:jobId/cancel')
  @HttpCode(HttpStatus.OK)
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
  async cancelPendingJobs(@Param('queueName') queueName: string) {
    return await this.queueManagementService.cancelPendingJobsInQueue(queueName);
  }
}
