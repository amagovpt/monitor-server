"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entity_service_1 = require("./entity.service");
const entity_entity_1 = require("./entity.entity");
const entity_controller_1 = require("./entity.controller");
let EntityModule = class EntityModule {
};
EntityModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([entity_entity_1.EntityTable])],
        exports: [entity_service_1.EntityService],
        providers: [entity_service_1.EntityService],
        controllers: [entity_controller_1.EntityController]
    })
], EntityModule);
exports.EntityModule = EntityModule;
//# sourceMappingURL=entity.module.js.map