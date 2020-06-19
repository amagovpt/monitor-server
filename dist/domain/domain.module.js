"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const domain_service_1 = require("./domain.service");
const domain_entity_1 = require("./domain.entity");
const domain_controller_1 = require("./domain.controller");
let DomainModule = class DomainModule {
};
DomainModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([domain_entity_1.Domain])],
        exports: [domain_service_1.DomainService],
        providers: [domain_service_1.DomainService],
        controllers: [domain_controller_1.DomainController]
    })
], DomainModule);
exports.DomainModule = DomainModule;
//# sourceMappingURL=domain.module.js.map