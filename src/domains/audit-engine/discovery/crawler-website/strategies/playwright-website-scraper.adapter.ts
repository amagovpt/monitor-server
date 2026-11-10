import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import { IWebsiteScraper } from '../types/scraper.interface';
import { UrlNormalizer } from '../url-normalizer';

@Injectable()
export class PlaywrightWebsiteScraperAdapter implements IWebsiteScraper {
  async scrapeWebsite(baseUrl: string): Promise<string[]> {
    const browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const context = await browser.newContext();

    try {
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

      const rawHrefs = await page.$$eval('body a', (links) =>
        links
          .map((link) => link.getAttribute('href'))
          .filter((href): href is string => href !== null),
      );

      return UrlNormalizer.filterAndNormalize(rawHrefs, baseUrl);
    } catch {
      return [];
    } finally {
      await context.close();
      await browser.close();
    }
  }
}
