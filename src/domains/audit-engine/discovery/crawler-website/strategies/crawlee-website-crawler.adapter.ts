import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { IWebsiteScraper } from '../types/scraper.interface';
import * as path from 'path';
import * as fs from 'fs';
import { UrlNormalizer } from '../url-normalizer';

@Injectable()
export class CrawleeStealthScraperAdapter implements IWebsiteScraper {
  private readonly logger = new Logger(CrawleeStealthScraperAdapter.name);

  async scrapeWebsite(baseUrl: string): Promise<string[]> {
    const discoveredLinks = new Set<string>();
    discoveredLinks.add(baseUrl);

    const ephemeralDir = path.join(
      process.cwd(),
      `crawlee-stealth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    );

    process.env.CRAWLEE_STORAGE_DIR = ephemeralDir;

    const crawler = new PlaywrightCrawler({
      maxCrawlDepth: 1,
      maxRequestsPerCrawl: 100,
      maxConcurrency: 1,
      headless: true,

      browserPoolOptions: {
        useFingerprints: true,
      },

      launchContext: {
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        },
      },

      maxRequestRetries: 0,

      async requestHandler({ request, enqueueLinks, log }) {
        log.info(`A extrair com Stealth (Crawlee): ${request.url}`);

        await enqueueLinks({
          strategy: 'same-domain',
          transformRequestFunction: (req) => {
            if (req.url) {
              discoveredLinks.add(req.url);
            }
            return req;
          },
        });
      },

      failedRequestHandler({ request, error }) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Falha no Stealth Crawler para ${request.url}: ${errorMessage}`);
      },
    });

    try {
      this.logger.log(`A iniciar stealth crawl para: ${baseUrl}`);
      await crawler.run([baseUrl]);
      this.logger.log(`Crawl concluído. Links descobertos: ${discoveredLinks.size}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro no Stealth Adapter: ${errorMessage}`);
      throw error;
    } finally {
      try {
        if (fs.existsSync(ephemeralDir)) {
          fs.rmSync(ephemeralDir, { recursive: true, force: true });
          this.logger.log(`Storage temporário stealth limpo: ${ephemeralDir}`);
        }
      } catch (cleanError) {
        this.logger.warn(`Falha ao limpar diretoria temporária: ${cleanError}`);
      }

      delete process.env.CRAWLEE_STORAGE_DIR;
    }
    const normalizedHrefs = UrlNormalizer.filterAndNormalize(Array.from(discoveredLinks), baseUrl);
    return normalizedHrefs;
  }
}
