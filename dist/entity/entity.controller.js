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
const entity_service_1 = require("./entity.service");
const entity_entity_1 = require("./entity.entity");
const response_1 = require("../lib/response");
let EntityController = class EntityController {
    constructor(entityService) {
        this.entityService = entityService;
    }
    async getAllEntities() {
        return response_1.success(await this.entityService.findAll());
    }
    async createEntity(req) {
        const entity = new entity_entity_1.EntityTable();
        entity.Short_Name = req.body.shortName;
        entity.Long_Name = req.body.longName;
        entity.Creation_Date = new Date();
        const websites = JSON.parse(req.body.websites);
        const createSuccess = await this.entityService.createOne(entity, websites);
        if (!createSuccess) {
            throw new common_1.InternalServerErrorException();
        }
        return response_1.success(true);
    }
    async checkIfShortNameExists(shortName) {
        return response_1.success(!!await this.entityService.findByShortName(shortName));
    }
    async checkIfLongNameExists(longName) {
        return response_1.success(!!await this.entityService.findByLongName(longName));
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "getAllEntities", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "createEntity", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('exists/shortName/:shortName'),
    __param(0, common_1.Param('shortName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "checkIfShortNameExists", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('exists/longName/:longName'),
    __param(0, common_1.Param('longName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EntityController.prototype, "checkIfLongNameExists", null);
EntityController = __decorate([
    common_1.Controller('entity'),
    __metadata("design:paramtypes", [entity_service_1.EntityService])
], EntityController);
exports.EntityController = EntityController;
//# sourceMappingURL=entity.controller.js.map