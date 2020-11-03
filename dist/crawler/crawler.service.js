"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const crawler_entity_1 = require("./crawler.entity");
const fs_1 = require("fs");
const simplecrawler_1 = __importDefault(require("simplecrawler"));
const puppeteer_1 = __importDefault(require("puppeteer"));
let CrawlerService = class CrawlerService {
    constructor(crawlDomainRepository, connection) {
        this.crawlDomainRepository = crawlDomainRepository;
        this.connection = connection;
        this.isCrawling = false;
    }
    async nestCrawlUser() {
        if ((process.env.ID === undefined && process.env.NAMESPACE === undefined) || (process.env.ID === '0' && process.env.NAMESPACE === 'GLOBAL')) {
            if (!this.isCrawling) {
                this.isCrawling = true;
                const queryRunner = this.connection.createQueryRunner();
                try {
                    await queryRunner.connect();
                    await queryRunner.startTransaction();
                    const domain = await queryRunner.manager.query(`SELECT * FROM CrawlDomain WHERE UserId != -1 AND Done = 0 ORDER BY Creation_Date ASC LIMIT 1`);
                    if (domain.length > 0) {
                        try {
                            const urls = await this.crawl(domain[0].DomainUri);
                            for (const url of urls || []) {
                                const newCrawlPage = new crawler_entity_1.CrawlPage();
                                newCrawlPage.Uri = url;
                                newCrawlPage.CrawlDomainId = domain[0].CrawlDomainId;
                                await queryRunner.manager.save(newCrawlPage);
                            }
                            await queryRunner.manager.query(`UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`, [domain[0].CrawlDomainId]);
                        }
                        catch (e) {
                            await queryRunner.manager.query(`DELETE FROM CrawlDomain WHERE CrawlDomainId = ?`, [domain[0].CrawlDomainId]);
                            console.error(e);
                        }
                    }
                    await queryRunner.commitTransaction();
                }
                catch (err) {
                    await queryRunner.rollbackTransaction();
                    console.error(err);
                }
                finally {
                    await queryRunner.release();
                }
                this.isCrawling = false;
            }
        }
    }
    async crawl(url) {
        const browser = await puppeteer_1.default.launch();
        const page = await browser.newPage();
        await page.goto(url, {
            timeout: 0,
            waitUntil: ['networkidle2', 'domcontentloaded']
        });
        const urls = await page.evaluate((url) => {
            const notHtml = 'css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|php|json|pptx|txt'.split('|');
            const links = document.querySelectorAll('body a');
            const urls = new Array();
            for (const link of links || []) {
                if (link.hasAttribute('href')) {
                    const href = link.getAttribute('href');
                    if (href && href.trim() && (href.startsWith(url) || href.startsWith('/') || href.startsWith('./') || (!href.startsWith('http') && !href.startsWith('#')))) {
                        let valid = true;
                        for (const not of notHtml || []) {
                            if (href.endsWith(not)) {
                                valid = false;
                                break;
                            }
                            const parts = href.split('/');
                            if (parts.length > 0) {
                                const lastPart = parts[parts.length - 1];
                                if (lastPart.startsWith('#') || lastPart.startsWith('javascript:') || lastPart.startsWith('tel:') || lastPart.startsWith('mailto:')) {
                                    valid = false;
                                    break;
                                }
                            }
                        }
                        if (valid) {
                            try {
                                let correctUrl = '';
                                if (href.startsWith(url)) {
                                    correctUrl = href;
                                }
                                else if (href.startsWith('./')) {
                                    correctUrl = url + href.slice(1);
                                }
                                else if (!href.startsWith('/')) {
                                    correctUrl = url + '/' + href;
                                }
                                else {
                                    correctUrl = url + href;
                                }
                                const parsedUrl = new URL(correctUrl);
                                if (parsedUrl.hash.trim() === '') {
                                    urls.push(correctUrl);
                                }
                            }
                            catch (err) {
                            }
                        }
                    }
                }
            }
            return urls;
        }, url);
        await page.close();
        await browser.close();
        const unique = urls.filter((v, i, self) => {
            return self.indexOf(v) === i;
        });
        const normalizedUrls = unique.map(u => {
            if (u.startsWith(url)) {
                return u;
            }
            else {
                return url + u;
            }
        });
        return normalizedUrls;
    }
    crawler(domain, max_depth, max_pages, crawl_domain_id) {
        const queryRunner = this.connection.createQueryRunner();
        return new Promise(async (resolve, reject) => {
            const crawler = simplecrawler_1.default(domain);
            let urlList = [];
            let pageNumber = 0;
            let emit = false;
            crawler.on('fetchcomplete', async (r, q) => {
                let contentType = r['stateData']['contentType'];
                if ((contentType.includes('text/html') || contentType.includes('image/svg+xml')) && (pageNumber <= max_pages || max_pages === 0)) {
                    urlList.push(r['url']);
                    urlList = urlList.filter((url, index, self) => self.indexOf(url) === index);
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
                        const newCrawlPage = new crawler_entity_1.CrawlPage();
                        newCrawlPage.Uri = page;
                        newCrawlPage.CrawlDomainId = crawl_domain_id;
                        await queryRunner.manager.save(newCrawlPage);
                    }
                    await queryRunner.manager.query(`UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = ?`, [crawl_domain_id]);
                    await queryRunner.commitTransaction();
                }
                catch (err) {
                    await queryRunner.rollbackTransaction();
                    hasError = true;
                }
                finally {
                    await queryRunner.release();
                }
                if (hasError) {
                    reject();
                }
                else {
                    resolve(urlList);
                }
            });
            crawler.nextConcurrency = 25;
            crawler.interval = 0.1;
            crawler.maxDepth = max_depth + 1;
            crawler.start();
        });
    }
    findAll() {
        return this.crawlDomainRepository.find({ where: { UserId: -1 } });
    }
    getConfig() {
        const content = fs_1.readFileSync(__dirname + '/../../public/crawlerConfig.json');
        const config = JSON.parse(content.toString());
        return config;
    }
    setConfig(maxDepth, maxPages) {
        fs_1.writeFileSync(__dirname + '/../../public/crawlerConfig.json', JSON.stringify({ maxDepth, maxPages }, null, 2));
        return true;
    }
    async isCrawlSubDomainDone(subDomain) {
        const page = await this.crawlDomainRepository.findOne({ where: { UserId: -1, SubDomainUri: subDomain } });
        return page ? page.Done === 1 ? 2 : 1 : 0;
    }
    async isUserCrawlerDone(userId, domainId) {
        const page = await this.crawlDomainRepository.findOne({ where: { UserId: userId, DomainId: domainId } });
        if (page) {
            return page.Done === 1;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async getUserCrawlResults(userId, domainId) {
        const manager = typeorm_2.getManager();
        const pages = await manager.query(`
      SELECT
        cp.*
      FROM
        CrawlDomain as cd,
        CrawlPage as cp
      WHERE
        cd.UserId = ? AND
        cd.DomainId = ? AND
        cp.CrawlDomainId = cd.CrawlDomainId
    `, [userId, domainId]);
        return pages;
    }
    async getUserTagWebsitesCrawlResults(userId, tagName) {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`
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
    `, [tagName, userId, userId]);
        return websites;
    }
    async deleteUserCrawler(userId, domainId) {
        try {
            await this.crawlDomainRepository.delete({ UserId: userId, DomainId: domainId });
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async crawlDomain(userId, subDomain, domain, domainId, maxDepth, maxPages) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const newCrawlDomain = new crawler_entity_1.CrawlDomain();
            newCrawlDomain.UserId = userId;
            newCrawlDomain.DomainUri = domain;
            newCrawlDomain.DomainId = domainId;
            newCrawlDomain.Creation_Date = new Date();
            newCrawlDomain.SubDomainUri = subDomain;
            const insertCrawlDomain = await queryRunner.manager.save(newCrawlDomain);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        if (hasError) {
            throw new common_1.InternalServerErrorException();
        }
        return true;
    }
    async getCrawlResultsCrawlDomainID(crawlDomainID) {
        const manager = typeorm_2.getManager();
        const pages = await manager.query(`SELECT cp.Uri,cp.CrawlId,cd.Creation_Date
      FROM CrawlPage as cp,
      CrawlDomain as cd
      WHERE cd.CrawlDomainId = ? AND cd.UserId = -1 AND cp.CrawlDomainId = cd.CrawlDomainId`, [crawlDomainID]);
        return pages;
    }
    async delete(crawlDomainId) {
        try {
            await this.crawlDomainRepository.delete({ CrawlDomainId: crawlDomainId });
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async getDomainId(userId, domain) {
        const manager = typeorm_2.getManager();
        const _domain = await manager.query(`
      SELECT d.DomainId
      FROM
        Domain as d,
        Website as w
      WHERE
        d.Url = ? AND
        d.WebsiteId = w.WebsiteId AND
        w.UserId = ?
      LIMIT 1
    `, [domain, userId]);
        return _domain[0].DomainId;
    }
};
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerService.prototype, "nestCrawlUser", null);
CrawlerService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(crawler_entity_1.CrawlDomain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], CrawlerService);
exports.CrawlerService = CrawlerService;
//# sourceMappingURL=crawler.service.js.map