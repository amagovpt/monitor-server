import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager, In } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CrawlDomain, CrawlPage } from "./crawler.entity";
import { readFileSync, writeFileSync } from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PageService } from "src/page/page.service";
import { Crawler } from "@qualweb/crawler";

@Injectable()
export class CrawlerService {
  private isAdminCrawling: boolean;
  private isUserCrawling: boolean;

  constructor(
    @InjectRepository(CrawlDomain)
    private readonly crawlDomainRepository: Repository<CrawlDomain>,
    private readonly connection: Connection,
    private readonly pageService: PageService
  ) {
    this.isAdminCrawling = false;
    this.isUserCrawling = false;
    puppeteer.use(StealthPlugin());
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async nestAdminCrawl(): Promise<void> {
    if (
      process.env.ID === undefined ||
      (process.env.NAMESPACE === "ADMIN" && process.env.ID === "0")
    ) {
      if (!this.isAdminCrawling) {
        this.isAdminCrawling = true;

        const queryRunner = this.connection.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const domain = await queryRunner.manager.query(
            `SELECT * FROM CrawlDomain WHERE UserId = -1 AND Done = 0 ORDER BY Creation_Date ASC LIMIT 1`
          );
          if (domain.length > 0) {
            const browser = await puppeteer.launch({
              args: ["--no-sandbox", "--ignore-certificate-errors"],
            });
            const incognito = await browser.createIncognitoBrowserContext();
            const crawler = new Crawler(
              incognito,
              domain[0].DomainUri,
              undefined,
              domain[0].Wait_JS === 1 ? "networkidle0" : "domcontentloaded"
            );
            //await this.crawl(domain[0].DomainUri);

            await crawler.crawl({
              maxDepth: domain[0].Max_Depth,
              maxUrls: domain[0].Max_Pages ? domain[0].Max_Pages : undefined,
            });

            await incognito.close();
            await browser.close();

            const urls = crawler.getResults();
            if (domain[0].Tag !== 1) {
              for (const url of urls || []) {
                const newCrawlPage = new CrawlPage();
                newCrawlPage.Uri = url;
                newCrawlPage.CrawlDomainId = domain[0].CrawlDomainId;
                await queryRunner.manager.save(newCrawlPage);
              }

              await queryRunner.manager.query(
                `UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`,
                [domain[0].CrawlDomainId]
              );
            } else {
              await this.pageService.addPages(domain[0].DomainId, urls, urls);
              await queryRunner.manager.query(
                `DELETE FROM CrawlDomain WHERE CrawlDomainId = "?"`,
                [domain[0].CrawlDomainId]
              );
            }
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

        this.isAdminCrawling = false;
      }
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async nestUserCrawl(): Promise<void> {
    if (
      process.env.ID === undefined ||
      (process.env.NAMESPACE === "USER" && process.env.ID === "0")
    ) {
      if (!this.isUserCrawling) {
        this.isUserCrawling = true;

        const queryRunner = this.connection.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const domain = await queryRunner.manager.query(
            `SELECT * FROM CrawlDomain WHERE UserId <> -1 AND Done = 0 ORDER BY Creation_Date ASC LIMIT 1`
          );
          if (domain.length > 0) {
            const browser = await puppeteer.launch({
              args: ["--no-sandbox", "--ignore-certificate-errors"],
            });
            const incognito = await browser.createIncognitoBrowserContext();
            const crawler = new Crawler(
              incognito,
              domain[0].DomainUri,
              undefined,
              domain[0].Wait_JS === 1 ? "networkidle0" : "domcontentloaded"
            );
            //await this.crawl(domain[0].DomainUri);
            await crawler.crawl({ maxDepth: 0 });

            await incognito.close();
            await browser.close();

            const urls = crawler.getResults();
            for (const url of urls || []) {
              const newCrawlPage = new CrawlPage();
              newCrawlPage.Uri = url;
              newCrawlPage.CrawlDomainId = domain[0].CrawlDomainId;
              await queryRunner.manager.save(newCrawlPage);
            }

            await queryRunner.manager.query(
              `UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`,
              [domain[0].CrawlDomainId]
            );
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

        this.isUserCrawling = false;
      }
    }
  }

  findAll(): Promise<any> {
    return this.crawlDomainRepository.find({ where: { UserId: -1 } });
  }

  getConfig(): any {
    const content = readFileSync(
      __dirname + "/../../public/crawlerConfig.json"
    );
    const config = JSON.parse(content.toString());
    return config;
  }

  setConfig(maxDepth: number, maxPages: number): any {
    writeFileSync(
      __dirname + "/../../public/crawlerConfig.json",
      JSON.stringify({ maxDepth, maxPages }, null, 2)
    );
    return true;
  }

  async isCrawlSubDomainDone(subDomain: string): Promise<any> {
    const page = await this.crawlDomainRepository.findOne({
      where: { UserId: -1, SubDomainUri: subDomain },
    });

    return page ? (page.Done === 1 ? 2 : 1) : 0;
  }

  async isUserCrawlerDone(userId: number, domainId: number): Promise<boolean> {
    const page = await this.crawlDomainRepository.findOne({
      where: { UserId: userId, DomainId: domainId },
    });

    if (page) {
      return page.Done === 1;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async getUserCrawlResults(
    userId: number,
    domainId: number
  ): Promise<boolean> {
    const manager = getManager();

    const pages = await manager.query(
      `
      SELECT
        cp.*
      FROM
        CrawlDomain as cd,
        CrawlPage as cp
      WHERE
        cd.UserId = ? AND
        cd.DomainId = ? AND
        cp.CrawlDomainId = cd.CrawlDomainId
    `,
      [userId, domainId]
    );

    return pages;
  }

  async getUserTagWebsitesCrawlResults(
    userId: number,
    tagName: string
  ): Promise<any> {
    const manager = getManager();

    const websites = await manager.query(
      `
      SELECT
        w.Name,
        cd.Done,
        d.DomainId,
        d.Url
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        CrawlDomain as cd
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        cd.DomainId = d.DomainId AND
        cd.UserId = ?
    `,
      [tagName, userId, userId]
    );

    return websites;
  }

  async deleteUserCrawler(userId: number, domainId: number): Promise<boolean> {
    try {
      await this.crawlDomainRepository.delete({
        UserId: userId,
        DomainId: domainId,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async crawlTags(tagsId: number[]): Promise<boolean> {
    try {
      const domains = await getManager().query(
        `
        SELECT
          d.DomainId,
          d.Url 
        FROM  
          TagWebsite as tw,
          Domain as d
        WHERE
          tw.TagId IN (?) AND
          d.WebsiteId = tw.WebsiteId AND
          d.Active = 1`,
        [tagsId]
      );

      for (const domain of domains || []) {
        await this.crawlDomain(
          -1,
          [{ url: domain.Url, domainId: domain.DomainId }],
          0,
          0,
          0,
          1
        );
      }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async crawlDomain(
    userId: number,
    websites: any,
    maxDepth: number,
    maxPages: number,
    waitJS: number,
    tag: number
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      for (const website of websites ?? []) {
        const newCrawlDomain = new CrawlDomain();
        newCrawlDomain.UserId = userId;
        newCrawlDomain.DomainUri = website.url;
        newCrawlDomain.DomainId = website.domainId;
        newCrawlDomain.Max_Depth = maxDepth;
        newCrawlDomain.Max_Pages = maxPages;
        newCrawlDomain.Wait_JS = waitJS;
        newCrawlDomain.Creation_Date = new Date();
        newCrawlDomain.SubDomainUri = website.url;
        newCrawlDomain.Tag = tag;

        await queryRunner.manager.save(newCrawlDomain);
        //this.crawler(subDomain, maxDepth, maxPages, insertCrawlDomain.CrawlDomainId);
      }

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

    const pages = await manager.query(
      `SELECT cp.Uri,cp.CrawlId,cd.Creation_Date
      FROM CrawlPage as cp,
      CrawlDomain as cd
      WHERE cd.CrawlDomainId = ? AND cd.UserId = -1 AND cp.CrawlDomainId = cd.CrawlDomainId`,
      [crawlDomainID]
    );

    return pages;
  }

  async delete(crawlDomainId: number): Promise<any> {
    try {
      await this.crawlDomainRepository.delete({ CrawlDomainId: crawlDomainId });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async deleteBulk(crawlDomainIds: Array<number>): Promise<any> {
    try {
      await this.crawlDomainRepository.delete({
        CrawlDomainId: In(crawlDomainIds),
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getDomainId(userId: number, domain: string): Promise<number> {
    const manager = getManager();
    const _domain = await manager.query(
      `
      SELECT d.DomainId
      FROM
        Domain as d,
        Website as w
      WHERE
        d.Url = ? AND
        d.WebsiteId = w.WebsiteId AND
        w.UserId = ?
      LIMIT 1
    `,
      [domain, userId]
    );

    return _domain[0].DomainId;
  }
}
