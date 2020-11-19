import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CrawlDomain, CrawlPage } from "./crawler.entity";
import { readFileSync, writeFileSync } from "fs";
import Crawler from "simplecrawler";
import puppeteer from "puppeteer";

@Injectable()
export class CrawlerService {
  private isCrawling: boolean;

  constructor(
    @InjectRepository(CrawlDomain)
    private readonly crawlDomainRepository: Repository<CrawlDomain>,
    private readonly connection: Connection
  ) {
    this.isCrawling = false;
  }

  /*@Cron(CronExpression.EVERY_5_SECONDS)
  async nestCrawl(): Promise<void> {
    if (process.env.ID === undefined || process.env.ID === "0") {
      if (!this.isCrawling) {
        this.isCrawling = true;

        const queryRunner = this.connection.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const domain = await queryRunner.manager.query(
            `SELECT * FROM CrawlDomain WHERE UserId = -1 AND Done = 0 ORDER BY Creation_Date ASC LIMIT 1`
          );
          if (domain.length > 0) {
            const urls = await this.crawl(domain[0].DomainUri);

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

        this.isCrawling = false;
      }
    }
  }*/

  private async crawl(url: string): Promise<string[]> {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();

    let urls = new Array<string>();

    try {
      await page.goto(url, {
        timeout: 0,
        waitUntil: ["networkidle2", "domcontentloaded"],
      });

      urls = await page.evaluate((url) => {
        const notHtml = "css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|php|json|pptx|txt".split(
          "|"
        );

        const links = document.querySelectorAll("body a");

        const urls = new Array();

        for (const link of links || []) {
          if (link.hasAttribute("href")) {
            const href = link.getAttribute("href");

            if (
              href &&
              href.trim() &&
              (href.startsWith(url) ||
                href.startsWith("/") ||
                href.startsWith("./") ||
                (!href.startsWith("http") && !href.startsWith("#")))
            ) {
              let valid = true;
              for (const not of notHtml || []) {
                if (href.endsWith(not)) {
                  valid = false;
                  break;
                }
                const parts = href.split("/");
                if (parts.length > 0) {
                  const lastPart = parts[parts.length - 1];
                  if (
                    lastPart.startsWith("#") ||
                    lastPart.startsWith("javascript:") ||
                    lastPart.startsWith("tel:") ||
                    lastPart.startsWith("mailto:")
                  ) {
                    valid = false;
                    break;
                  }
                }
              }

              if (valid) {
                try {
                  let correctUrl = "";
                  if (href.startsWith(url)) {
                    correctUrl = href;
                  } else if (href.startsWith("./")) {
                    correctUrl = url + href.slice(1);
                  } else if (!href.startsWith("/")) {
                    correctUrl = url + "/" + href;
                  } else {
                    correctUrl = url + href;
                  }
                  const parsedUrl = new URL(correctUrl);
                  if (parsedUrl.hash.trim() === "") {
                    urls.push(correctUrl);
                  }
                } catch (err) {}
              }
            }
          }
        }

        return urls;
      }, url);
    } catch (err) {
      //console.error("err", typeof err);
    }

    await page.close();
    await browser.close();

    const unique = urls.filter((v, i, self) => {
      return self.indexOf(v) === i;
    });

    const normalizedUrls = unique.map((u) => {
      if (u.startsWith(url)) {
        return u;
      } else {
        return url + u;
      }
    });

    return normalizedUrls;
  }

  private crawler(
    domain: string,
    max_depth: number,
    max_pages: number,
    crawl_domain_id: number
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    return new Promise(async (resolve, reject) => {
      const crawler = Crawler(domain);
      let urlList = [];
      let pageNumber = 0;
      let emit = false;

      crawler.on("fetchcomplete", async (r, q) => {
        let contentType = r["stateData"]["contentType"];
        if (
          (contentType.includes("text/html") ||
            contentType.includes("image/svg+xml")) &&
          (pageNumber <= max_pages || max_pages === 0)
        ) {
          urlList.push(r["url"]);
          urlList = urlList.filter(
            (url: string, index: number, self: any) =>
              self.indexOf(url) === index
          );
          pageNumber = urlList.length;
        }

        if (pageNumber >= max_pages && max_pages !== 0 && !emit) {
          emit = true;
          crawler.emit("complete");
        }
      });

      crawler.on("complete", async function () {
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
          await queryRunner.manager.query(
            `UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`,
            [crawl_domain_id]
          );

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

  async crawlDomain(
    userId: number,
    subDomain: string,
    domain: string,
    domainId: number,
    maxDepth: number,
    maxPages: number
  ): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const newCrawlDomain = new CrawlDomain();
      newCrawlDomain.UserId = userId;
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
