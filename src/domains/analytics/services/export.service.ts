import { Injectable } from '@nestjs/common';
import { AnalyticRepository } from '../analytics.repository';
import { ExportQueryRegistryService } from './export-query-registry.service';
import {
  ExportExecutionContext,
  ExportFormat,
  FileStreamResult,
  FormatMetadata,
} from '../queries/type';

@Injectable()
export class ExportService {
  constructor(
    private readonly analyticsRepository: AnalyticRepository,
    private readonly queryRegistry: ExportQueryRegistryService,
  ) {}

  async exportResource(context: ExportExecutionContext): Promise<FileStreamResult> {
    const query = this.queryRegistry.resolveQuery(context.resource, context.entityId?.toString());
    const metadata = this.resolveFormatMetadata(context.format);

    const queryParams = context.entityId
      ? this.buildQueryParams(context.resource, context.entityId)
      : {};

    const stream = await this.analyticsRepository.executeExportStream(
      query,
      metadata.chFormat,
      queryParams,
    );

    const filename = this.buildFilename(context.resource, metadata.extension);

    return {
      stream,
      contentType: metadata.contentType,
      filename,
    };
  }

  private resolveFormatMetadata(format: ExportFormat): FormatMetadata {
    switch (format) {
      case ExportFormat.CSV:
        return {
          chFormat: 'CSVWithNames',
          contentType: 'text/csv; charset=utf-8',
          extension: 'csv',
        };

      case ExportFormat.JSON:
        return {
          chFormat: 'JSONEachRow',
          contentType: 'application/x-ndjson; charset=utf-8',
          extension: 'ndjson',
        };

      case ExportFormat.PARQUET:
        return {
          chFormat: 'Parquet',
          contentType: 'application/vnd.apache.parquet',
          extension: 'parquet',
        };
    }
  }

  private buildFilename(resource: string, extension: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${resource}-export-${timestamp}.${extension}`;
  }

  private buildQueryParams(resource: string, entityId: number): Record<string, string> {
    // Map resource types to their query parameter names
    const paramMap: Record<string, string> = {
      directory: 'resourceId',
      tag: 'resourceId',
      website: 'resourceId',
      institution: 'resourceId',
      'latest-pages-evaluation': 'resourceId',
      'all-pages-evaluations': 'resourceId',
    };

    const paramName = paramMap[resource];
    return paramName ? { [paramName]: entityId.toString() } : {};
  }
}
