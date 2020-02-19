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
const tag_entity_1 = require("./tag.entity");
let TagService = class TagService {
    constructor(tagRepository, connection) {
        this.tagRepository = tagRepository;
        this.connection = connection;
    }
    findByTagName(tagName) {
        return this.tagRepository.findOne({ where: { Name: tagName } });
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const tags = await manager.query(`SELECT 
        t.*,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        t.UserId IS NULL
      GROUP BY t.TagId`);
        return tags;
    }
    async findAllOfficial() {
        return this.tagRepository.find({ where: { UserId: typeorm_2.IsNull() } });
    }
    async createOne(tag) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.save(tag);
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
TagService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(tag_entity_1.Tag)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Connection])
], TagService);
exports.TagService = TagService;
//# sourceMappingURL=tag.service.js.map