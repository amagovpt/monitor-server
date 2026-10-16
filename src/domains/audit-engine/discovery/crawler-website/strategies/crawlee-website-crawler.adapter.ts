import { Injectable, Logger } from '@nestjs/common';
import {
  CheerioCrawler,
  Configuration,
  MemoryStorage,
  PlaywrightCrawler,
  ProxyConfiguration,
} from 'crawlee';
import type { Page } from 'playwright';
import { gunzipSync } from 'node:zlib';
import { IWebsiteScraper } from '../types/scraper.interface';
import { UrlNormalizer } from '../url-normalizer';

/**
 * Layered strategy (from cheapest/stealthiest to heaviest):
 *   1. robots.txt + sitemaps  -> few requests, rarely WAF-protected
 *   2. HTTP (Cheerio)         -> real browser TLS/headers, no browser instance
 *   3. Browser (Playwright)   -> coherent fingerprint, proxy, rotating sessions,
 *                                 JS challenge waiting and block detection
 * Only escalates to the next layer if there are still insufficient links.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const MAX_PAGES_PER_TIER = 25;
const MIN_LINKS_TARGET = 15;
const MAX_SITEMAP_FILES = 6;
const MAX_SITEMAP_URLS = 500;
const BLOCK_HEAVY_RESOURCES = true;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const FETCH_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

// Exclude static files from the crawl queue
const ENQUEUE_EXCLUDE = [
  '**/*.{pdf,zip,rar,jpg,jpeg,png,gif,svg,webp,ico,mp4,mp3,mkv,wav,css,js,json,xml,txt}',
];

const CHALLENGE_TITLE =
  /just a moment|attention required|access denied|verify you are human|are you (a )?robot|pardon our interruption|request blocked|security check|diamwall/i;
const CHALLENGE_BODY =
  /captcha|verify you are human|unusual traffic|automated (access|requests)|access denied|diamwall|enable javascript and cookies/i;
const LOC_REGEX = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/gi;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const decodeXml = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

/**
 * Heuristic for detecting blocking pages. Avoids false positives: a normal page
 * that only mentions "captcha" in a form has much more text than
 * a challenge page.
 */
function looksLikeChallenge(title: string, text: string, hasWidget: boolean): boolean {
  if (CHALLENGE_TITLE.test(title)) return true;
  if (text.length < 2000 && (hasWidget || CHALLENGE_BODY.test(text))) return true;
  return false;
}

interface CrawlState {
  links: Set<string>;
  /** Final base URL after redirects (http->https, example.pt->www.example.pt) */
  finalBase?: string;
  /** true if the base page was not obtained in the current tier */
  baseFailed: boolean;
}

@Injectable()
export class CrawleeStealthScraperAdapter implements IWebsiteScraper {
  private readonly logger = new Logger(CrawleeStealthScraperAdapter.name);

  async scrapeWebsite(baseUrl: string): Promise<string[]> {
    this.logger.debug(`[Pipeline] Starting scrape for base URL: ${baseUrl}`);
    const state: CrawlState = { links: new Set([baseUrl]), baseFailed: false };
    const proxyConfiguration = this.buildProxyConfiguration();

    // Layer 1: sitemaps
    await this.safely('sitemap', () => this.collectFromSitemaps(baseUrl, state));
    this.logger.debug(
      `[Pipeline] After Layer 1 (Sitemaps) - Total links collected: ${state.links.size}`,
    );

    // Layer 2: HTTP with browser headers/TLS
    if (state.links.size < MIN_LINKS_TARGET) {
      this.logger.debug(
        `[Pipeline] Insufficient links (${state.links.size} < ${MIN_LINKS_TARGET}). Proceeding to Layer 2 (HTTP/Cheerio)...`,
      );
      await this.safely('http', () => this.runHttpTier(baseUrl, state, proxyConfiguration));
      this.logger.debug(
        `[Pipeline] After Layer 2 (HTTP) - Total links collected: ${state.links.size}`,
      );
    } else {
      this.logger.debug(
        `[Pipeline] Link target reached in Layer 1 (${state.links.size} >= ${MIN_LINKS_TARGET}). Skipping Layer 2.`,
      );
    }

    // Layer 3: real browser
    if (state.links.size < MIN_LINKS_TARGET) {
      this.logger.log(`Escalating to browser (${state.links.size} links so far): ${baseUrl}`);
      state.baseFailed = false;
      await this.safely('browser', () => this.runBrowserTier(baseUrl, state, proxyConfiguration));
      this.logger.debug(
        `[Pipeline] After Layer 3 (Browser) - Total links collected: ${state.links.size}`,
      );
    } else {
      this.logger.debug(`[Pipeline] Link target reached. Skipping Layer 3 (Browser).`);
    }

    if (state.links.size <= 1 && state.baseFailed) {
      this.logger.error(`[Pipeline] Critical failure: All layers were blocked for ${baseUrl}`);
      throw new Error(`All layers were blocked for ${baseUrl}`);
    }

    this.logger.log(`Discovered links (before normalization): ${state.links.size}`);
    const normalizedLinks = UrlNormalizer.filterAndNormalize(
      Array.from(state.links),
      state.finalBase ?? baseUrl,
    );
    this.logger.debug(
      `[Pipeline] Links after normalization and filtering: ${normalizedLinks.length}`,
    );
    return normalizedLinks;
  }

  // -------------------------------------------------------------------------
  // Layer 1: robots.txt + sitemaps
  // -------------------------------------------------------------------------
  private async collectFromSitemaps(baseUrl: string, state: CrawlState): Promise<void> {
    const origin = new URL(baseUrl).origin;
    const queue = new Set<string>([`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]);
    this.logger.debug(`[Sitemaps] Checking robots.txt and default sitemaps for origin: ${origin}`);

    const robots = await this.fetchText(`${origin}/robots.txt`);
    if (robots) {
      this.logger.debug(`[Sitemaps] Successfully fetched robots.txt from ${origin}/robots.txt`);
      for (const match of robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)) {
        queue.add(match[1]);
        this.logger.debug(`[Sitemaps] Sitemap discovered via robots.txt: ${match[1]}`);
      }
    } else {
      this.logger.debug(`[Sitemaps] robots.txt not found or inaccessible at ${origin}/robots.txt`);
    }

    const pending = Array.from(queue);
    const seen = new Set<string>();

    while (pending.length && seen.size < MAX_SITEMAP_FILES && state.links.size < MAX_SITEMAP_URLS) {
      const sitemapUrl = pending.shift()!;
      if (seen.has(sitemapUrl)) continue;
      seen.add(sitemapUrl);

      this.logger.debug(`[Sitemaps] Downloading and processing sitemap: ${sitemapUrl}`);
      const xml = await this.fetchText(sitemapUrl);
      if (!xml) {
        this.logger.debug(`[Sitemaps] Failed to retrieve sitemap content: ${sitemapUrl}`);
        continue;
      }

      let addedCount = 0;
      for (const match of xml.matchAll(LOC_REGEX)) {
        const loc = decodeXml(match[1]);
        if (/\.xml(\.gz)?(\?.*)?\$/i.test(loc)) {
          pending.push(loc); // sitemap index -> child sitemap
          this.logger.debug(`[Sitemaps] Child sitemap discovered: ${loc}`);
        } else if (state.links.size < MAX_SITEMAP_URLS) {
          state.links.add(loc);
          addedCount++;
        }
      }
      this.logger.debug(
        `[Sitemaps] Extracted ${addedCount} links from sitemap ${sitemapUrl}. Current total: ${state.links.size}`,
      );
      await sleep(randomBetween(300, 800));
    }
  }

  private async fetchText(url: string): Promise<string | null> {
    try {
      this.logger.debug(`[FetchText] Sending HTTP GET request to: ${url}`);
      const res = await fetch(url, {
        headers: FETCH_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.debug(
          `[FetchText] Non-OK response (${res.status} ${res.statusText}) for ${url}`,
        );
        return null;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
      this.logger.debug(
        `[FetchText] Successfully fetched ${url} (Size: ${buffer.length} bytes, Gzip: ${isGzip})`,
      );
      return (isGzip ? gunzipSync(buffer) : buffer).toString('utf8');
    } catch (error) {
      this.logger.debug(
        `[FetchText] Error requesting ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Layer 2: HTTP (Cheerio)
  // -------------------------------------------------------------------------
  private async runHttpTier(
    baseUrl: string,
    state: CrawlState,
    proxyConfiguration?: ProxyConfiguration,
  ): Promise<void> {
    const crawler = new CheerioCrawler(
      {
        proxyConfiguration,
        maxCrawlDepth: 1,
        maxRequestsPerCrawl: MAX_PAGES_PER_TIER,
        maxConcurrency: 2,
        maxRequestsPerMinute: 30,
        maxRequestRetries: 3,
        useSessionPool: true,
        persistCookiesPerSession: true,
        sessionPoolOptions: { maxPoolSize: 10, sessionOptions: { maxUsageCount: 5 } },

        requestHandler: async ({ $, request, session, enqueueLinks }) => {
          const title = $('title').first().text();
          const text = $('body').text().replace(/\s+/g, ' ').slice(0, 3000);
          const hasWidget =
            $('iframe[src*="captcha" i], .g-recaptcha, .h-captcha, #challenge-form').length > 0;

          // 200 response with a challenge page: burn the session and try another one
          if (looksLikeChallenge(title, text, hasWidget)) {
            session?.retire();
            throw new Error(`Challenge/WAF detected (HTTP) at ${request.url}`);
          }

          const pageUrl = request.loadedUrl ?? request.url;
          if (request.url === baseUrl) state.finalBase = pageUrl;

          $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            try {
              state.links.add(new URL(href, pageUrl).href);
            } catch {
              /* invalid href */
            }
          });

          await enqueueLinks({ strategy: 'same-domain', exclude: ENQUEUE_EXCLUDE });
        },

        failedRequestHandler: async ({ request }, error) => {
          if (request.url === baseUrl) state.baseFailed = true;
          this.logger.warn(`[http] Final failure for ${request.url}: ${error.message}`);
        },
      },
      this.createConfig(),
    );

    await this.runAndTeardown(crawler, baseUrl, 'http');
  }
  // -------------------------------------------------------------------------
  // Layer 3: Playwright
  // -------------------------------------------------------------------------
  private async runBrowserTier(
    baseUrl: string,
    state: CrawlState,
    proxyConfiguration?: ProxyConfiguration,
  ): Promise<void> {
    this.logger.debug(`[Browser Tier] Configuring PlaywrightCrawler for ${baseUrl}`);
    const crawler = new PlaywrightCrawler(
      {
        proxyConfiguration,
        headless: true,
        maxCrawlDepth: 1,
        maxRequestsPerCrawl: MAX_PAGES_PER_TIER,
        maxConcurrency: 1, // low and steady seems more human
        maxRequestsPerMinute: 20,
        maxRequestRetries: 4,
        navigationTimeoutSecs: 45,
        requestHandlerTimeoutSecs: 90,

        // Each session = IP + fingerprint + cookies. Run frequently.
        useSessionPool: true,
        persistCookiesPerSession: true,
        sessionPoolOptions: { maxPoolSize: 10, sessionOptions: { maxUsageCount: 3 } },

        browserPoolOptions: {
          useFingerprints: true,
          fingerprintOptions: {
            fingerprintGeneratorOptions: {
              browsers: ['chrome'],
              devices: ['desktop'],
              operatingSystems: ['windows', 'macos'],
              locales: ['pt-PT', 'en-US'],
            },
          },
        },

        launchContext: {
          useIncognitoPages: true,
          launchOptions: {
            ...(process.env.SCRAPER_CHROME_CHANNEL
              ? { channel: process.env.SCRAPER_CHROME_CHANNEL }
              : {}),
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-blink-features=AutomationControlled',
            ],
          },
        },

        preNavigationHooks: [
          async ({ page }, gotoOptions) => {
            if (gotoOptions) gotoOptions.waitUntil = 'domcontentloaded';

            if (BLOCK_HEAVY_RESOURCES) {
              await page.route('**/*', (route) => {
                const type = route.request().resourceType();
                return type === 'image' || type === 'media' || type === 'font'
                  ? route.abort()
                  : route.continue();
              });
            }
            await sleep(randomBetween(300, 1200)); // jitter between navigations
          },
        ],

        requestHandler: async ({ page, request, session, enqueueLinks, log }) => {
          log.info(`[browser] ${request.url}`);

          // JS challenges (e.g. "Just a moment...") resolve themselves in a few seconds
          await this.settleChallenge(page);

          if (await this.pageLooksBlocked(page)) {
            session?.retire(); // next attempt with another IP/fingerprint/cookies
            throw new Error(`Blocking/WAF detected (browser) at ${request.url}`);
          }

          await this.humanize(page);

          if (request.url === baseUrl) state.finalBase = request.loadedUrl ?? request.url;

          // .href already returns the absolute resolved URL from the browser
          const hrefs = await page.$$eval('a[href]', (els) =>
            els.map((el) => (el as HTMLAnchorElement).href),
          );
          hrefs.forEach((href) => state.links.add(href));

          await enqueueLinks({ strategy: 'same-domain', exclude: ENQUEUE_EXCLUDE });
        },

        failedRequestHandler: async ({ request }, error) => {
          if (request.url === baseUrl) state.baseFailed = true;
          this.logger.warn(`[browser] Final failure for ${request.url}: ${error.message}`);
        },
      },
      this.createConfig(),
    );

    await this.runAndTeardown(crawler, baseUrl, 'browser');
  }

  // -------------------------------------------------------------------------
  // Block detection / behavior
  // -------------------------------------------------------------------------
  private async pageLooksBlocked(page: Page): Promise<boolean> {
    const { title, text, hasWidget } = await page.evaluate(() => ({
      title: document.title ?? '',
      text: (document.body?.innerText ?? '').slice(0, 3000),
      hasWidget: !!document.querySelector(
        'iframe[src*="captcha" i], iframe[src*="challenge" i], .g-recaptcha, .h-captcha, #challenge-form, #cf-challenge-running',
      ),
    }));
    const blocked = looksLikeChallenge(title, text, hasWidget);
    if (blocked) {
      this.logger.debug(
        `[Security Check] Page identified as blocked/challenge. Title: "${title}", Widget detected: ${hasWidget}`,
      );
    }
    return blocked;
  }

  private async settleChallenge(page: Page, timeoutMs = 12_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    this.logger.debug(
      `[Settle Challenge] Waiting for challenge resolution (timeout: ${timeoutMs}ms)...`,
    );
    let attempts = 0;
    while (Date.now() < deadline) {
      attempts++;
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 5_000 });
        if (!(await this.pageLooksBlocked(page))) {
          this.logger.debug(
            `[Settle Challenge] Challenge successfully resolved after ${attempts} attempt(s).`,
          );
          return;
        }
      } catch {
        this.logger.debug(
          `[Settle Challenge] Navigation detected while waiting (attempt ${attempts}).`,
        );
      }
      await sleep(1_000);
    }
    this.logger.debug(
      `[Settle Challenge] Timeout reached (${timeoutMs}ms) without fully resolving the challenge.`,
    );
  }

  private async humanize(page: Page): Promise<void> {
    try {
      this.logger.debug(`[Humanize] Simulating human-like mouse movements and scrolling...`);
      await page.mouse.move(randomBetween(80, 700), randomBetween(80, 500), {
        steps: randomBetween(6, 14),
      });
      await page.mouse.wheel(0, randomBetween(300, 900)); // triggers lazy menus/lists
      await sleep(randomBetween(400, 1200));
    } catch {
      /* not critical */
    }
  }

  // -------------------------------------------------------------------------
  // Infrastructure
  // -------------------------------------------------------------------------
  /** Storage isolated per run to avoid global concurrency. */
  private createConfig(): Configuration {
    return new Configuration({
      storageClient: new MemoryStorage({ persistStorage: false }),
      persistStorage: false,
      purgeOnStart: true,
    });
  }

  /**
   * Rotating proxies via env: SCRAPER_PROXY_URLS="http://user:pass@host:port,http://..."
   * For aggressive WAFs, residential proxies matter more than any fingerprinting trick.
   */
  private buildProxyConfiguration(): ProxyConfiguration | undefined {
    const proxyUrls = (process.env.SCRAPER_PROXY_URLS ?? '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    if (proxyUrls.length > 0) {
      this.logger.debug(
        `[Proxy] Proxy configuration enabled with ${proxyUrls.length} endpoint(s) configured.`,
      );
    } else {
      this.logger.debug(
        `[Proxy] No proxy configured (SCRAPER_PROXY_URLS is empty). Using a direct connection.`,
      );
    }

    return proxyUrls.length ? new ProxyConfiguration({ proxyUrls }) : undefined;
  }

  private async runAndTeardown(
    crawler: CheerioCrawler | PlaywrightCrawler,
    baseUrl: string,
    tier: string,
  ): Promise<void> {
    try {
      this.logger.log(`[${tier}] Starting crawl: ${baseUrl}`);
      await crawler.run([baseUrl]);
      this.logger.debug(`[${tier}] Crawler completed successfully for ${baseUrl}`);
    } finally {
      await crawler
        .teardown()
        .then(() => this.logger.debug(`[${tier}] Crawler teardown completed successfully.`))
        .catch((e) => this.logger.warn(`[${tier}] Error during crawler teardown: ${e}`));
    }
  }

  /** A layer that fails should not prevent escalation to the next one. */
  private async safely(label: string, fn: () => Promise<void>): Promise<void> {
    try {
      this.logger.debug(`[Safely] Executing safe layer/method: "${label}"`);
      await fn();
      this.logger.debug(`[Safely] Layer "${label}" completed without unhandled exceptions.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Layer "${label}" failed: ${message}`);
    }
  }
}
