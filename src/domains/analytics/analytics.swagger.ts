import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiProduces,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
} from '@nestjs/swagger';

import { AppCountersDto } from './dto/app-counter.dto';
import { GlobalMetricsDto } from './dto/global.dto';
import { ScopeAnalyticsResponseDto } from './dto/directory.dto';
import { ExportAnalyticsDto } from './dto/export-analytics.dto';

export const AnalyticsDocs = {
  /* ============================================================
   * Controller-level documentation
   * ============================================================ */
  controller: () =>
    applyDecorators(
      ApiTags('Analytics'),
      ApiBearerAuth('access-token'),
      ApiCookieAuth('refresh-token'),
      ApiExtraModels(AppCountersDto, GlobalMetricsDto, ScopeAnalyticsResponseDto),
      ApiUnauthorizedResponse({
        description: 'Missing, invalid, or expired access token.',
      }),
      ApiForbiddenResponse({
        description:
          'Authenticated but not authorized. Requires role `ADMIN` and FGA relation `AMS_ROLE_VIEWER`.',
      }),
      ApiInternalServerErrorResponse({
        description: 'Unexpected server error.',
      }),
    ),

  /* ============================================================
   * GET /analytics/overview
   * ============================================================ */
  getOverview: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get global application counters',
        description:
          'Returns high-level counters for AMS, Observatory, MyMonitor, and aggregated totals ' +
          '(users, teams, evaluations, pages, etc.). ' +
          'Cached for 60 seconds under key `analytics_overview`.',
      }),
      ApiOkResponse({
        description: 'Application counters retrieved successfully.',
        type: AppCountersDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/tag/:tagId
   * ============================================================ */
  getTagMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get aggregated metrics for a tag',
        description:
          'Returns aggregated accessibility metrics for the given tag, including ' +
          'score distribution, error/best-practice distributions, success and error ' +
          'metric maps, and detail tables. ' +
          'Cached for 60 seconds per `tagId` under key `analytics_tag`.',
      }),
      ApiParam({
        name: 'tagId',
        type: Number,
        required: true,
        example: 12,
        description: 'Numeric ID of the tag.',
      }),
      ApiOkResponse({
        description: 'Tag metrics retrieved successfully.',
        type: ScopeAnalyticsResponseDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/website/:websiteId
   * ============================================================ */
  getWebsiteMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get aggregated metrics for a website',
        description:
          'Returns aggregated accessibility metrics for the given website, including ' +
          'score distribution, error/best-practice distributions, success and error ' +
          'metric maps, and detail tables. ' +
          'Cached for 60 seconds per `websiteId` under key `analytics_website`.',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        required: true,
        example: 305,
        description: 'Numeric ID of the website.',
      }),
      ApiOkResponse({
        description: 'Website metrics retrieved successfully.',
        type: ScopeAnalyticsResponseDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/institution/:institutionId
   * ============================================================ */
  getInstitutionMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get aggregated metrics for an institution',
        description:
          'Returns aggregated accessibility metrics for the given institution, including ' +
          'score distribution, error/best-practice distributions, success and error ' +
          'metric maps, and detail tables. ' +
          'Cached for 60 seconds per `institutionId` under key `analytics_institution`.',
      }),
      ApiParam({
        name: 'institutionId',
        type: Number,
        required: true,
        example: 88,
        description: 'Numeric ID of the institution.',
      }),
      ApiOkResponse({
        description: 'Institution metrics retrieved successfully.',
        type: ScopeAnalyticsResponseDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/directory/:directoryId
   * ============================================================ */
  getDirectoryMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get aggregated metrics for a directory',
        description:
          'Returns aggregated accessibility metrics for the given directory, including ' +
          'score distribution, error/best-practice distributions, success and error ' +
          'metric maps, and detail tables. ' +
          'Cached for 60 seconds per `directoryId` under key `analytics_directory`.',
      }),
      ApiParam({
        name: 'directoryId',
        type: Number,
        required: true,
        example: 410,
        description: 'Numeric ID of the directory.',
      }),
      ApiOkResponse({
        description: 'Directory metrics retrieved successfully.',
        type: ScopeAnalyticsResponseDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/global
   * ============================================================ */
  getGlobalMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get global aggregated metrics',
        description:
          'Returns platform-wide aggregated accessibility metrics for every application ' +
          '(AMS, Observatory, ...). Includes indicators, conformance, score distribution, ' +
          'and detailed success/error tables per WCAG check. ' +
          'Cached for 600 seconds under key `analytics_global`.',
      }),
      ApiOkResponse({
        description: 'Global aggregated metrics retrieved successfully.',
        type: GlobalMetricsDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/global/website/:websiteId
   * ============================================================ */
  getGlobalWebsiteMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get global aggregated metrics for a website',
        description:
          'Returns platform-wide aggregated accessibility metrics scoped to the given website. ' +
          'Cached for 60 seconds per `websiteId` under key `analytics_global_website`.',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        required: true,
        example: 305,
        description: 'Numeric ID of the website.',
      }),
      ApiOkResponse({
        description: 'Global website metrics retrieved successfully.',
        type: GlobalMetricsDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/global/directory/:directoryId
   * ============================================================ */
  getGlobalDirectoryMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get global aggregated metrics for a directory',
        description:
          'Returns platform-wide aggregated accessibility metrics scoped to the given directory. ' +
          'Cached for 60 seconds per `directoryId` under key `analytics_global_directory`.',
      }),
      ApiParam({
        name: 'directoryId',
        type: Number,
        required: true,
        example: 410,
        description: 'Numeric ID of the directory.',
      }),
      ApiOkResponse({
        description: 'Global directory metrics retrieved successfully.',
        type: GlobalMetricsDto,
      }),
    ),

  /* ============================================================
   * GET /analytics/exports/:resource
   * ============================================================ */
  exportAnalytics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Export analytics report',
        description:
          'Streams an analytics report for the requested `resource` in the requested `format`. ' +
          'The response is a streamed binary file with `Transfer-Encoding: chunked` and caching disabled.',
      }),

      ApiProduces('text/csv', 'application/ndjson', 'application/vnd.apache.parquet'),
      ApiOkResponse({
        description: 'Streamed analytics file.',
        content: {
          'text/csv': {
            schema: { type: 'string', format: 'binary' },
          },
          'application/pdf': {
            schema: { type: 'string', format: 'binary' },
          },
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: { type: 'string', format: 'binary' },
          },
        },
        headers: {
          'Content-Disposition': {
            description: 'Suggested filename for the download.',
            schema: {
              type: 'string',
              example: 'attachment; filename="analytics-global-2025-02-01.csv"',
            },
          },
          'Transfer-Encoding': {
            description: 'Always `chunked` for streamed exports.',
            schema: { type: 'string', example: 'chunked' },
          },
          'Cache-Control': {
            description: 'Explicitly disables caching on export responses.',
            schema: {
              type: 'string',
              example: 'no-cache, no-store, must-revalidate',
            },
          },
        },
      }),
    ),
};
