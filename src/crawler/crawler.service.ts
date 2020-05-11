import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NestCrawlerService } from 'nest-crawler';
import { CrawlDomain, CrawlPage } from './crawler.entity';
import { readFileSync, writeFileSync } from 'fs';
import Crawler from 'simplecrawler';
import puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {

  private isCrawling: boolean;
  private browser: puppeteer.Browser;

  constructor(
    @InjectRepository(CrawlDomain)
    private readonly crawlDomainRepository: Repository<CrawlDomain>,
    @InjectRepository(CrawlPage)
    private readonly crawlPageRepository: Repository<CrawlPage>,
    private readonly newCrawler: NestCrawlerService,
    private readonly connection: Connection
  ) {
    this.isCrawling = false;

    puppeteer.launch().then(browser => {
      this.browser = browser;
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async nestCrawl(): Promise<void> {
    if (process.env.NAMESPACE !== 'AMP' && process.env.NODE_APP_INSTANCE === '0') {
      if (!this.isCrawling) {
        this.isCrawling = true;

        const queryRunner = this.connection.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const domain = await queryRunner.manager.query(`SELECT * FROM CrawlDomain WHERE Done = 0 ORDER BY Creation_Date ASC LIMIT 1`);
          if (domain.length > 0) {
            const urls = await this.crawl(domain[0].DomainUri);

            for (const url of urls || []) {
              const newCrawlPage = new CrawlPage();
              newCrawlPage.Uri = url;
              newCrawlPage.CrawlDomainId = domain[0].CrawlDomainId;
              await queryRunner.manager.save(newCrawlPage);
            }

            await queryRunner.manager.query(`UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`, [domain[0].CrawlDomainId]);
          }
          await queryRunner.commitTransaction();
        } catch (err) {
          // since we have errors lets rollback the changes we made
          await queryRunner.rollbackTransaction();
          console.error(err);
        } finally {
          // you need to release a queryRunner which was manually instantiated
          await queryRunner.release();
        }

        this.isCrawling = false;
      }
    }
  }

  private async crawl(url: string): Promise<string[]> {
    const page = await this.browser.newPage();

    await page.goto(url, {
      timeout: 0,
      waitUntil: ['networkidle2', 'domcontentloaded']
    });

    const urls = await page.evaluate((url) => {
      const notHtml = "css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|php|json".split('|');

      const links = document.querySelectorAll('body a');

      const urls = new Array();

      for (const link of links || []) {
        if (link.hasAttribute('href')) {
          const href = link.getAttribute('href');

          if (href && href.trim() && (href.startsWith(url) || href.startsWith('/'))) {
            let valid = true;
            for (const not of notHtml || []) {
              if (href.endsWith(not)) {
                valid = false;
                break;
              }
            }

            if (valid) {
              try {
                if (href.startsWith(url)) {
                  const parsedUrl = new URL(href);
                  if (!parsedUrl.hash.trim()) {
                    urls.push(href);
                  }
                } else {
                  const parsedUrl = new URL(url + href);
                  if (!parsedUrl.hash.trim()) {
                    urls.push(href);
                  }
                }
              } catch (err) {

              }
            }
          }
        }
      }

      return urls;
    }, url);

    const unique = urls.filter((v, i, self) => {
      return self.indexOf(v) === i;
    });

    const normalizedUrls = unique.map(u => {
      if (u.startsWith(url)) {
        return u;
      } else {
        return url + u;
      }
    });

    return normalizedUrls;
  }

  private crawler(domain: string, max_depth: number, max_pages: number, crawl_domain_id: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    return new Promise(async (resolve, reject) => {
      const crawler = Crawler(domain);
      let urlList = [];
      let pageNumber = 0;
      let emit = false;
  
      crawler.on('fetchcomplete', async (r, q) => {
        let contentType = r['stateData']['contentType'];
        if ((contentType.includes('text/html') || contentType.includes('image/svg+xml')) && (pageNumber <= max_pages || max_pages === 0)) {
          urlList.push(r['url']);
          urlList = urlList.filter((url: string, index: number, self: any) => self.indexOf(url) === index);
          pageNumber = urlList.length;
        }
  
        if (pageNumber >= max_pages && max_pages !== 0 && !emit) {
          emit = true;
          crawler.emit('complete');
        }
      });
  
      crawler.on('complete', async function () {
        crawler.stop();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let hasError = false;
        try {
          
          for (const page of urlList || []) {
            const newCrawlPage = new CrawlPage();
            newCrawlPage.Uri = page;
            newCrawlPage.CrawlDomainId = crawl_domain_id;
            await queryRunner.manager.save(newCrawlPage);
          }
          await queryRunner.manager.query(`UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`, [crawl_domain_id]);

          await queryRunner.commitTransaction();
        } catch (err) {
          // since we have errors lets rollback the changes we made
          await queryRunner.rollbackTransaction();
          hasError = true;
        } finally {
          // you need to release a queryRunner which was manually instantiated
          await queryRunner.release();
        }

        if (hasError) {
          reject();
        } else {
          resolve(urlList);
        }
      });
      crawler.nextConcurrency = 25;
      crawler.interval = 0.1;
      crawler.maxDepth = max_depth + 1;
      crawler.start();
    });
  }

  findAll(): Promise<any> {
    return this.crawlDomainRepository.find();
  }
  
  getConfig(): any {
    const content = readFileSync(__dirname + '/../../public/crawlerConfig.json');
    const config = JSON.parse(content.toString());
    return config;
  }

  setConfig(maxDepth: number, maxPages: number): any {
    writeFileSync(__dirname + '/../../public/crawlerConfig.json', JSON.stringify({ maxDepth, maxPages }, null, 2));
    return true;
  }

  async isCrawlSubDomainDone(subDomain: string): Promise<any> {
    const page = await this.crawlDomainRepository.findOne({ where: { SubDomainUri: subDomain }});

    return page ? page.Done === 1 ? 2 : 1 : 0;
  }

  async crawlDomain(subDomain: string, domain: string, domainId: number, maxDepth: number, maxPages: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const newCrawlDomain = new CrawlDomain();
      newCrawlDomain.DomainUri = domain;
      newCrawlDomain.DomainId = domainId;
      newCrawlDomain.Creation_Date = new Date();
      newCrawlDomain.SubDomainUri = subDomain;

      const insertCrawlDomain = await queryRunner.manager.save(newCrawlDomain);
      //this.crawler(subDomain, maxDepth, maxPages, insertCrawlDomain.CrawlDomainId);

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    if (hasError) {
      throw new InternalServerErrorException();
    }

    return true;
  }

  async getCrawlResultsCrawlDomainID(crawlDomainID: number): Promise<any> {
    const manager = getManager();
    
    const pages = await manager.query(`SELECT cp.Uri,cp.CrawlId,cd.Creation_Date
      FROM CrawlPage as cp,
      CrawlDomain as cd
      WHERE cd.CrawlDomainId = ? AND cp.CrawlDomainId = cd.CrawlDomainId`, [crawlDomainID]);

    return pages;
  }

  async delete(crawlDomainId: number): Promise<any> {
    await this.crawlDomainRepository.delete({ CrawlDomainId: crawlDomainId });
    return true;
  }
}
