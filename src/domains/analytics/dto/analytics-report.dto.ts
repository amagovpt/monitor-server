/*import { ApiProperty } from '@nestjs/swagger';
import { AnalyticsPeriod } from '../analytics.swagger';

export class AnalyticsMetricDto {
  @ApiProperty({ example: 'revenue', description: 'Metric key.' })
  key: string;

  @ApiProperty({ example: 'Revenue', description: 'Human-readable label.' })
  label: string;

  @ApiProperty({ example: 15234.75, description: 'Aggregated value.' })
  value: number;

  @ApiProperty({ example: 'USD', description: 'Currency or unit.' })
  unit: string;

  @ApiProperty({ example: 12.4, description: 'Percentage change vs previous period.' })
  deltaPercent: number;
}

export class AnalyticsReportDto {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'Report UUID.' })
  id: string;

  @ApiProperty({ example: 'Monthly Revenue Report' })
  name: string;

  @ApiProperty({ enum: AnalyticsPeriod, example: AnalyticsPeriod.MONTH })
  period: AnalyticsPeriod;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  from: string;

  @ApiProperty({ example: '2025-01-31T23:59:59.999Z' })
  to: string;

  @ApiProperty({ type: [AnalyticsMetricDto] })
  metrics: AnalyticsMetricDto[];

  @ApiProperty({ example: '2025-02-01T10:15:00.000Z' })
  generatedAt: string;
}
*/
