import { Injectable } from '@nestjs/common';
import { AnalyticRepository } from './analytics.repository';
import {
  GlobalStatistics,
  DirectoriesStats,
  WebsiteAuditReport,
  WebsiteRankingDetailed,
} from './types';
import {
  GlobalMetricsResponse,
  PlatformOverviewMetricsResponse,
} from './types/admin-dashboard.types';
import { ExportService } from './services/export.service';
import { ExportExecutionContext } from './queries/type';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticRepository: AnalyticRepository,
    private readonly exportService: ExportService,
  ) {}

  async getAppCounters(): Promise<PlatformOverviewMetricsResponse> {
    return await this.analyticRepository.getAppCounters();
  }

  async getGlobalMetrics(): Promise<GlobalMetricsResponse> {
    const [ams, observatory] = await Promise.all([
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: false }),
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: true }),
    ]);

    return {
      ams,
      observatory,
    };
  }

  async getGlobalWebsite(websiteId: number): Promise<GlobalMetricsResponse> {
    const [ams, observatory] = await Promise.all([
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: false, websiteId }),
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: true, websiteId }),
    ]);

    return {
      ams,
      observatory,
    };
  }

  async getGlobalDirectory(directoryId: number): Promise<GlobalMetricsResponse> {
    const [ams, observatory] = await Promise.all([
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: false, directoryId }),
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: true, directoryId }),
    ]);

    return {
      ams,
      observatory,
    };
  }

  async getGlobalInstitution(institutionId: number): Promise<GlobalMetricsResponse> {
    const [ams, observatory] = await Promise.all([
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: false, institutionId }),
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: true, institutionId }),
    ]);

    return {
      ams,
      observatory,
    };
  }

  async getGlobalTag(tagId: number): Promise<GlobalMetricsResponse> {
    const [ams, observatory] = await Promise.all([
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: false, tagId }),
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: true, tagId }),
    ]);

    return {
      ams,
      observatory,
    };
  }
  async getGlobalPage(pageId: number): Promise<GlobalMetricsResponse> {
    const [ams, observatory] = await Promise.all([
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: false, pageId }),
      this.analyticRepository.getGlobalAnalytics({ onlyObservatory: true, pageId }),
    ]);

    return {
      ams,
      observatory,
    };
  }

  async exportAnalytics(context: ExportExecutionContext) {
    return await this.exportService.exportResource(context);
  }

  async getGlobalStatistics(): Promise<GlobalStatistics> {
    return await this.analyticRepository.getGlobalSummary();
  }

  async getGlobalDirectoriesStatistics(): Promise<DirectoriesStats> {
    return await this.analyticRepository.getGlobalDirectoriesSummary();
  }

  async getWebsiteDetails(websiteId: number): Promise<WebsiteAuditReport> {
    const [summary, accessibilityPlotData, scoreDistribution, rulesMetrics, latestQuartiles] =
      await Promise.all([
        this.analyticRepository.getResourceSummary(websiteId, 'website', 'observatory'),
        this.analyticRepository.getResourcePlotData(websiteId, 'website', 'observatory'),

        this.analyticRepository.getResourceScoreDistribution(websiteId, 'website', 'observatory'),
        this.analyticRepository.getResourceRuleMetrics(websiteId, 'website', 'observatory'),
        this.analyticRepository.getResourceRulesLatestQuartiles(
          websiteId,
          'website',
          'observatory',
        ),
      ]);
    return {
      ...summary,
      ...accessibilityPlotData,
      ...scoreDistribution,
      ...rulesMetrics,
      ...latestQuartiles,
    };
  }

  async getDirectoryStatistics(directoryId: number): Promise<DirectoriesStats> {
    return await this.analyticRepository.getDirectorySummary(directoryId);
  }

  async getDirectoryWebsites(directoryId: number): Promise<WebsiteRankingDetailed[]> {
    return await this.analyticRepository.getRankingDirectory(directoryId);
  }

  public async searchWebsites(query: string): Promise<any[]> {
    return await this.analyticRepository.searchForWebsites(query);
  }
}
