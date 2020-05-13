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
const entity_entity_1 = require("./entity.entity");
const website_entity_1 = require("../website/website.entity");
let EntityService = class EntityService {
    constructor(entityRepository, connection) {
        this.entityRepository = entityRepository;
        this.connection = connection;
    }
    async addPagesToEvaluate(entityId, option) {
        const pages = await this.entityRepository.query(`
      SELECT
        p.PageId, 
        p.Uri
      FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        w.EntityId = ? AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?
    `, [entityId, option === 'all' ? '1__' : '1_1']);
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let error = false;
        try {
            for (const page of pages || []) {
                try {
                    await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`, [page.PageId, -1, page.Uri, '10', new Date()]);
                }
                catch (_) {
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            console.log(err);
            error = true;
        }
        finally {
            await queryRunner.release();
        }
        return !error;
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const entities = await manager.query(`SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM 
        Entity as e 
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      GROUP BY e.EntityId`);
        return entities;
    }
    async findInfo(entityId) {
        const entity = await this.entityRepository.findOne({ where: { EntityId: entityId } });
        if (entity) {
            entity['websites'] = await this.entityRepository.query(`SELECT * FROM Website WHERE EntityId = ?`, [entityId]);
            return entity;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async findByShortName(shortName) {
        return this.entityRepository.findOne({ where: { Short_Name: shortName } });
    }
    async findByLongName(longName) {
        return this.entityRepository.findOne({ where: { Long_Name: longName } });
    }
    async findAllWebsites(entity) {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
        Entity as e
      WHERE
        e.EntityId = w.EntityId AND
        LOWER(e.Long_Name) = ?
      GROUP BY w.WebsiteId`, [entity.toLowerCase()]);
        return websites;
    }
    async createOne(entity, websites) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const insertEntity = await queryRunner.manager.save(entity);
            for (const websiteId of websites || []) {
                await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: websiteId }, { EntityId: insertEntity.EntityId });
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async update(entityId, shortName, longName, websites, defaultWebsites) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.update(entity_entity_1.EntityTable, { EntityId: entityId }, { Short_Name: shortName, Long_Name: longName });
            for (const id of defaultWebsites || []) {
                if (!websites.includes(id)) {
                    await queryRunner.manager.query(`UPDATE Website SET EntityId = NULL WHERE WebsiteId = ?`, [id]);
                }
            }
            for (const id of websites || []) {
                if (!defaultWebsites.includes(id)) {
                    await queryRunner.manager.query(`UPDATE Website SET EntityId = ? WHERE WebsiteId = ?`, [entityId, id]);
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async delete(entityId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.update(website_entity_1.Website, { EntityId: entityId }, { EntityId: null });
            await queryRunner.manager.delete(entity_entity_1.EntityTable, { where: { EntityId: entityId } });
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
};
EntityService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(entity_entity_1.EntityTable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], EntityService);
exports.EntityService = EntityService;
//# sourceMappingURL=entity.service.js.map