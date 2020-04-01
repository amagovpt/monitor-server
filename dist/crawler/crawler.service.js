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
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nest_crawler_1 = require("nest-crawler");
const crawler_entity_1 = require("./crawler.entity");
const fs_1 = require("fs");
const simplecrawler_1 = __importDefault(require("simplecrawler"));
let CrawlerService = class CrawlerService {
    constructor(crawlDomainRepository, crawlPageRepository, newCrawler, connection) {
        this.crawlDomainRepository = crawlDomainRepository;
        this.crawlPageRepository = crawlPageRepository;
        this.newCrawler = newCrawler;
        this.connection = connection;
    }
    crawl(url) {
        const urls = new Array();
        this.newCrawler.fetch({
            target: {
                url,
                iterator: {
                    selector: 'a',
                    convert: (x) => {
                        x = decodeURIComponent(x);
                        if (!x.startsWith('#')) {
                            if (x !== url && url.startsWith(x) && !urls.includes(x)) {
                                console.log(x);
                                urls.push(x);
                                return `${x}`;
                            }
                            else if (x.startsWith('/') && !urls.includes(`${url}${x}`)) {
                                console.log(x);
                                urls.push(`${url}${x}`);
                                return `${url}${x}`;
                            }
                        }
                        return x;
                    },
                },
            },
            fetch: (data, index, url) => ({
                title: '.title > a',
            })
        }).then(pages => {
            console.log(pages);
            console.log(urls);
        });
    }
    crawler(domain, max_depth, max_pages, crawl_domain_id) {
        const queryRunner = this.connection.createQueryRunner();
        return new Promise(async (resolve, reject) => {
            const crawler = simplecrawler_1.default('http://' + domain);
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
        return this.crawlDomainRepository.find();
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
        const page = await this.crawlDomainRepository.findOne({ where: { SubDomainUri: subDomain } });
        return page ? page.Done === 1 ? 2 : 1 : 0;
    }
    async crawlDomain(subDomain, domain, domainId, maxDepth, maxPages) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const newCrawlDomain = new crawler_entity_1.CrawlDomain();
            newCrawlDomain.DomainUri = domain;
            newCrawlDomain.DomainId = domainId;
            newCrawlDomain.Creation_Date = new Date();
            newCrawlDomain.SubDomainUri = subDomain;
            const insertCrawlDomain = await queryRunner.manager.save(newCrawlDomain);
            this.crawler(subDomain, maxDepth, maxPages, insertCrawlDomain.CrawlDomainId);
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
      WHERE cd.CrawlDomainId = ? AND cp.CrawlDomainId = cd.CrawlDomainId`, [crawlDomainID]);
        return pages;
    }
    async delete(crawlDomainId) {
        await this.crawlDomainRepository.delete({ CrawlDomainId: crawlDomainId });
        return true;
    }
};
CrawlerService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(crawler_entity_1.CrawlDomain)),
    __param(1, typeorm_1.InjectRepository(crawler_entity_1.CrawlPage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        nest_crawler_1.NestCrawlerService,
        typeorm_2.Connection])
], CrawlerService);
exports.CrawlerService = CrawlerService;
//# sourceMappingURL=crawler.service.js.map