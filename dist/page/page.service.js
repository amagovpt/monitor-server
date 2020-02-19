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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const page_entity_1 = require("./page.entity");
let PageService = class PageService {
    constructor(pageRepository) {
        this.pageRepository = pageRepository;
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const pages = await manager.query(`SELECT p.*, e.Score, e.Evaluation_Date 
        FROM 
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
                SELECT Evaluation_Date FROM Evaluation 
                WHERE PageId = p.PageId
                ORDER BY Evaluation_Date DESC LIMIT 1
            ) 
        WHERE
            LOWER(p.Show_In) LIKE '1%'
        GROUP BY p.PageId, e.Score, e.Evaluation_Date`);
        return pages;
    }
    getObservatoryData() {
        return typeorm_2.getManager().query(`
      SELECT
        e.EvaluationId,
        e.Title,
        e.Score,
        e.Errors,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        p.PageId,
        p.Uri,
        p.Creation_Date as Page_Creation_Date,
        d.Url,
        w.WebsiteId,
        w.Name as Website_Name,
        w.Creation_Date as Website_Creation_Date,
        en.Long_Name as Entity_Name,
        t.TagId,
        t.Name as Tag_Name,
        t.Show_in_Observatorio,
        t.Creation_Date as Tag_Creation_Date
      FROM
        Evaluation as e,
        Page as p,
        DomainPage as dp,
        Domain as d,
        Website as w
        LEFT OUTER JOIN Entity as en ON en.EntityId = w.EntityId,
        TagWebsite as tw,
        Tag as t
      WHERE
        t.Show_in_Observatorio = 1 AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE '%1' AND
        e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId AND Show_To LIKE "1_" 
            ORDER BY Evaluation_Date DESC LIMIT 1
        )
      `);
    }
};
PageService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(page_entity_1.Page)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PageService);
exports.PageService = PageService;
//# sourceMappingURL=page.service.js.map