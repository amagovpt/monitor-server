import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlPagesResponseDTO } from './dto/crawler-page-response.dto';
import { CrawlerPageDeleteDTO } from './dto/crawler-page-delete.dto';
import { CrawlerPageImportDTO } from './dto/crawler-page-import.dto';

export const DiscoveryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('discovery/pages'),
      ApiBearerAuth(),
      ApiResponse({ status: 403, description: 'Forbidden' }),
    ),

  getCrawlPages: () =>
    applyDecorators(
      ApiOperation({ summary: 'List crawl pages for a crawler with filters, sorting and pagination' }),
      ApiParam({ name: 'websiteId', type: Number, required: true, description: 'Unique identifier of the website' }),
      ApiParam({ name: 'crawlerId', type: Number, required: true, description: 'Unique identifier of the crawler' }),
      ApiResponse({ status: 200, description: 'Paginated list of crawl pages retrieved successfully', type: CrawlPagesResponseDTO }),
      ApiResponse({ status: 400, description: 'Invalid path or query parameters' }),
    ),

  importCrawlPages: () =>
    applyDecorators(
      ApiOperation({ summary: 'Import crawl pages into a crawler' }),
      ApiParam({ name: 'websiteId', type: Number, required: true, description: 'Unique identifier of the website' }),
      ApiParam({ name: 'crawlerId', type: Number, required: true, description: 'Unique identifier of the crawler' }),
      ApiBody({ type: CrawlerPageImportDTO }),
      ApiResponse({ status: 201, description: 'Crawl pages imported successfully' }),
      ApiResponse({ status: 400, description: 'Invalid request payload' }),
    ),

  deleteCrawlPages: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete crawl pages from a crawler' }),
      ApiParam({ name: 'websiteId', type: Number, required: true, description: 'Unique identifier of the website' }),
      ApiParam({ name: 'crawlerId', type: Number, required: true, description: 'Unique identifier of the crawler' }),
      ApiBody({ type: CrawlerPageDeleteDTO }),
      ApiResponse({ status: 204, description: 'Crawl pages deleted successfully' }),
      ApiResponse({ status: 400, description: 'Invalid request payload' }),
    ),
};
