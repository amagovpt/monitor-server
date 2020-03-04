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
const tag_service_1 = require("./tag.service");
const tag_entity_1 = require("./tag.entity");
const response_1 = require("../lib/response");
let TagController = class TagController {
    constructor(tagService) {
        this.tagService = tagService;
    }
    async createOfficialTag(req) {
        const tag = new tag_entity_1.Tag();
        tag.Name = req.body.name;
        tag.Show_in_Observatorio = req.body.observatory;
        tag.Creation_Date = new Date();
        const websites = JSON.parse(req.body.websites);
        const createSuccess = await this.tagService.createOne(tag, websites);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async createStudyMonitorUserTag(req) {
        const tag = new tag_entity_1.Tag();
        tag.Name = req.body.user_tag_name;
        tag.UserId = req.user.userId;
        tag.Show_in_Observatorio = 0;
        tag.Creation_Date = new Date();
        const type = req.body.type;
        const tagsId = JSON.parse(req.body.tagsId);
        const createSuccess = this.tagService.createUserTag(tag, type, tagsId);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async checkIfTagNameExists(tagName) {
        return response_1.success(!!await this.tagService.findByTagName(tagName.toLowerCase()));
    }
    async getAllTags() {
        return response_1.success(await this.tagService.findAll());
    }
    async getAllOfficialTags() {
        return response_1.success(await this.tagService.findAllOfficial());
    }
    async getNumberOfStudyMonitorUsers() {
        return response_1.success(await this.tagService.findNumberOfStudyMonitor());
    }
    async getNumberOfObservatoryTags() {
        return response_1.success(await this.tagService.findNumberOfObservatory());
    }
    async getStudyMonitorUserTags(req) {
        return response_1.success(await this.tagService.findAllFromStudyMonitorUser(req.user.userId));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "createOfficialTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('user/create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "createStudyMonitorUserTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('exists/:tagName'),
    __param(0, common_1.Param('tagName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "checkIfTagNameExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getAllTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt'), passport_1.AuthGuard('jwt-study')),
    common_1.Get('allOfficial'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getAllOfficialTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('studyMonitor/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getNumberOfStudyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('observatory/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getNumberOfObservatoryTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getStudyMonitorUserTags", null);
TagController = __decorate([
    common_1.Controller('tag'),
    __metadata("design:paramtypes", [tag_service_1.TagService])
], TagController);
exports.TagController = TagController;
//# sourceMappingURL=tag.controller.js.map