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
exports.TagController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const tag_service_1 = require("./tag.service");
const tag_entity_1 = require("./tag.entity");
const response_1 = require("../lib/response");
let TagController = class TagController {
    constructor(tagService) {
        this.tagService = tagService;
    }
    async reEvaluateWebsitePages(req) {
        const tagId = req.body.tagId;
        const option = req.body.option;
        return response_1.success(await this.tagService.addPagesToEvaluate(tagId, option));
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
    async createDIrectory(req) {
        const tag = new tag_entity_1.Tag();
        tag.Name = req.body.name;
        tag.Show_in_Observatorio = req.body.observatory;
        tag.Creation_Date = new Date();
        const tags = JSON.parse(req.body.tags);
        const method = req.body.method;
        const createSuccess = await this.tagService.createDirectory(tag, tags, method);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async updateOfficialTag(req) {
        const tagId = req.body.tagId;
        const name = req.body.name;
        const observatory = req.body.observatory;
        const defaultWebsites = JSON.parse(req.body.defaultWebsites);
        const websites = JSON.parse(req.body.websites);
        const updateSuccess = await this.tagService.update(tagId, name, observatory, defaultWebsites, websites);
        if (!updateSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async deleteOfficialTag(req) {
        const tagId = req.body.tagId;
        const deleteSuccess = await this.tagService.delete(tagId);
        if (!deleteSuccess) {
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
        const createSuccess = await this.tagService.createUserTag(tag, type, tagsId);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async removeStudyMonitorUserTag(req) {
        const tagsId = JSON.parse(req.body.tagsId);
        const removeSuccess = await this.tagService.removeUserTag(tagsId);
        if (!removeSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(await this.tagService.findAllFromStudyMonitorUser(req.user.userId));
    }
    async importTag(req) {
        const tagId = req.body.tagId;
        const tagName = req.body.tagName;
        return response_1.success(await this.tagService.import(tagId, tagName));
    }
    async checkIfTagNameExists(tagName) {
        return response_1.success(!!(await this.tagService.findByOfficialTagName(tagName)));
    }
    async getAllTags() {
        return response_1.success(await this.tagService.findAll());
    }
    async getUserTagWebsites(tag, user) {
        const websites = await this.tagService.findAllUserTagWebsites(tag, user);
        for (const website of websites || []) {
            website["imported"] = await this.tagService.verifyUpdateWebsiteAdmin(website.WebsiteId);
            const websiteAdmin = await this.tagService.domainExistsInAdmin(website.WebsiteId);
            website["hasDomain"] = websiteAdmin.length === 1;
            website["webName"] = undefined;
            if (websiteAdmin.length === 1) {
                website["webName"] = websiteAdmin[0].Name;
            }
        }
        return response_1.success(websites);
    }
    async getTagWebsites(tag, user) {
        return response_1.success(await this.tagService.findAllUserTagWebsites(tag, user));
    }
    async getUserWebsitePages(tag, website, user) {
        return response_1.success(await this.tagService.findAllUserWebsitePages(tag, website, user));
    }
    async getListOfTagWebsitePages(tag) {
        return response_1.success(await this.tagService.findAllWebsitePages(tag));
    }
    async getTagInfo(tagId) {
        return response_1.success(await this.tagService.findInfo(tagId));
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
    async getStudyMonitorUserTagData(req, tag) {
        return response_1.success(await this.tagService.findStudyMonitorUserTagData(req.user.userId, tag));
    }
    async getStudyMonitorUserTagWebsitesPagesData(req, tag, website) {
        return response_1.success(await this.tagService.findStudyMonitorUserTagWebsitesPagesData(req.user.userId, tag, website));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Post("reEvaluate"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "reEvaluateWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Post("create"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "createOfficialTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Post("directory/create"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "createDIrectory", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Post("update"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "updateOfficialTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Post("delete"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "deleteOfficialTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-study")),
    common_1.Post("user/create"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "createStudyMonitorUserTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-study")),
    common_1.Post("user/remove"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "removeStudyMonitorUserTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Post("import"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "importTag", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get("exists/:tagName"),
    __param(0, common_1.Param("tagName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "checkIfTagNameExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get("all"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getAllTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get(":tag/user/:user/websites/study"),
    __param(0, common_1.Param("tag")),
    __param(1, common_1.Param("user")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getUserTagWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get(":tag/user/:user/websites"),
    __param(0, common_1.Param("tag")),
    __param(1, common_1.Param("user")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getTagWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get(":tag/website/:website/user/:user/pages"),
    __param(0, common_1.Param("tag")),
    __param(1, common_1.Param("website")),
    __param(2, common_1.Param("user")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get(":tag/websites/pages"),
    __param(0, common_1.Param("tag")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getListOfTagWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt")),
    common_1.Get("info/:tagId"),
    __param(0, common_1.Param("tagId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getTagInfo", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt")),
    common_1.Get("allOfficial"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getAllOfficialTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get("studyMonitor/total"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getNumberOfStudyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-admin")),
    common_1.Get("observatory/total"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getNumberOfObservatoryTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-study")),
    common_1.Get("studyMonitor"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getStudyMonitorUserTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-study")),
    common_1.Get("studyMonitor/:tag/data"),
    __param(0, common_1.Request()),
    __param(1, common_1.Param("tag")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getStudyMonitorUserTagData", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard("jwt-study")),
    common_1.Get("studyMonitor/:tag/website/:website/data"),
    __param(0, common_1.Request()),
    __param(1, common_1.Param("tag")),
    __param(2, common_1.Param("website")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TagController.prototype, "getStudyMonitorUserTagWebsitesPagesData", null);
TagController = __decorate([
    common_1.Controller("tag"),
    __metadata("design:paramtypes", [tag_service_1.TagService])
], TagController);
exports.TagController = TagController;
//# sourceMappingURL=tag.controller.js.map