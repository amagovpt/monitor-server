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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const SqlString = __importStar(require("sqlstring"));
const website_service_1 = require("./website.service");
const website_entity_1 = require("./website.entity");
const response_1 = require("../lib/response");
let WebsiteController = class WebsiteController {
    constructor(websiteService) {
        this.websiteService = websiteService;
    }
    async createWebsite(req) {
        const website = new website_entity_1.Website();
        website.Name = req.body.name;
        website.UserId = parseInt(SqlString.escape(req.body.userId)) || null;
        website.EntityId = parseInt(SqlString.escape(req.body.entityId)) || null;
        website.Creation_Date = new Date();
        const domain = decodeURIComponent(req.body.domain);
        const tags = JSON.parse(req.body.tags).map((tag) => SqlString.escape(tag));
        const createSuccess = await this.websiteService.createOne(website, domain, tags);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async updateWebsite(req) {
        const websiteId = req.body.websiteId;
        const name = req.body.name;
        const entityId = req.body.entityId;
        const userId = req.body.userId;
        const oldUserId = req.body.olderUserId;
        const transfer = req.body.transfer === 'true';
        const defaultTags = JSON.parse(req.body.defaultTags);
        const tags = JSON.parse(req.body.tags);
        const updateSuccess = await this.websiteService.update(websiteId, name, entityId, userId, oldUserId, transfer, defaultTags, tags);
        if (!updateSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async updateWebsitePagesObservatory(req) {
        const pages = JSON.parse(req.body.pages);
        const pagesId = JSON.parse(req.body.pagesId);
        return response_1.success(await this.websiteService.updatePagesObservatory(pages, pagesId));
    }
    async deleteWebsite(req) {
        const websiteId = req.body.websiteId;
        const deleteSuccess = await this.websiteService.delete(websiteId);
        if (!deleteSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async getAllWebsites() {
        return response_1.success(await this.websiteService.findAll());
    }
    async getWebsiteInfo(websiteId) {
        return response_1.success(await this.websiteService.findInfo(websiteId));
    }
    async getAllWebsiteDomains(website, user) {
        const type = await this.websiteService.findUserType(user);
        let flags;
        switch (type) {
            case 'nimda':
                flags = '1__';
                break;
            case 'monitor':
                flags = '_1_';
                break;
            default:
                flags = '%';
                break;
        }
        return response_1.success(await this.websiteService.findAllDomains(user, type, website, flags));
    }
    async getAllWebsitePages(websiteId) {
        return response_1.success(await this.websiteService.findAllPages(websiteId));
    }
    async getAllOfficialWebsites() {
        return response_1.success(await this.websiteService.findAllOfficial());
    }
    async getWebsitesWithoutUser() {
        return response_1.success(await this.websiteService.findAllWithoutUser());
    }
    async getWebsitesWithoutEntity() {
        return response_1.success(await this.websiteService.findAllWithoutEntity());
    }
    async getNumberOfStudyMonitorUsers() {
        return response_1.success(await this.websiteService.findNumberOfStudyMonitor());
    }
    async getNumberOfMyMonitorUsers() {
        return response_1.success(await this.websiteService.findNumberOfMyMonitor());
    }
    async getNumberOfObservatoryTags() {
        return response_1.success(await this.websiteService.findNumberOfObservatory());
    }
    async checkIfWebsiteExists(name) {
        return response_1.success(!!await this.websiteService.findByName(SqlString.escape(name)));
    }
    async getMyMonitorUserWebsites(req) {
        return response_1.success(await this.websiteService.findAllFromMyMonitorUser(req.user.userId));
    }
    async getStudyMonitorUserTagWebsites(req, tag) {
        const userId = req.user.userId;
        return response_1.success(await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag));
    }
    async getStudyMonitorUserOtherTagsWebsites(req, tag) {
        const userId = req.user.userId;
        return response_1.success(await this.websiteService.findAllFromStudyMonitorUserOtherTagsWebsites(userId, tag));
    }
    async checkIfStudyMonitorUserTagWebsiteNameExists(req, tag, website) {
        const userId = req.user.userId;
        return response_1.success(!!await this.websiteService.findStudyMonitorUserTagWebsiteByName(userId, tag, website));
    }
    async checkIfStudyMonitorUserTagWebsiteDomainExists(req, tag, domain) {
        const userId = req.user.userId;
        return response_1.success(!!await this.websiteService.findStudyMonitorUserTagWebsiteByDomain(userId, tag, domain));
    }
    async linkStudyMonitorUserTagWebsite(req) {
        const userId = req.user.userId;
        const tag = req.body.tag;
        const websitesId = JSON.parse(req.body.websitesId);
        const linkSuccess = await this.websiteService.linkStudyMonitorUserTagWebsite(userId, tag, websitesId);
        if (!linkSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag));
    }
    async createStudyMonitorUserTagWebsite(req) {
        const userId = req.user.userId;
        const tag = req.body.tag;
        const websiteName = req.body.name;
        const domain = decodeURIComponent(req.body.domain);
        const pages = JSON.parse(req.body.pages).map((page) => decodeURIComponent(page));
        const createSuccess = await this.websiteService.createStudyMonitorUserTagWebsite(userId, tag, websiteName, domain, pages);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag));
    }
    async removeStudyMonitorUserTagWebsite(req) {
        const userId = req.user.userId;
        const tag = req.body.tag;
        const websitesId = JSON.parse(req.body.websitesId);
        const removeSuccess = await this.websiteService.removeStudyMonitorUserTagWebsite(userId, tag, websitesId);
        if (!removeSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(await this.websiteService.findAllFromStudyMonitorUserTag(userId, tag));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "createWebsite", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('update'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "updateWebsite", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('pages/updateObservatory'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "updateWebsitePagesObservatory", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('delete'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "deleteWebsite", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getAllWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('info/:websiteId'),
    __param(0, common_1.Param('websiteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getWebsiteInfo", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get(':website/user/:user/domains'),
    __param(0, common_1.Param('website')), __param(1, common_1.Param('user')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getAllWebsiteDomains", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('pages/:websiteId'),
    __param(0, common_1.Param('websiteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getAllWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('official'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getAllOfficialWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('withoutUser'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getWebsitesWithoutUser", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('withoutEntity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getWebsitesWithoutEntity", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('studyMonitor/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getNumberOfStudyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('myMonitor/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getNumberOfMyMonitorUsers", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('observatory/total'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getNumberOfObservatoryTags", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('exists/:name'),
    __param(0, common_1.Param('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "checkIfWebsiteExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Get('myMonitor'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getMyMonitorUserWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/tag/:tag'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getStudyMonitorUserTagWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/otherTags/:tag'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "getStudyMonitorUserOtherTagsWebsites", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/tag/:tag/website/nameExists/:website'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')), __param(2, common_1.Param('website')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "checkIfStudyMonitorUserTagWebsiteNameExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/tag/:tag/website/domainExists/:domain'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')), __param(2, common_1.Param('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "checkIfStudyMonitorUserTagWebsiteDomainExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/link'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "linkStudyMonitorUserTagWebsite", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "createStudyMonitorUserTagWebsite", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/remove'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "removeStudyMonitorUserTagWebsite", null);
WebsiteController = __decorate([
    common_1.Controller('website'),
    __metadata("design:paramtypes", [website_service_1.WebsiteService])
], WebsiteController);
exports.WebsiteController = WebsiteController;
//# sourceMappingURL=website.controller.js.map