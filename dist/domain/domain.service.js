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
const domain_entity_1 = require("./domain.entity");
let DomainService = class DomainService {
    constructor(domainRepository, connection) {
        this.domainRepository = domainRepository;
        this.connection = connection;
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const domains = await manager.query(`SELECT d.*, COUNT(distinct p.PageId) as Pages, u.Username as User
      FROM
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1%%"
        LEFT OUTER JOIN Website as w ON w.WebsiteId = d.WebsiteId
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      WHERE
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"
      GROUP BY d.DomainId`);
        return domains;
    }
    async findAllOfficial() {
        const manager = typeorm_2.getManager();
        const domains = await manager.query(`SELECT
        d.*,
        COUNT(distinct dp.PageId) as Pages
      FROM
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId,
        Website as w,
        User as u
      WHERE
        d.Active = '1' AND
        w.WebsiteId = d.WebsiteId AND
        (
          w.UserId IS NULL OR
          (
            u.UserId = w.UserId AND
            LOWER(u.Type) != 'studies'
          )
        ) AND
        w.Deleted = "0"
      GROUP BY d.DomainId`);
        return domains;
    }
    async findByUrl(url) {
        return this.domainRepository.findOne({ where: { Url: url } });
    }
    async findMyMonitorUserWebsiteDomain(userId, website) {
        const manager = typeorm_2.getManager();
        const domain = await manager.query(`SELECT d.Url FROM 
        Website as w,
        Domain as d
      WHERE
        w.UserId = ? AND
        LOWER(w.Name) = ? AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1
      LIMIT 1`, [userId, website]);
        return domain ? domain[0].Url : null;
    }
    async findStudyMonitorUserTagWebsiteDomain(userId, tag, website) {
        const manager = typeorm_2.getManager();
        const domain = await manager.query(`SELECT d.Url FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        LOWER(w.Name) = ? AND
        d.WebsiteId = w.WebsiteId
      LIMIT 1`, [tag.toLowerCase(), userId, userId, website.toLowerCase()]);
        return domain ? domain[0].Url : null;
    }
};
DomainService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(domain_entity_1.Domain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], DomainService);
exports.DomainService = DomainService;
//# sourceMappingURL=domain.service.js.map