import { Controller, Post, Body } from '@nestjs/common';
import { SsePublisherService } from '../sse/sse-publisher.service';

// TODO: Implement proper validation and handling for Grafana alert payloads
@Controller('webhooks')
export class GrafanaWebhookController {
  constructor(private readonly ssePublisher: SsePublisherService) {}

  @Post('grafana-alert')
  async handleGrafanaAlert(@Body() alertPayload: any) {
    const { title, message, status } = this.parseGrafanaPayload(alertPayload);

    if (status === 'firing') {
      await this.ssePublisher.broadcastToGroups(
        'operational_toast',
        { title, message, severity: 'error' },
        'MONITOR',
      );
    }
  }

  private parseGrafanaPayload(payload: any) {
    return {
      title: payload.title || 'System Alert',
      message: payload.message || 'Anomaly detected in infrastructure metrics.',
      status: payload.status, // 'firing' or 'resolved'
    };
  }
}
