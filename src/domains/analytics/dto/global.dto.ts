import { ApiProperty } from '@nestjs/swagger';

/* ============================================================
 * Quartile interval (lower / upper bounds)
 * ============================================================ */

export class QuartileIntervalDto {
  @ApiProperty({ example: '1', description: 'Lower bound of the interval.' })
  lower: string;

  @ApiProperty({ example: '50', description: 'Upper bound of the interval.' })
  upper: string;
}

/* ============================================================
 * Single quartile entry
 * ============================================================ */

export class QuartileDto {
  @ApiProperty({ example: '1008', description: 'Total occurrences in this quartile.' })
  total: string;

  @ApiProperty({ example: '25', description: 'Percentage share of this quartile.' })
  percentage: string;

  @ApiProperty({
    type: QuartileIntervalDto,
    description: 'Interval bounds for this quartile.',
  })
  interval: QuartileIntervalDto;
}

/* ============================================================
 * Row inside successDetailsTable / errorsDetailsTable
 * ============================================================ */

export class DetailsTableRowDto {
  @ApiProperty({ example: 'orientation_01', description: 'Check / rule key.' })
  key: string;

  @ApiProperty({ example: '401836', description: 'Total occurrences.' })
  occurrenceCount: string;

  @ApiProperty({ example: '4004', description: 'Number of pages affected.' })
  pageCount: string;

  @ApiProperty({
    example: 'AA',
    description: 'WCAG conformance level (A, AA, AAA).',
    enum: ['A', 'AA', 'AAA'],
  })
  level: string;

  @ApiProperty({
    type: [QuartileDto],
    description: 'Quartile distribution for this check.',
  })
  quartiles: QuartileDto[];
}

/* ============================================================
 * Details table wrapper (success / errors)
 * ============================================================ */

export class DetailsTableDto {
  @ApiProperty({
    type: [String],
    example: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    description: 'Column keys used by the table.',
  })
  keys: string[];

  @ApiProperty({
    type: [DetailsTableRowDto],
    description: 'Rows of aggregated check details.',
  })
  data: DetailsTableRowDto[];
}

/* ============================================================
 * Indicator / conformance blocks (identical shape)
 * ============================================================ */

export class IndicatorBlockDto {
  @ApiProperty({ example: 5, description: 'Aggregated score for this block.' })
  score: number;

  @ApiProperty({
    example: '2026-10-05 12:40:35',
    description: 'Date of the most recent evaluated page (YYYY-MM-DD HH:mm:ss).',
  })
  recentPageDate: string;

  @ApiProperty({
    example: '2021-10-06 12:40:01',
    description: 'Date of the oldest evaluated page (YYYY-MM-DD HH:mm:ss).',
  })
  oldestPageDate: string;

  @ApiProperty({ example: 40, description: 'Number of directories.' })
  directoriesCount: number;

  @ApiProperty({ example: 993, description: 'Number of entities.' })
  entitiesCount: number;

  @ApiProperty({ example: 2198, description: 'Number of websites.' })
  websitesCount: number;

  @ApiProperty({ example: 126262, description: 'Number of pages.' })
  pagesCount: number;

  @ApiProperty({
    example: 57.44404003639672,
    description: 'Average number of pages per website.',
  })
  avgPagesPerWebsite: number;
}

/* ============================================================
 * One application block (ams, observatory, ...)
 * ============================================================ */

export class GlobalAppMetricsDto {
  @ApiProperty({
    example: 5,
    description: 'Indicator score. (Flat key: "indicators.score")',
  })
  'indicators.score': number;

  @ApiProperty({
    example: '2026-10-05 12:40:35',
    description: 'Indicators: most recent page date.',
  })
  'indicators.recentPageDate': string;

  @ApiProperty({
    example: '2021-10-06 12:40:01',
    description: 'Indicators: oldest page date.',
  })
  'indicators.oldestPageDate': string;

  @ApiProperty({ example: 40, description: 'Indicators: directories count.' })
  'indicators.directoriesCount': number;

  @ApiProperty({ example: 993, description: 'Indicators: entities count.' })
  'indicators.entitiesCount': number;

  @ApiProperty({ example: 2198, description: 'Indicators: websites count.' })
  'indicators.websitesCount': number;

  @ApiProperty({ example: 126262, description: 'Indicators: pages count.' })
  'indicators.pagesCount': number;

  @ApiProperty({
    example: 57.44404003639672,
    description: 'Indicators: average pages per website.',
  })
  'indicators.avgPagesPerWebsite': number;

  @ApiProperty({ example: 5, description: 'Conformance score.' })
  'conformance.score': number;

  @ApiProperty({
    example: '2026-10-05 12:40:35',
    description: 'Conformance: most recent page date.',
  })
  'conformance.recentPageDate': string;

  @ApiProperty({
    example: '2021-10-06 12:40:01',
    description: 'Conformance: oldest page date.',
  })
  'conformance.oldestPageDate': string;

  @ApiProperty({ example: 40, description: 'Conformance: directories count.' })
  'conformance.directoriesCount': number;

  @ApiProperty({ example: 993, description: 'Conformance: entities count.' })
  'conformance.entitiesCount': number;

  @ApiProperty({ example: 2198, description: 'Conformance: websites count.' })
  'conformance.websitesCount': number;

  @ApiProperty({ example: 126262, description: 'Conformance: pages count.' })
  'conformance.pagesCount': number;

  @ApiProperty({
    example: 57.44404003639672,
    description: 'Conformance: average pages per website.',
  })
  'conformance.avgPagesPerWebsite': number;

  @ApiProperty({
    example: 30000,
    description: 'Total pages evaluated.',
  })
  total_pages_evaluated: number;

  @ApiProperty({
    example: 4.98,
    description: 'Global average score across all evaluated pages.',
  })
  global_avg_score: number;

  @ApiProperty({
    example: 16494,
    description: 'Total number of errors across all pages.',
  })
  total_errors_across_all_pages: number;

  @ApiProperty({
    example: 2396,
    description: 'Number of pages without level A errors.',
  })
  pagesWithoutErrorsA: number;

  @ApiProperty({
    example: 528,
    description: 'Number of pages without level AA errors.',
  })
  pagesWithoutErrorsAA: number;

  @ApiProperty({
    example: 13506,
    description: 'Number of pages without level AAA errors.',
  })
  pagesWithoutErrorsAAA: number;

  @ApiProperty({
    type: [Number],
    example: [40092, 39990, 39862, 40053, 40153, 40029, 39911, 40280, 39939, 40217],
    description: 'Frequency distribution of scores across buckets.',
  })
  scoreDistributionFrequency: number[];

  @ApiProperty({
    type: DetailsTableDto,
    description: 'Details table for passed checks.',
  })
  successDetailsTable: DetailsTableDto;

  @ApiProperty({
    type: DetailsTableDto,
    description: 'Details table for failed checks (errors).',
  })
  errorsDetailsTable: DetailsTableDto;
}

/* ============================================================
 * GET /analytics/global — root response
 * ============================================================ */

export class GlobalMetricsDto {
  @ApiProperty({
    type: GlobalAppMetricsDto,
    description: 'Aggregated metrics for the AMS application.',
  })
  ams: GlobalAppMetricsDto;

  @ApiProperty({
    type: GlobalAppMetricsDto,
    description: 'Aggregated metrics for the Observatory application.',
  })
  observatory: GlobalAppMetricsDto;

  @ApiProperty({
    type: GlobalAppMetricsDto,
    description: 'Aggregated metrics for the MyMonitor application.',
  })
  mymonitor: GlobalAppMetricsDto;
}
