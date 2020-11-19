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
exports.ObservatoryController = void 0;
const common_1 = require("@nestjs/common");
const page_service_1 = require("../page/page.service");
const response_1 = require("../lib/response");
const tag_1 = require("./models/tag");
const website_1 = require("./models/website");
let ObservatoryController = class ObservatoryController {
    constructor(pageService) {
        this.pageService = pageService;
    }
    async getData() {
        const data = await this.pageService.getObservatoryData();
        return response_1.success(data);
    }
    createTemporaryTags(data) {
        const tmpTagsIds = new Array();
        const tmpTags = new Array();
        data.map((tag) => {
            if (!tmpTagsIds.includes(tag.TagId)) {
                tmpTagsIds.push(tag.TagId);
                tmpTags.push({
                    id: tag.TagId,
                    name: tag.Tag_Name,
                    creation_date: tag.Tag_Creation_Date,
                });
            }
        });
        return tmpTags;
    }
    createTag(tag, data) {
        const newTag = new tag_1.Tag(tag.id, tag.name, tag.creation_date);
        const tmpWebsitesIds = new Array();
        const websites = new Array();
        for (const wb of data || []) {
            if (wb.TagId === tag.id && !tmpWebsitesIds.includes(wb.WebsiteId)) {
                tmpWebsitesIds.push(wb.WebsiteId);
                websites.push({
                    id: wb.WebsiteId,
                    entity: wb.Entity_Name,
                    name: wb.Website_Name,
                    domain: wb.Url,
                    creation_date: wb.Website_Creation_Date,
                });
            }
        }
        for (const website of websites || []) {
            const newWebsite = this.createWebsite(website, tag, data);
            newTag.addWebsite(newWebsite);
        }
        return newTag;
    }
    createWebsite(website, tag, data) {
        const newWebsite = new website_1.Website(website.id, website.entity, website.name, website.domain, website.creation_date);
        const pages = new Array();
        data.map((p) => {
            if (p.Website_Name === website.name && p.TagId === tag.id) {
                pages.push({
                    pageId: p.PageId,
                    uri: p.Uri,
                    creation_date: p.Page_Creation_Date,
                    evaluationId: p.EvaluationId,
                    title: p.Title,
                    score: parseFloat(p.Score),
                    errors: p.Errors,
                    tot: p.Tot,
                    A: p.A,
                    AA: p.AA,
                    AAA: p.AAA,
                    evaluation_date: p.Evaluation_Date,
                });
            }
        });
        for (const page of pages || []) {
            this.addPageToWebsite(newWebsite, page);
        }
        return newWebsite;
    }
    addPageToWebsite(website, page) {
        website.addPage(page.pageId, page.uri, page.creation_date, page.evaluationId, page.title, page.score, page.errors, page.tot, page.A, page.AA, page.AAA, page.evaluation_date);
    }
};
__decorate([
    common_1.Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservatoryController.prototype, "getData", null);
ObservatoryController = __decorate([
    common_1.Controller("observatory"),
    __metadata("design:paramtypes", [page_service_1.PageService])
], ObservatoryController);
exports.ObservatoryController = ObservatoryController;
//# sourceMappingURL=observatory.controller.js.map