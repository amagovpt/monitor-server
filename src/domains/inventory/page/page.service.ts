import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import xxhash from 'xxhash-wasm';

import { Page } from './page.entity';
import { PageRepository } from './page.repository';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { QueryRequest, PaginationResponse } from 'src/common/repositories/base.repository';
import type { PageFilter, PageSort, PagePagination } from './types';
import { CreatePageDto } from './dto/create-page.dto';
import { ContextEnum } from '../context/context.enum';
import { PageEvalDTO } from './dto/page-detailed.dto';
import {
  extractSitemapUrls,
  filterByOrigin,
  FilterResult,
  SITEMAP_MAX_URLS,
} from './utils/sitemap.utils';
import { chunkArray } from 'src/common/utils/utils';
import { Website } from '../website/website.entity';

@Injectable()
export class PageService {
  constructor(
    private readonly pageRepo: PageRepository,
    @InjectRepository(Website)
    private readonly websiteRepo: Repository<Website>,
  ) {}

  private async getWebsiteOrigin(websiteId: number): Promise<string> {
    const website = await this.websiteRepo.findOne({
      where: { id: websiteId },
      select: { id: true, baseUrl: true },
    });
    if (!website) throw new NotFoundException(`Website ${websiteId} not found`);

    try {
      return new URL(website.baseUrl).origin;
    } catch {
      throw new UnprocessableEntityException('The website has an invalid URL configured');
    }
  }

  private async filterForWebsite(websiteId: number, urls: string[]): Promise<FilterResult> {
    const origin = await this.getWebsiteOrigin(websiteId);
    return filterByOrigin(urls, origin);
  }

  private async savePages(
    websiteId: number,
    urls: string[],
    securityContext: SecurityContext,
  ): Promise<void> {
    if (urls.length === 0) return;

    const { h64 } = await xxhash();
    const pages = urls.map((url) => ({
      url,
      urlHash: BigInt.asIntN(64, h64(url)).toString(),
    }));

    for (const chunk of chunkArray(pages, 1000)) {
      await this.pageRepo.upsertPages(websiteId, chunk, securityContext);
    }
  }

  async findAll(
    queryArgs: QueryRequest<PageFilter, PageSort, PagePagination>,
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<PaginationResponse<PageEvalDTO>> {
    const query = {
      filters: queryArgs.filters || {},
      sortings: queryArgs.sortings || {},
      pagination: queryArgs.pagination || {},
      contexts,
      securityContext,
    };
    return await this.pageRepo.findManyWithLastEvalScore(query);
  }

  async create(dto: CreatePageDto, securityContext: SecurityContext): Promise<void> {
    if (dto.pagesUrl.length === 0) return;

    const { urls, invalid, otherOrigin } = await this.filterForWebsite(dto.websiteId, dto.pagesUrl);

    if (invalid > 0 || otherOrigin > 0) {
      throw new BadRequestException(
        `${otherOrigin} URL(s) do not belong to the website and ${invalid} are invalid`,
      );
    }

    await this.savePages(dto.websiteId, urls, securityContext);
  }

  async findPageById(
    websiteId: number,
    id: number,
    securityContext: SecurityContext,
  ): Promise<Page> {
    const page = await this.pageRepo.findByPageByWebsiteId(websiteId, id, securityContext);
    if (!page) throw new NotFoundException(`Page with ID ${id} not found`);

    return page;
  }

  async changePageContexts(
    pageId: number[],
    contexts: ContextEnum[],
    securityContext: SecurityContext,
  ): Promise<void> {
    await this.pageRepo.changePageContexts(pageId, contexts, securityContext);
  }

  async handlePageRemoval(pageIds: number[], securityContext: SecurityContext): Promise<void> {
    await this.pageRepo.deletePagesWithContextCheck(pageIds, securityContext);
  }

  async importPages(
    securityContext: SecurityContext,
    websiteId: number,
    crawlPages: string[],
  ): Promise<void> {
    const { urls } = await this.filterForWebsite(websiteId, crawlPages);
    await this.savePages(websiteId, urls, securityContext);
  }

  public async toggleObservatoryStatus(
    websiteId: number,
    pageId: number,
    securityContext: SecurityContext,
  ) {
    await this.pageRepo.toggleObservatoryStatus(websiteId, pageId, securityContext);
  }

  async createFromSitemap(
    websiteId: number,
    file: Express.Multer.File,
    securityContext: SecurityContext,
  ) {
    const rawUrls = extractSitemapUrls(file.buffer.toString('utf-8'));
    if (rawUrls.length === 0) {
      throw new BadRequestException('No URLs found in the file');
    }
    if (rawUrls.length > SITEMAP_MAX_URLS) {
      throw new BadRequestException(`Sitemap exceeds ${SITEMAP_MAX_URLS} URLs`);
    }

    const { urls, invalid, otherOrigin, duplicates } = await this.filterForWebsite(
      websiteId,
      rawUrls,
    );

    await this.savePages(websiteId, urls, securityContext);

    return {
      totalInFile: rawUrls.length,
      imported: urls.length,
      skipped: { otherOrigin, invalid, duplicates },
    };
  }
}
