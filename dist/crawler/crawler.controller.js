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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const crawler_service_1 = require("./crawler.service");
const response_1 = require("../lib/response");
let CrawlerController = class CrawlerController {
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async getAll() {
        return response_1.success(await this.crawlerService.findAll());
    }
    getConfig() {
        return response_1.success(this.crawlerService.getConfig());
    }
    setConfig(req) {
        const maxDepth = req.body.maxDepth;
        const maxPages = req.body.maxPages;
        return response_1.success(this.crawlerService.setConfig(maxDepth, maxPages));
    }
    async isSubDomainDone(subDomain) {
        subDomain = decodeURIComponent(subDomain);
        return response_1.success(await this.crawlerService.isCrawlSubDomainDone(subDomain));
    }
    async crawlPage(req) {
        const domain = req.body.domain;
        const domainId = req.body.domainId;
        const subDomain = req.body.subDomain;
        const maxDepth = req.body.max_depth;
        const maxPages = req.body.max_pages;
        return response_1.success(await this.crawlerService.crawlDomain(subDomain, domain, domainId, maxDepth, maxPages));
    }
    async deleteCrawl(req) {
        const crawlDomainId = req.body.crawlDomainId;
        return response_1.success(await this.crawlerService.delete(crawlDomainId));
    }
    async getCrawlResultsCrawlDomainID(crawlDomainId) {
        return response_1.success(await this.crawlerService.getCrawlResultsCrawlDomainID(parseInt(crawlDomainId)));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getAll", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getConfig", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('setConfig'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "setConfig", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('isSubDomainDone/:subDomain'),
    __param(0, common_1.Param('subDomain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "isSubDomainDone", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('crawl'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "crawlPage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('delete'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "deleteCrawl", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('getByCrawlDomainID/:crawlDomainId'),
    __param(0, common_1.Param('crawlDomainId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getCrawlResultsCrawlDomainID", null);
CrawlerController = __decorate([
    common_1.Controller('crawler'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], CrawlerController);
exports.CrawlerController = CrawlerController;
//# sourceMappingURL=crawler.controller.js.map