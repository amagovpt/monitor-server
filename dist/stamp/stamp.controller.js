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
exports.StampController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const stamp_service_1 = require("./stamp.service");
const response_1 = require("../lib/response");
let StampController = class StampController {
    constructor(stampService) {
        this.stampService = stampService;
    }
    async generateAllWebsitesDigitalStamp() {
        const errors = await this.stampService.generateAllWebsitesDigitalStamp();
        return errors.length === 0 ? response_1.success(true) : response_1.error(errors, false);
    }
    async generateWebsiteDigitalStamp(req) {
        const websiteId = req.body.websiteId;
        const name = req.body.name;
        return response_1.success(await this.stampService.generateWebsiteDigitalStamp(websiteId, name));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StampController.prototype, "generateAllWebsitesDigitalStamp", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('website'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StampController.prototype, "generateWebsiteDigitalStamp", null);
StampController = __decorate([
    common_1.Controller('stamp'),
    __metadata("design:paramtypes", [stamp_service_1.StampService])
], StampController);
exports.StampController = StampController;
//# sourceMappingURL=stamp.controller.js.map