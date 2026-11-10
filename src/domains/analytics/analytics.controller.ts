import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  StreamableFile,
  Response,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AnalyticsDocs } from './analytics.swagger';
import type { Response as ExpressResponse } from 'express';
import { AnalyticsService } from './analytics.service';
import { RoleSlug } from 'src/core/authentication/interfaces/types';

import { RolesGuard } from 'src/core/authorization/guards/roles.guard';
import { JwtAuthGuard } from 'src/core/authentication/guards/jwt-auth.guard';
import { Roles } from 'src/core/authorization/decorators/roles.decorator';
import { FgaGuard } from 'src/core/authorization/guards/fga.guard';
import { FgaAuthorized } from 'src/core/authorization/decorators/fga-authorization.decorator';
import { AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { ExportAnalyticsDto } from './dto/export-analytics.dto';
import { Readable } from 'stream';

@AnalyticsDocs.controller()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@Roles(RoleSlug.ADMIN)
@FgaAuthorized(AMS_ROLE_VIEWER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @AnalyticsDocs.getOverview()
  @Get('overview')
  async getOverview() {
    return this.analyticsService.getAppCounters();
  }

  @Get('tag/:tagId')
  @AnalyticsDocs.getTagMetrics()
  @HttpCode(HttpStatus.OK)
  async getTagMetrics(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.analyticsService.getGlobalTag(tagId);
  }

  @Get('website/:websiteId')
  @AnalyticsDocs.getWebsiteMetrics()
  @HttpCode(HttpStatus.OK)
  async getWebsiteMetrics(@Param('websiteId', ParseIntPipe) websiteId: number) {
    return this.analyticsService.getGlobalWebsite(websiteId);
  }

  @Get('institution/:institutionId')
  @AnalyticsDocs.getInstitutionMetrics()
  @HttpCode(HttpStatus.OK)
  async getInstitutionMetrics(@Param('institutionId', ParseIntPipe) institutionId: number) {
    return this.analyticsService.getGlobalInstitution(institutionId);
  }

  @Get('directory/:directoryId')
  @AnalyticsDocs.getDirectoryMetrics()
  @HttpCode(HttpStatus.OK)
  async getDirectoryMetrics(@Param('directoryId', ParseIntPipe) directoryId: number) {
    return this.analyticsService.getGlobalDirectory(directoryId);
  }

  @AnalyticsDocs.getGlobalMetrics()
  @Get('global')
  @HttpCode(HttpStatus.OK)
  async getGlobalMetrics() {
    return this.analyticsService.getGlobalMetrics();
  }

  @Get('global/website/:websiteId')
  @AnalyticsDocs.getGlobalWebsiteMetrics()
  @HttpCode(HttpStatus.OK)
  async getGlobalWebsiteMetrics(@Param('websiteId', ParseIntPipe) websiteId: number) {
    return this.analyticsService.getGlobalWebsite(websiteId);
  }

  @Get('global/directory/:directoryId')
  @AnalyticsDocs.getGlobalDirectoryMetrics()
  @HttpCode(HttpStatus.OK)
  async getGlobalDirectoryMetrics(@Param('directoryId', ParseIntPipe) directoryId: number) {
    return this.analyticsService.getGlobalDirectory(directoryId);
  }

  @AnalyticsDocs.exportAnalytics()
  @Get('exports')
  @HttpCode(HttpStatus.OK)
  async exportAnalytics(
    @Query() dto: ExportAnalyticsDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const { stream, contentType, filename } = await this.analyticsService.exportAnalytics({
      resource: dto.resource,
      format: dto.format,
      entityId: dto.entityId,
    });

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    return new StreamableFile(stream as Readable, {
      type: contentType,
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
