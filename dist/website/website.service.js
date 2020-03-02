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
const website_entity_1 = require("./website.entity");
const domain_entity_1 = require("../domain/domain.entity");
let WebsiteService = class WebsiteService {
    constructor(websiteRepository, connection) {
        this.websiteRepository = websiteRepository;
        this.connection = connection;
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User, u.Type as Type, d.DomainId, d.Url as Domain, COUNT(t.TagId) as Observatory
      FROM Website as w
      LEFT OUTER JOIN TagWebsite as tw ON tw.WebsiteId = w.WebsiteId
      LEFT OUTER JOIN Tag as t ON t.TagId = tw.TagId AND t.Show_in_Observatorio = 1
      LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
      LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"
      GROUP BY w.WebsiteId, d.DomainId`);
        return websites;
    }
    async findAllOfficial() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"`);
        return websites;
    }
    async findByName(name) {
        return this.websiteRepository.findOne({ where: { Name: name } });
    }
    async findAllWithoutUser() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT * FROM Website WHERE UserId IS NULL AND Deleted = "0"`);
        return websites;
    }
    async findAllWithoutEntity() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        w.EntityId IS NULL AND
        w.Deleted = "0" AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies'))`);
        return websites;
    }
    async findAllFromMyMonitorUser(userId) {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT w.*, d.Url as Domain, COUNT(distinct p.PageId) as Pages
      FROM
        Website as w
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND LOWER(p.Show_In) LIKE '_1%'
      WHERE
        w.UserId = ?
      GROUP BY w.WebsiteId, d.Url`, [userId]);
        return websites;
    }
    async findNumberOfStudyMonitor() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE LOWER(u.Type) = "studies" AND w.UserId = u.UserId`))[0].Websites;
    }
    async findNumberOfMyMonitor() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE LOWER(u.Type) = "monitor" AND w.UserId = u.UserId`))[0].Websites;
    }
    async findNumberOfObservatory() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, Tag as t, TagWebsite as tw 
      WHERE t.Show_in_Observatorio = "1" AND tw.TagId = t.TagId AND w.WebsiteId = tw.WebsiteId`))[0].Websites;
    }
    async createOne(website, domain, tags) {
        domain = domain.replace('https://', '').replace('http://', '').replace('www.', '');
        if (domain.endsWith('/')) {
            domain = domain.substring(0, domain.length - 1);
        }
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const websites = await queryRunner.manager.query(`
        SELECT 
          w.*, d.Active 
        FROM 
          Website as w,
          Domain as d
        WHERE
          d.Url = ? AND
          w.WebsiteId = d.WebsiteId AND
          w.Deleted = "1"
        LIMIT 1
        `, [domain]);
            let websiteId = -1;
            if (websites.length > 0) {
                websiteId = websites[0].WebsiteId;
                const values = { Name: website.Name, Deleted: 0 };
                if (website.EntityId !== null) {
                    values['EntityId'] = website.EntityId;
                }
                if (website.UserId !== null) {
                    values['UserId'] = website.UserId;
                }
                await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: websiteId }, values);
                if (websites[0].Active === 0) {
                    await queryRunner.manager.update(domain_entity_1.Domain, { WebsiteId: websiteId, Active: 1 }, { Active: 0, End_Date: website.Creation_Date });
                    await queryRunner.manager.update(domain_entity_1.Domain, { WebsiteId: websiteId, Url: domain }, { Active: 1, End_Date: null });
                }
            }
            else {
                const insertWebsite = await queryRunner.manager.save(website);
                websiteId = insertWebsite.WebsiteId;
                const newDomain = new domain_entity_1.Domain();
                newDomain.WebsiteId = websiteId;
                newDomain.Url = domain;
                newDomain.Start_Date = website.Creation_Date;
                newDomain.Active = 1;
                await queryRunner.manager.save(newDomain);
            }
            for (const tag of tags || []) {
                await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [tag, websiteId]);
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
};
WebsiteService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(website_entity_1.Website)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], WebsiteService);
exports.WebsiteService = WebsiteService;
//# sourceMappingURL=website.service.js.map