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
const page_service_1 = require("./page.service");
const response_1 = require("../lib/response");
let PageController = class PageController {
    constructor(pageService) {
        this.pageService = pageService;
    }
    async getAllPages() {
        return response_1.success(await this.pageService.findAll());
    }
    async getAllMyMonitorUserWebsitePages(req, website) {
        return response_1.success(await this.pageService.findAllFromMyMonitorUserWebsite(req.user.userId, website));
    }
    async createMyMonitorUserWebsitePages(req) {
        const website = req.body.website;
        const domain = req.body.domain;
        const uris = JSON.parse(req.body.pages);
        return response_1.success(await this.pageService.createMyMonitorUserWebsitePages(req.user.userId, website, domain, uris));
    }
    async removeMyMonitorUserWebsitePages(req) {
        const website = req.body.website;
        const ids = JSON.parse(req.body.pagesId);
        return response_1.success(await this.pageService.removeMyMonitorUserWebsitePages(req.user.userId, website, ids));
    }
    async getStudyMonitorUserTagWebsitePages(req, tag, website) {
        return response_1.success(await this.pageService.findStudyMonitorUserTagWebsitePages(req.user.userId, tag, website));
    }
    async createStudyMonitorUserTagWebsitePages(req) {
        const tag = req.body.tag;
        const website = req.body.website;
        const domain = req.body.domain;
        const uris = JSON.parse(req.body.pages).map(page => decodeURIComponent(page));
        return response_1.success(await this.pageService.createStudyMonitorUserTagWebsitePages(req.user.userId, tag, website, domain, uris));
    }
    async removeStudyMonitorUserTagWebsitePages(req) {
        const tag = req.body.tag;
        const website = req.body.website;
        const pagesId = JSON.parse(req.body.pagesId);
        return response_1.success(await this.pageService.removeStudyMonitorUserTagWebsitePages(req.user.userId, tag, website, pagesId));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getAllPages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Get('myMonitor/website/:website'),
    __param(0, common_1.Request()), __param(1, common_1.Param('website')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getAllMyMonitorUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Post('myMonitor/create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "createMyMonitorUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Post('myMonitor/remove'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "removeMyMonitorUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/tag/:tag/website/:website'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')), __param(2, common_1.Param('website')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getStudyMonitorUserTagWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "createStudyMonitorUserTagWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/remove'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "removeStudyMonitorUserTagWebsitePages", null);
PageController = __decorate([
    common_1.Controller('page'),
    __metadata("design:paramtypes", [page_service_1.PageService])
], PageController);
exports.PageController = PageController;
//# sourceMappingURL=page.controller.js.map