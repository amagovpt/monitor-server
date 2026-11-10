import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import type { IncomingMessage } from 'node:http';

const collectorBaseUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

export const otelSDK = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'monitor-server',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    'deployment.environment.name': process.env.NODE_ENV || 'development',
    'service.instance.id': process.env.HOSTNAME || process.pid.toString(),
  }),

  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: `${collectorBaseUrl}/v1/traces`,
      }),
      {
        scheduledDelayMillis: 5000,
      },
    ),
  ],

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${collectorBaseUrl}/v1/metrics`,
    }),
    exportIntervalMillis: 15000,
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-runtime-node': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-router': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req: IncomingMessage) => {
          const url = req.url || '';
          return url.includes('/health') || url.includes('/ready') || url.includes('/metrics');
        },
      },
    }),
  ],
});

otelSDK.start();

process.on('SIGTERM', async () => {
  try {
    await otelSDK.shutdown();
    console.log('OpenTelemetry SDK successfully shut down.');
  } catch (error) {
    console.error('Error shutting down OpenTelemetry SDK:', error);
  } finally {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  try {
    await otelSDK.shutdown();
    console.log('OpenTelemetry SDK successfully shut down.');
  } catch (error) {
    console.error('Error shutting down OpenTelemetry SDK:', error);
  } finally {
    process.exit(0);
  }
});
