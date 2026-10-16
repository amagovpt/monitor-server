import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from 'src/core/clickhouse/clickhouse.constants';
import {
  DIRECTORY_WEBSITE_RANKING_QUERY,
  DIRECTORY_WEBSITE_STATISTICS_QUERY,
} from './queries/observatory/directory.queries';
import { SEARCH_WEBSITES_QUERY } from './queries/observatory/search.queries';
import { Readable, Transform } from 'stream';
import { ExportFormat } from './dto/export-analytics.dto';
import { ContextTarget, FileStreamResult, ResourceTarget } from './queries/type';
import { buildGlobalAnalyticsQuery, EvaluationFilterOptions } from './queries/global.query';
import { getGenericQuery } from './queries/query.registry';
import type { Row } from '@clickhouse/client';
@Injectable()
export class AnalyticRepository {
  constructor(@Inject(CLICKHOUSE_CLIENT) private readonly clickHouseClient: ClickHouseClient) {}

  async getGlobalAnalytics(options: EvaluationFilterOptions = {}): Promise<any> {
    const { query, queryParams } = buildGlobalAnalyticsQuery(options);

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
      query_params: queryParams,
    });

    const rows = await result.json<any>();
    return rows[0];
  }

  async getAppCounters(): Promise<any> {
    const query = `
      SELECT * FROM accessibility.v_app_counters
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getGlobalAMS(): Promise<any> {
    const query = `
      SELECT * FROM accessibility.v_global_ams
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getGlobalSummary(): Promise<any> {
    const query = `
      SELECT * FROM accessibility.v_global_summary
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getGlobalDirectoriesSummary(): Promise<any> {
    const query = `
      SELECT * FROM accessibility.v_directories_global_summary
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getDirectorySummary(directoryId: number): Promise<any> {
    const query = DIRECTORY_WEBSITE_STATISTICS_QUERY;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: directoryId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getRankingDirectory(directoryId: number): Promise<any[]> {
    const query = DIRECTORY_WEBSITE_RANKING_QUERY;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: directoryId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async getResourceSummary(
    resourceId: number,
    resourceType: ResourceTarget,
    context: ContextTarget,
  ): Promise<any> {
    const query = getGenericQuery(context, resourceType, 'summary');

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: resourceId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getResourcePlotData(
    resourceId: number,
    resourceType: ResourceTarget,
    context: ContextTarget,
  ): Promise<any> {
    const query = getGenericQuery(context, resourceType, 'plotScore');
    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: resourceId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getResourceScoreDistribution(
    resourceId: number,
    resourceType: ResourceTarget,
    context: ContextTarget,
  ): Promise<any> {
    const query = getGenericQuery(context, resourceType, 'scoreDistribution');
    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: resourceId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async getResourceRuleMetrics(
    resourceId: number,
    resourceType: ResourceTarget,
    context: ContextTarget,
  ): Promise<any> {
    const query = getGenericQuery(context, resourceType, 'metrics');

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: resourceId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }
  async getResourceRulesLatestQuartiles(
    resourceId: number,
    resourceType: ResourceTarget,
    context: ContextTarget,
  ): Promise<any> {
    const query = getGenericQuery(context, resourceType, 'rulesLatestQuartiles');

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        resourceId: resourceId,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows[0];
  }

  async searchForWebsites(query: string): Promise<any[]> {
    const result = await this.clickHouseClient.query({
      query: `
        ${SEARCH_WEBSITES_QUERY}
      `,
      query_params: {
        token: query,
      },
      format: 'JSONEachRow',
    });
    const rows = await result.json<any>();
    return rows;
  }

  async exportAnalyticsStream(format: ExportFormat): Promise<FileStreamResult> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const { chFormat, contentType, extension } = this.resolveFormatMetadata(format);

    const query = `
      SELECT 
        *
      FROM evaluations
      LIMIT 1000
    `;

    const resultSet = await this.clickHouseClient.query({
      query,
      format: chFormat,
      clickhouse_settings: {
        max_execution_time: 60,
      },
    });
    const chStream = resultSet.stream();

    const byteTransformer = new Transform({
      objectMode: true,
      transform(chunk: Row[] | Row, _encoding, callback) {
        try {
          if (Array.isArray(chunk)) {
            let buffer = '';
            for (let i = 0; i < chunk.length; i++) {
              buffer += chunk[i].text + '\n';
            }
            callback(null, buffer);
          } else {
            callback(null, chunk.text + '\n');
          }
        } catch (err) {
          callback(err as Error);
        }
      },
    });

    const outStream = chStream.pipe(byteTransformer);

    return {
      stream: outStream,
      contentType,
      filename: `analytics-export-${timestamp}.${extension}`,
    };
  }

  private resolveFormatMetadata(format: ExportFormat) {
    switch (format) {
      case ExportFormat.CSV:
        return {
          chFormat: 'CSVWithNames' as const,
          contentType: 'text/csv; charset=utf-8',
          extension: 'csv',
        };

      case ExportFormat.JSON:
        return {
          chFormat: 'JSONEachRow' as const,
          contentType: 'application/x-ndjson; charset=utf-8',
          extension: 'ndjson',
        };

      case ExportFormat.PARQUET:
        return {
          chFormat: 'Parquet' as const,
          contentType: 'application/vnd.apache.parquet',
          extension: 'parquet',
        };

      default:
        throw new BadRequestException(`Formato ${format} não suportado.`);
    }
  }
}
