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
    async removeMyMonitorUserWebsitePages(req, website, url) {
        const userId = req.user.userId;
        url = decodeURIComponent(url);
        return response_1.success(await this.evaluationService.findMyMonitorUserWebsitePageNewestEvaluation(userId, website, url));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Get('myMonitor/:website/:url'),
    __param(0, common_1.Request()), __param(1, common_1.Param('website')), __param(2, common_1.Param('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "removeMyMonitorUserWebsitePages", null);
EvaluationController = __decorate([
    common_1.Controller('evaluation'),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService])
], EvaluationController);
exports.EvaluationController = EvaluationController;
//# sourceMappingURL=evaluation.controller.js.map