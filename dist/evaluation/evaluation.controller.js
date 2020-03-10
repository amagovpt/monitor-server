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
const evaluation_service_1 = require("./evaluation.service");
const response_1 = require("../lib/response");
let EvaluationController = class EvaluationController {
    constructor(evaluationService) {
        this.evaluationService = evaluationService;
    }
    async getMyMonitorWebsitePageEvaluation(req, website, url) {
        const userId = req.user.userId;
        url = decodeURIComponent(url);
        return response_1.success(await this.evaluationService.findMyMonitorUserWebsitePageNewestEvaluation(userId, website, url));
    }
    async evaluateMyMonitorWebsitePage(req) {
        const userId = req.user.userId;
        const url = decodeURIComponent(req.body.url);
        const page = await this.evaluationService.findPageFromUrl(url);
        const isUserPage = await this.evaluationService.isPageFromMyMonitorUser(userId, page.PageId);
        if (isUserPage) {
            return response_1.success(await this.evaluationService.evaluatePageAndSave(page.PageId, url, '01'));
        }
        else {
            throw new common_1.UnauthorizedException();
        }
    }
    async getStudyMonitorTagWebsitePageEvaluation(req, tag, website, url) {
        const userId = req.user.userId;
        url = decodeURIComponent(url);
        return response_1.success(await this.evaluationService.findStudyMonitorUserTagWebsitePageNewestEvaluation(userId, tag, website, url));
    }
    async evaluateStudyMonitorTagWebsitePage(req) {
        const userId = req.user.userId;
        const tag = req.body.tag;
        const website = req.body.website;
        const url = decodeURIComponent(req.body.url);
        const page = await this.evaluationService.findPageFromUrl(url);
        const isUserPage = await this.evaluationService.isPageFromStudyMonitorUser(userId, tag, website, page.PageId);
        if (isUserPage) {
            return response_1.success(await this.evaluationService.evaluatePageAndSave(page.PageId, url, '00'));
        }
        else {
            throw new common_1.UnauthorizedException();
        }
    }
    async getListOfPageEvaluations(req, type, page) {
        page = decodeURIComponent(page);
        return response_1.success(await this.evaluationService.findAllEvaluationsFromPage(type, page));
    }
    async getPageEvaluation(url, evaluationId) {
        url = decodeURIComponent(url);
        return response_1.success(await this.evaluationService.findEvaluationById(url, evaluationId));
    }
    async getUserPageEvaluation(type, url) {
        url = decodeURIComponent(url);
        return response_1.success(await this.evaluationService.findUserPageEvaluation(url, type));
    }
    async evaluatePage(req) {
        const url = decodeURIComponent(req.body.url);
        const page = await this.evaluationService.findPageFromUrl(url);
        if (page) {
            return response_1.success(await this.evaluationService.evaluatePageAndSave(page.PageId, url, '10'));
        }
        else {
            throw new common_1.UnauthorizedException();
        }
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Get('myMonitor/:website/:url'),
    __param(0, common_1.Request()), __param(1, common_1.Param('website')), __param(2, common_1.Param('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "getMyMonitorWebsitePageEvaluation", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Post('myMonitor/evaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "evaluateMyMonitorWebsitePage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/:tag/:website/:url'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')), __param(2, common_1.Param('website')), __param(3, common_1.Param('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "getStudyMonitorTagWebsitePageEvaluation", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/evaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "evaluateStudyMonitorTagWebsitePage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get(':type/page/:page'),
    __param(0, common_1.Request()), __param(1, common_1.Param('type')), __param(2, common_1.Param('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "getListOfPageEvaluations", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get(':url/:evaluationId'),
    __param(0, common_1.Param('url')), __param(1, common_1.Param('evaluationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "getPageEvaluation", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('user/:type/:url'),
    __param(0, common_1.Param('type')), __param(1, common_1.Param('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "getUserPageEvaluation", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('page/evaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "evaluatePage", null);
EvaluationController = __decorate([
    common_1.Controller('evaluation'),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService])
], EvaluationController);
exports.EvaluationController = EvaluationController;
//# sourceMappingURL=evaluation.controller.js.map