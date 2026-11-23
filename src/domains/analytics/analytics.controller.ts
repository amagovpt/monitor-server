import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  StreamableFile,
  ParseIntPipe,
  Query,
  Header,
} from '@nestjs/common';
import { AnalyticsDocs } from './analytics.swagger';
import { AnalyticsService } from './analytics.service';
import { RoleSlug } from 'src/core/authentication/interfaces/types';

import { AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { ExportAnalyticsDto } from './dto/export-analytics.dto';
import { Readable } from 'stream';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@AnalyticsDocs.controller()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @AnalyticsDocs.getOverview()
  @Get('overview')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getOverview() {
    return this.analyticsService.getAppCounters();
  }

  @Get('tag/:tagId')
  @AnalyticsDocs.getTagMetrics()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getTagMetrics(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.analyticsService.getGlobalTag(tagId);
  }

  @Get('website/:websiteId')
  @AnalyticsDocs.getWebsiteMetrics()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getWebsiteMetrics(@Param('websiteId', ParseIntPipe) websiteId: number) {
    return this.analyticsService.getGlobalWebsite(websiteId);
  }

  @Get('institution/:institutionId')
  @AnalyticsDocs.getInstitutionMetrics()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getInstitutionMetrics(@Param('institutionId', ParseIntPipe) institutionId: number) {
    return this.analyticsService.getGlobalInstitution(institutionId);
  }

  @Get('directory/:directoryId')
  @AnalyticsDocs.getDirectoryMetrics()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getDirectoryMetrics(@Param('directoryId', ParseIntPipe) directoryId: number) {
    return this.analyticsService.getGlobalDirectory(directoryId);
  }

  @AnalyticsDocs.getGlobalMetrics()
  @Get('global')
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getGlobalMetrics() {
    return this.analyticsService.getGlobalMetrics();
  }

  @Get('global/website/:websiteId')
  @AnalyticsDocs.getGlobalWebsiteMetrics()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getGlobalWebsiteMetrics(@Param('websiteId', ParseIntPipe) websiteId: number) {
    return this.analyticsService.getGlobalWebsite(websiteId);
  }

  @Get('global/directory/:directoryId')
  @AnalyticsDocs.getGlobalDirectoryMetrics()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async getGlobalDirectoryMetrics(@Param('directoryId', ParseIntPipe) directoryId: number) {
    return this.analyticsService.getGlobalDirectory(directoryId);
  }
  @AnalyticsDocs.exportAnalytics()
  @Get('exports')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_VIEWER,
  })
  async exportAnalytics(@Query() dto: ExportAnalyticsDto): Promise<StreamableFile> {
    const { stream, contentType, filename } = await this.analyticsService.exportAnalytics({
      resource: dto.resource,
      format: dto.format,
      entityId: dto.entityId,
    });

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    // nosemgrep: javascript.nestjs.web.direct-response-string-nestjs.direct-response-string-nestjs -- Returns a binary StreamableFile attachment (not raw HTML); ExportAnalyticsDto is validated via class-validator decorators    return new StreamableFile(stream as Readable, {
    return new StreamableFile(stream as Readable, {
      type: contentType,
      disposition: `attachment; filename="${safeFilename}"`,
    });
  }
}
