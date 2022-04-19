import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager, In } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CrawlWebsite, CrawlPage } from "./crawler.entity";
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
    @InjectRepository(CrawlWebsite)
    private readonly crawlWebsiteRepository: Repository<CrawlWebsite>,
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
      process.env.NAMESPACE === undefined ||
      (process.env.NAMESPACE === "ADMIN" && process.env.AMSID === "0")
    ) {
      if (!this.isAdminCrawling) {
        this.isAdminCrawling = true;

        const queryRunner = this.connection.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const website = await queryRunner.manager.query(
            `SELECT * FROM CrawlWebsite WHERE UserId = -1 AND Done = 0 ORDER BY Creation_Date ASC LIMIT 1`
          );

          if (website.length > 0) {
            const browser = await puppeteer.launch({
              args: ["--no-sandbox", "--ignore-certificate-errors"],
            });
            const incognito = await browser.createIncognitoBrowserContext();
            const crawler = new Crawler(
              incognito,
              website[0].StartingUrl,
              undefined,
              website[0].Wait_JS === 1 ? "networkidle0" : "domcontentloaded"
            );

            await crawler.crawl({
              maxDepth: website[0].Max_Depth,
              maxUrls: website[0].Max_Pages ? website[0].Max_Pages : undefined,
            });

            await incognito.close();
            await browser.close();

            const urls = crawler.getResults();
            if (website[0].Tag !== 1) {
              for (const url of urls || []) {
                const newCrawlPage = new CrawlPage();
                newCrawlPage.Uri = decodeURIComponent(url);
                newCrawlPage.CrawlWebsiteId = website[0].CrawlWebsiteId;
                await queryRunner.manager.save(newCrawlPage);
              }

              await queryRunner.manager.query(
                `UPDATE CrawlWebsite SET Done = "1" WHERE CrawlWebsiteId = ?`,
                [website[0].CrawlWebsiteId]
              );
            } else {
              await this.pageService.addPages(website[0].WebsiteId, urls, urls);
              await queryRunner.manager.query(
                `DELETE FROM CrawlWebsite WHERE CrawlWebsiteId = "?"`,
                [website[0].CrawlWebsiteId]
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
      process.env.NAMESPACE === undefined ||
      (process.env.NAMESPACE === "USER" && process.env.USRID === "0")
    ) {
      if (!this.isUserCrawling) {
        this.isUserCrawling = true;

        const queryRunner = this.connection.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const website = await queryRunner.manager.query(
            `SELECT * FROM CrawlWebsite WHERE UserId <> -1 AND Done = 0 ORDER BY Creation_Date ASC LIMIT 1`
          );

          if (website.length > 0) {
            const browser = await puppeteer.launch({
              args: ["--no-sandbox", "--ignore-certificate-errors"],
            });
            const incognito = await browser.createIncognitoBrowserContext();
            const crawler = new Crawler(
              incognito,
              website[0].StartingUrl,
              undefined,
              website[0].Wait_JS === 1 ? "networkidle0" : "domcontentloaded"
            );
            //await this.crawl(website[0].StartingUrl);
            await crawler.crawl({ maxDepth: 0 });

            await incognito.close();
            await browser.close();

            const urls = crawler.getResults();
            for (const url of urls || []) {
              const newCrawlPage = new CrawlPage();
              newCrawlPage.Uri = decodeURIComponent(url);
              newCrawlPage.CrawlWebsiteId = website[0].CrawlWebsiteId;
              await queryRunner.manager.save(newCrawlPage);
            }

            await queryRunner.manager.query(
              `UPDATE CrawlWebsite SET Done = "1" WHERE CrawlWebsiteId = ?`,
              [website[0].CrawlWebsiteId]
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
    return this.crawlWebsiteRepository.find({ where: { UserId: -1 } });
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

  async isUserCrawlerDone(userId: number, websiteId: number): Promise<boolean> {
    const page = await this.crawlWebsiteRepository.findOne({
      where: { UserId: userId, WebsiteId: websiteId },
    });

    if (page) {
      return page.Done === 1;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async getUserCrawlResults(
    userId: number,
    websiteId: number
  ): Promise<boolean> {
    const manager = getManager();

    const pages = await manager.query(
      `
      SELECT
        cp.*
      FROM
        CrawlWebsite as cw,
        CrawlPage as cp
      WHERE
        cw.UserId = ? AND
        cw.WebsiteId = ? AND
        cp.CrawlWebsiteId = cw.CrawlWebsiteId
    `,
      [userId, websiteId]
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
        cw.Done,
        w.WebsiteId,
        w.StartingUrl
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        CrawlWebsite as cw
      WHERE
        t.Name = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        cw.WebsiteId = tw.WebsiteId AND
        cw.UserId = ?
    `,
      [tagName, userId, userId]
    );

    return websites;
  }

  async deleteUserCrawler(userId: number, websiteId: number): Promise<boolean> {
    try {
      await this.crawlWebsiteRepository.delete({
        UserId: userId,
        WebsiteId: websiteId,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async crawlTags(tagsId: number[]): Promise<boolean> {
    try {
      const websites = await getManager().query(
        `
        SELECT
          w.WebsiteId,
          w.StartingUrl 
        FROM  
          TagWebsite as tw,
          Website as w
        WHERE
          tw.TagId IN (?) AND
          w.WebsiteId = tw.WebsiteId`,
        [tagsId]
      );

      for (const website of websites || []) {
        await this.crawlWebsite(
          -1,
          [{ url: website.StartingUrl, websiteId: website.WebsiteId }],
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

  async crawlWebsite(
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
        const newCrawlWebsite = new CrawlWebsite();
        newCrawlWebsite.UserId = userId;
        newCrawlWebsite.StartingUrl = website.url;
        newCrawlWebsite.WebsiteId = website.websiteId;
        newCrawlWebsite.Max_Depth = maxDepth;
        newCrawlWebsite.Max_Pages = maxPages;
        newCrawlWebsite.Wait_JS = waitJS;
        newCrawlWebsite.Creation_Date = new Date();
        newCrawlWebsite.Tag = tag;

        await queryRunner.manager.save(newCrawlWebsite);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.error(err);
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

  async getCrawlResultsByCrawlWebsiteID(crawlWebsiteId: number): Promise<any> {
    const manager = getManager();

    const pages = await manager.query(
      `SELECT cp.Uri, cp.CrawlId, cw.Creation_Date
      FROM 
        CrawlPage as cp,
        CrawlWebsite as cw
      WHERE cw.CrawlWebsiteId = ? AND cw.UserId = -1 AND cp.CrawlWebsiteId = cw.CrawlWebsiteId`,
      [crawlWebsiteId]
    );

    return pages;
  }

  async delete(crawlWebsiteId: number): Promise<any> {
    try {
      await this.crawlWebsiteRepository.delete({
        CrawlWebsiteId: crawlWebsiteId,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async deleteBulk(crawlWebsiteIds: Array<number>): Promise<any> {
    try {
      await this.crawlWebsiteRepository.delete({
        CrawlWebsiteId: In(crawlWebsiteIds),
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getWebsiteId(userId: number, websiteUrl: string): Promise<number> {
    const manager = getManager();
    const website = await manager.query(
      `
      SELECT w.WebsiteId
      FROM
        Website as w
      WHERE
        w.StartingUrl = ? AND
        w.UserId = ?
      LIMIT 1
    `,
      [websiteUrl, userId]
    );

    return website[0].WebsiteId;
  }
}
