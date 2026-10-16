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
import { ExportAnalyticsParamsDto } from './dto/export-analytics.dto';
import { CacheableBy } from 'src/core/cache/decorator/cache-resource.decorator';

@AnalyticsDocs.controller()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
@Roles(RoleSlug.ADMIN)
@FgaAuthorized(AMS_ROLE_VIEWER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @CacheableBy({
    key: 'analytics_overview',
    ttl: 60,
  })
  @AnalyticsDocs.getOverview()
  @Get('overview')
  async getOverview() {
    return this.analyticsService.getAppCounters();
  }

  @Get('tag/:tagId')
  @CacheableBy({
    key: 'analytics_tag',
    source: 'path',
    param: 'tagId',
    ttl: 60,
  })
  @AnalyticsDocs.getTagMetrics()
  @HttpCode(HttpStatus.OK)
  async getTagMetrics(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.analyticsService.getGlobalTag(tagId);
  }

  @Get('website/:websiteId')
  @CacheableBy({
    key: 'analytics_website',
    source: 'path',
    param: 'websiteId',
    ttl: 60,
  })
  @AnalyticsDocs.getWebsiteMetrics()
  @HttpCode(HttpStatus.OK)
  async getWebsiteMetrics(@Param('websiteId', ParseIntPipe) websiteId: number) {
    return this.analyticsService.getGlobalWebsite(websiteId);
  }

  @Get('institution/:institutionId')
  @CacheableBy({
    key: 'analytics_institution',
    source: 'path',
    param: 'institutionId',
    ttl: 60,
  })
  @AnalyticsDocs.getInstitutionMetrics()
  @HttpCode(HttpStatus.OK)
  async getInstitutionMetrics(@Param('institutionId', ParseIntPipe) institutionId: number) {
    return this.analyticsService.getGlobalInstitution(institutionId);
  }

  @Get('directory/:directoryId')
  @CacheableBy({
    key: 'analytics_directory',
    source: 'path',
    param: 'directoryId',
    ttl: 60,
  })
  @AnalyticsDocs.getDirectoryMetrics()
  @HttpCode(HttpStatus.OK)
  async getDirectoryMetrics(@Param('directoryId', ParseIntPipe) directoryId: number) {
    return this.analyticsService.getGlobalDirectory(directoryId);
  }

  @AnalyticsDocs.getGlobalMetrics()
  @Get('global')
  @CacheableBy({
    key: 'analytics_global',
    ttl: 600,
  })
  @HttpCode(HttpStatus.OK)
  async getGlobalMetrics() {
    return this.analyticsService.getGlobalMetrics();
  }

  @Get('global/website/:websiteId')
  @CacheableBy({
    key: 'analytics_global_website',
    source: 'path',
    param: 'websiteId',
    ttl: 60,
  })
  @HttpCode(HttpStatus.OK)
  async getGlobalWebsiteMetrics(@Param('websiteId', ParseIntPipe) websiteId: number) {
    return this.analyticsService.getGlobalWebsite(websiteId);
  }

  @Get('global/directory/:directoryId')
  @CacheableBy({
    key: 'analytics_global_directory',
    source: 'path',
    param: 'directoryId',
    ttl: 60,
  })
  @HttpCode(HttpStatus.OK)
  async getGlobalDirectoryMetrics(@Param('directoryId', ParseIntPipe) directoryId: number) {
    return this.analyticsService.getGlobalDirectory(directoryId);
  }

  @AnalyticsDocs.exportAnalytics()
  @Get('export/:context/format/:format')
  @HttpCode(HttpStatus.OK)
  async exportAnalytics(
    @Param() params: ExportAnalyticsParamsDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const { stream, contentType, filename } = await this.analyticsService.exportAnalytics(
      params.context,
      params.format,
    );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    return new StreamableFile(stream);
  }
}
