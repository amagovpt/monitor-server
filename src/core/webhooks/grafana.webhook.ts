import { Controller, Post, Body } from '@nestjs/common';
import { SsePublisherService } from '../sse/sse-publisher.service';

@Controller('webhooks')
export class GrafanaWebhookController {
  constructor(private readonly ssePublisher: SsePublisherService) {}

  @Post('grafana-alert')
  async handleGrafanaAlert(@Body() alertPayload: any) {
    // O Grafana envia um JSON padronizado com o estado do alerta
    const { title, message, status } = this.parseGrafanaPayload(alertPayload);

    if (status === 'firing') {
      // Dispara o aviso em tempo real via SSE para o canal MONITOR ou AMS
      await this.ssePublisher.notifyUser(
        0,
        'operational_toast',
        { title, message, severity: 'error' },
        'MONITOR',
      );
    }
  }

  private parseGrafanaPayload(payload: any) {
    // Extrais o texto do alerta do payload do Grafana (Alertmanager format)
    return {
      title: payload.title || 'Alerta do Sistema',
      message: payload.message || 'Detetada anomalia nas métricas de infraestrutura.',
      status: payload.status, // 'firing' ou 'resolved'
    };
  }
}
