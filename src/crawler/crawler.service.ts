import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { NestCrawlerService } from 'nest-crawler';
import { CrawlDomain, CrawlPage } from './crawler.entity';
import { readFileSync, writeFileSync } from 'fs';
import Crawler from 'simplecrawler';

@Injectable()
export class CrawlerService {

  constructor(
    @InjectRepository(CrawlDomain)
    private readonly crawlDomainRepository: Repository<CrawlDomain>,
    @InjectRepository(CrawlPage)
    private readonly crawlPageRepository: Repository<CrawlPage>,
    private readonly newCrawler: NestCrawlerService,
    private readonly connection: Connection
  ) {}

  public crawl(url: string): void{
    const urls = new Array<string>();

    this.newCrawler.fetch({
      target: {
        url,
        iterator: {
          selector: 'a',
          convert: (x: string) => {
            x = decodeURIComponent(x);
            if (!x.startsWith('#')) {
              if (x !== url && url.startsWith(x) && !urls.includes(x)) {
                console.log(x);
                urls.push(x);
                return `${x}`;
              } else if (x.startsWith('/') && !urls.includes(`${url}${x}`)) {
                console.log(x);
                urls.push(`${url}${x}`);
                return `${url}${x}`;
              }
            }

            return x;
          },
        },
      },
      fetch: (data: any, index: number, url: string) => ({
        title: '.title > a',
      })
    }).then(pages => {
      console.log(pages);
      console.log(urls);
    });
  }

  private crawler(domain: string, max_depth: number, max_pages: number, crawl_domain_id: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    return new Promise(async (resolve, reject) => {
      const crawler = Crawler('http://' + domain);
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
      this.crawler(subDomain, maxDepth, maxPages, insertCrawlDomain.CrawlDomainId);

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
