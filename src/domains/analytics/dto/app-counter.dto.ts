import { ApiProperty } from '@nestjs/swagger';

/* ============================================================
 * Shared sub-blocks
 * ============================================================ */

export class AmsCountersDto {
  @ApiProperty({ example: 40, description: 'Total directories in AMS.' })
  directories: number;

  @ApiProperty({ example: 62, description: 'Total tags in AMS.' })
  tags: number;

  @ApiProperty({ example: 993, description: 'Total entities in AMS.' })
  entities: number;

  @ApiProperty({ example: 2198, description: 'Total websites in AMS.' })
  websites: number;

  @ApiProperty({ example: 126262, description: 'Total pages in AMS.' })
  pages: number;

  @ApiProperty({ example: 13, description: 'Total users in AMS.' })
  users: number;

  @ApiProperty({ example: 1493, description: 'Total evaluations in AMS.' })
  evaluations: number;
}

export class ObservatoryCountersDto {
  @ApiProperty({ example: 40, description: 'Total directories in Observatory.' })
  directories: number;

  @ApiProperty({ example: 62, description: 'Total tags in Observatory.' })
  tags: number;

  @ApiProperty({ example: 993, description: 'Total entities in Observatory.' })
  entities: number;

  @ApiProperty({ example: 2198, description: 'Total websites in Observatory.' })
  websites: number;

  @ApiProperty({ example: 126433, description: 'Total pages in Observatory.' })
  pages: number;

  @ApiProperty({ example: 648, description: 'Total evaluations in Observatory.' })
  evaluations: number;
}

export class MyMonitorCountersDto {
  @ApiProperty({ example: 11, description: 'Total users in MyMonitor.' })
  users: number;

  @ApiProperty({ example: 0, description: 'Total teams in MyMonitor.' })
  teams: number;

  @ApiProperty({ example: 0, description: 'Total websites in MyMonitor.' })
  websites: number;

  @ApiProperty({ example: 48197, description: 'Total evaluations in MyMonitor.' })
  evaluations: number;

  @ApiProperty({ example: 3576, description: 'Total pages in MyMonitor.' })
  pages: number;
}

export class TotalCountersDto {
  @ApiProperty({ example: 24, description: 'Total users across all apps.' })
  users: number;

  @ApiProperty({ example: 8, description: 'Total government users.' })
  gov_users: number;

  @ApiProperty({ example: 16, description: 'Total non-government users.' })
  non_gov_users: number;

  @ApiProperty({ example: 0, description: 'Total teams across all apps.' })
  teams: number;

  @ApiProperty({ example: 48277, description: 'Total evaluations across all apps.' })
  evaluations: number;

  @ApiProperty({
    example: 648,
    description: 'Total published evaluations.',
  })
  evaluations_published: number;

  @ApiProperty({
    example: 47629,
    description: 'Total staged evaluations.',
  })
  evaluations_staged: number;

  @ApiProperty({ example: 126433, description: 'Total pages across all apps.' })
  pages: number;
}

/* ============================================================
 * GET /analytics/overview
 * ============================================================ */

export class AppCountersDto {
  @ApiProperty({
    type: AmsCountersDto,
    description: 'Counters for the AMS application.',
  })
  ams: AmsCountersDto;

  @ApiProperty({
    type: ObservatoryCountersDto,
    description: 'Counters for the Observatory application.',
  })
  observatory: ObservatoryCountersDto;

  @ApiProperty({
    type: MyMonitorCountersDto,
    description: 'Counters for the MyMonitor application.',
  })
  mymonitor: MyMonitorCountersDto;

  @ApiProperty({
    type: TotalCountersDto,
    description: 'Aggregated totals across all applications.',
  })
  total: TotalCountersDto;
}
