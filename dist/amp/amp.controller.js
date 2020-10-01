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
exports.AmpController = void 0;
const common_1 = require("@nestjs/common");
const evaluation_service_1 = require("../evaluation/evaluation.service");
const response_1 = require("../lib/response");
const fs_1 = require("fs");
const dns_1 = __importDefault(require("dns"));
const ip_range_check_1 = __importDefault(require("ip-range-check"));
const blackList = fs_1.readFileSync('../black-list.txt').toString().split('\n');
let AmpController = class AmpController {
    constructor(evaluationService) {
        this.evaluationService = evaluationService;
    }
    async evaluateUrl(url) {
        const isValid = await this.checkIfValidUrl(decodeURIComponent(url));
        if (!isValid) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(await this.evaluationService.evaluateUrl(decodeURIComponent(url)));
    }
    async evaluateHtml(req) {
        return response_1.success(await this.evaluationService.evaluateHtml(req.body.html));
    }
    checkIfValidUrl(url) {
        return new Promise((resolve, reject) => {
            dns_1.default.lookup(this.fixUrl(url), (err, addr) => {
                const isValid = !ip_range_check_1.default(addr, blackList);
                resolve(isValid);
            });
        });
    }
    fixUrl(url) {
        url = url.replace('http://', '').replace('https://', '');
        return url.split('/')[0];
    }
};
__decorate([
    common_1.Get('eval/:url'),
    __param(0, common_1.Param('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmpController.prototype, "evaluateUrl", null);
__decorate([
    common_1.Post('eval/html'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AmpController.prototype, "evaluateHtml", null);
AmpController = __decorate([
    common_1.Controller('amp'),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService])
], AmpController);
exports.AmpController = AmpController;
//# sourceMappingURL=amp.controller.js.map