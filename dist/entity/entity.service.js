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
    async findAll() {
        const manager = typeorm_2.getManager();
        const entities = await manager.query(`SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM 
        Entity as e 
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      GROUP BY e.EntityId`);
        return entities;
    }
    async findByShortName(shortName) {
        return this.entityRepository.findOne({ where: { Short_Name: shortName } });
    }
    async findByLongName(longName) {
        return this.entityRepository.findOne({ where: { Long_Name: longName } });
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
};
EntityService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(entity_entity_1.EntityTable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], EntityService);
exports.EntityService = EntityService;
//# sourceMappingURL=entity.service.js.map