import { ApiProperty } from '@nestjs/swagger';

/* ============================================================
 * Quartile interval
 * ============================================================ */

export class QuartileIntervalDto {
  @ApiProperty({ example: '1', description: 'Lower bound of the interval.' })
  lower: string;

  @ApiProperty({ example: '50', description: 'Upper bound of the interval.' })
  upper: string;
}

/* ============================================================
 * Quartile entry
 * ============================================================ */

export class QuartileDto {
  @ApiProperty({ example: '424', description: 'Total occurrences in this quartile.' })
  total: string;

  @ApiProperty({ example: '25', description: 'Percentage share (as string).' })
  percentage: string;

  @ApiProperty({
    type: QuartileIntervalDto,
    description: 'Interval bounds.',
  })
  interval: QuartileIntervalDto;
}

/* ============================================================
 * Distribution entry (errors / best practices)
 * ============================================================ */

export class DistributionEntryDto {
  @ApiProperty({ example: 'landmark_06', description: 'Check / rule key.' })
  key: string;

  @ApiProperty({ example: '1673', description: 'Number of pages affected.' })
  pagesCount: string;

  @ApiProperty({ example: '169553', description: 'Total occurrences.' })
  occurrenceCount: string;
}

/* ============================================================
 * Metric entry (success / error metric map values)
 * ============================================================ */

export class MetricDetailDto {
  @ApiProperty({ example: '1665', description: 'Number of pages affected.' })
  pageCount: string;

  @ApiProperty({ example: '167676', description: 'Total occurrences.' })
  occurrenceCount: string;

  @ApiProperty({ example: 'inputLabel', description: 'Element selector / category.' })
  element: string;

  @ApiProperty({ example: 'inputLabel', description: 'Test name.' })
  testName: string;

  @ApiProperty({
    example: 'passed',
    description: 'Result of the check.',
    enum: ['passed', 'failed'],
  })
  result: string;
}

/* ============================================================
 * Details table row
 * ============================================================ */

export class DetailsTableRowDto {
  @ApiProperty({ example: 'input_02b', description: 'Check / rule key.' })
  key: string;

  @ApiProperty({ example: '167676', description: 'Total occurrences.' })
  occurrenceCount: string;

  @ApiProperty({ example: '1665', description: 'Number of pages affected.' })
  pageCount: string;

  @ApiProperty({
    example: 'A',
    description: 'WCAG conformance level.',
    enum: ['A', 'AA', 'AAA'],
  })
  level: string;

  @ApiProperty({
    type: [QuartileDto],
    description: 'Quartile distribution.',
  })
  quartiles: QuartileDto[];
}

/* ============================================================
 * Details table wrapper
 * ============================================================ */

export class DetailsTableDto {
  @ApiProperty({
    type: [String],
    example: ['0', '1', '2', '3', '4', '5'],
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
 * Main data block — one scope (directory / website / tag / institution)
 * ============================================================ */

export class ScopeAnalyticsDataDto {
  @ApiProperty({
    example: '2024-05-23 12:40:35',
    description: 'Oldest evaluated page date (YYYY-MM-DD HH:mm:ss).',
  })
  oldestPageDate: string;

  @ApiProperty({
    example: '2026-07-31 12:40:35',
    description: 'Most recent evaluated page date (YYYY-MM-DD HH:mm:ss).',
  })
  recentPageDate: string;

  @ApiProperty({ example: 4.4, description: 'Aggregated score for this scope.' })
  score: number;

  @ApiProperty({ example: 7, description: 'Total number of pages.' })
  pageCount: number;

  @ApiProperty({ example: 3, description: 'Number of pages with errors.' })
  pagesWithErrorsCount: number;

  @ApiProperty({ example: 4, description: 'Number of pages without errors.' })
  pagesWithoutErrorsCount: number;

  @ApiProperty({ example: 1, description: 'Pages without level A errors.' })
  pagesWithoutErrorsA: number;

  @ApiProperty({ example: 0, description: 'Pages without level AA errors.' })
  pagesWithoutErrorsAA: number;

  @ApiProperty({ example: 4, description: 'Pages without level AAA errors.' })
  pagesWithoutErrorsAAA: number;

  @ApiProperty({
    type: [Number],
    example: [849, 882, 777, 838, 880, 824, 914, 887, 896, 882],
    description: 'Frequency distribution of scores across buckets.',
  })
  scoreDistributionFrequency: number[];

  @ApiProperty({
    type: [DistributionEntryDto],
    description: 'Top errors by rule key.',
  })
  errorsDistribution: DistributionEntryDto[];

  @ApiProperty({
    type: [DistributionEntryDto],
    description: 'Top best practices by rule key.',
  })
  bestPracticesDistribution: DistributionEntryDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/MetricDetailDto' },
    description: 'Map of success metric key → details.',
  })
  successMetrics: Record<string, MetricDetailDto>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/MetricDetailDto' },
    description: 'Map of error metric key → details.',
  })
  errorMetrics: Record<string, MetricDetailDto>;

  @ApiProperty({
    type: DetailsTableDto,
    description: 'Details table for passed checks.',
  })
  successDetailsTable: DetailsTableDto;

  @ApiProperty({
    type: DetailsTableDto,
    description: 'Details table for failed checks.',
  })
  errorsDetailsTable: DetailsTableDto;
}

/* ============================================================
 * Root response — same for directory / website / tag / institution
 * ============================================================ */

export class ScopeAnalyticsResponseDto {
  @ApiProperty({
    example: '2026-10-07T00:34:48.231Z',
    description: 'ISO 8601 timestamp when the response was generated.',
    format: 'date-time',
  })
  timestamp: string;

  @ApiProperty({
    type: ScopeAnalyticsDataDto,
    description: 'Aggregated analytics payload.',
  })
  data: ScopeAnalyticsDataDto;
}
