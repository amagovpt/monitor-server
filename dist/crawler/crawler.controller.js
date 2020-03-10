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
CrawlerController = __decorate([
    common_1.Controller('crawler'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], CrawlerController);
exports.CrawlerController = CrawlerController;
//# sourceMappingURL=crawler.controller.js.map