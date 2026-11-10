import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlerCreateDTO } from './dto/crawler-create.dto';
import { CrawlerImportDTO } from './dto/crawler-import.dto';
import { CrawlerTagsCreateDTO } from './dto/crawler-create-tags.dto';
import { CrawlWebsitesResponseDTO } from './dto/crawler-website-response.dto';

export const DiscoveryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('discovery'),
      ApiBearerAuth(),
      ApiResponse({ status: 403, description: 'Forbidden' }),
    ),

  getCrawlWebsites: () =>
    applyDecorators(
      ApiOperation({ summary: 'Find all crawl websites with filters, sorts, and pagination' }),
      ApiResponse({ status: 200, description: 'Success', type: CrawlWebsitesResponseDTO }),
    ),

  crawlWebsite: () =>
    applyDecorators(
      ApiOperation({ summary: 'Start a new crawl for the given websites' }),
      ApiBody({ type: CrawlerCreateDTO }),
      ApiResponse({ status: 201, description: 'Crawl started successfully' }),
      ApiResponse({ status: 400, description: 'Invalid request payload' }),
    ),

  importCrawlers: () =>
    applyDecorators(
      ApiBody({ type: CrawlerImportDTO }),
      ApiOperation({ summary: 'Import crawlers from an external source' }),
      ApiResponse({ status: 200, description: 'Crawlers imported successfully' }),
      ApiResponse({ status: 400, description: 'Invalid request payload' }),
    ),

  crawlWebsiteTags: () =>
    applyDecorators(
      ApiOperation({ summary: 'Start a new crawl for the given tags' }),
      ApiBody({ type: CrawlerTagsCreateDTO }),
      ApiResponse({ status: 201, description: 'Crawl started successfully' }),
      ApiResponse({ status: 400, description: 'Invalid request payload' }),
    ),

  deleteCrawler: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete one or more crawlers' }),
      ApiResponse({ status: 204, description: 'Crawlers deleted successfully' }),
      ApiResponse({ status: 400, description: 'Invalid request payload' }),
    ),
};
