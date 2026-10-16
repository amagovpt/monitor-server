import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AnalyticsFormat {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.MONTH,
    description: 'Predefined aggregation window.',
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.MONTH;

  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Start date (ISO 8601). Required when `period=custom`.',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: '2025-01-31T23:59:59.999Z',
    description: 'End date (ISO 8601). Required when `period=custom`.',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    example: 'revenue,active_users',
    description: 'Comma-separated list of metrics to include.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metrics?: string;
}
