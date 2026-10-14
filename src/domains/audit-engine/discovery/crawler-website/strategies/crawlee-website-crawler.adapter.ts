import { Injectable, Logger } from '@nestjs/common';
import { Configuration, PlaywrightCrawler, MemoryStorage } from 'crawlee';
import { IWebsiteScraper } from '../types/scraper.interface';
import { UrlNormalizer } from '../url-normalizer';

@Injectable()
export class CrawleeStealthScraperAdapter implements IWebsiteScraper {
  private readonly logger = new Logger(CrawleeStealthScraperAdapter.name);

  async scrapeWebsite(baseUrl: string): Promise<string[]> {
    const discoveredLinks = new Set<string>();
    discoveredLinks.add(baseUrl);

    const storageClient = new MemoryStorage({ persistStorage: false });
    const customConfig = new Configuration({
      storageClient,
      persistStorage: false,
      purgeOnStart: true,
    });

    const crawler = new PlaywrightCrawler(
      {
        maxCrawlDepth: 1,
        maxRequestsPerCrawl: 100,
        maxConcurrency: 1,
        headless: true,
        maxRequestRetries: 0,

        useSessionPool: false,
        persistCookiesPerSession: false,

        browserPoolOptions: {
          useFingerprints: true,
        },

        launchContext: {
          useIncognitoPages: true,
          launchOptions: {
            executablePath:
              process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser',

            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disk-cache-size=0',
              '--media-cache-size=0',
            ],
          },
        },

        async requestHandler({ request, enqueueLinks, log }) {
          log.info(`A extrair com Stealth (Crawlee Memory): ${request.url}`);

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

        failedRequestHandler: async ({ request }, error) => {
          if (request.url !== baseUrl) {
            discoveredLinks.delete(request.url);
          }

          this.logger.warn(`Falha ao crawlar ${request.url}`);
        },
      },
      customConfig,
    );

    try {
      this.logger.log(`A iniciar stealth crawl (in-memory) para: ${baseUrl}`);
      await crawler.run([baseUrl]);
      this.logger.log(`Crawl concluído. Links descobertos: ${discoveredLinks.size}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro no Stealth Adapter: ${errorMessage}`);
      throw error;
    } finally {
      try {
        await crawler.teardown();
        await storageClient.teardown?.();
      } catch (e) {
        this.logger.warn(`Falha ao limpar storage em memória: ${String(e)}`);
      }
    }

    return UrlNormalizer.filterAndNormalize(Array.from(discoveredLinks), baseUrl);
  }
}
