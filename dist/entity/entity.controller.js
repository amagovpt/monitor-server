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
exports.EntityController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const entity_service_1 = require("./entity.service");
const entity_entity_1 = require("./entity.entity");
const response_1 = require("../lib/response");
let EntityController = (() => {
    let EntityController = class EntityController {
        constructor(entityService) {
            this.entityService = entityService;
        }
        async reEvaluateWebsitePages(req) {
            const entityId = req.body.entityId;
            const option = req.body.option;
            return response_1.success(await this.entityService.addPagesToEvaluate(entityId, option));
        }
        async getAllEntities() {
            return response_1.success(await this.entityService.findAll());
        }
        async getEntityInfo(entityId) {
            return response_1.success(await this.entityService.findInfo(entityId));
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
        async updateEntity(req) {
            const entityId = req.body.entityId;
            const shortName = req.body.shortName;
            const longName = req.body.longName;
            const defaultWebsites = JSON.parse(req.body.defaultWebsites);
            const websites = JSON.parse(req.body.websites);
            const updateSuccess = await this.entityService.update(entityId, shortName, longName, websites, defaultWebsites);
            if (!updateSuccess) {
                throw new common_1.InternalServerErrorException();
            }
            return response_1.success(true);
        }
        async deleteEntity(req) {
            const entityId = req.body.entityId;
            const deleteSuccess = await this.entityService.delete(entityId);
            if (!deleteSuccess) {
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
        async getListOfEntityWebsites(entity) {
            return response_1.success(await this.entityService.findAllWebsites(entity));
        }
    };
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
        common_1.Post('reEvaluate'),
        __param(0, common_1.Request()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], EntityController.prototype, "reEvaluateWebsitePages", null);
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
        common_1.Get('all'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], EntityController.prototype, "getAllEntities", null);
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
        common_1.Get('info/:entityId'),
        __param(0, common_1.Param('entityId')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], EntityController.prototype, "getEntityInfo", null);
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
        common_1.Post('update'),
        __param(0, common_1.Request()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], EntityController.prototype, "updateEntity", null);
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
        common_1.Post('delete'),
        __param(0, common_1.Request()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], EntityController.prototype, "deleteEntity", null);
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
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
        common_1.Get('websites/:entity'),
        __param(0, common_1.Param('entity')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], EntityController.prototype, "getListOfEntityWebsites", null);
    EntityController = __decorate([
        common_1.Controller('entity'),
        __metadata("design:paramtypes", [entity_service_1.EntityService])
    ], EntityController);
    return EntityController;
})();
exports.EntityController = EntityController;
//# sourceMappingURL=entity.controller.js.map