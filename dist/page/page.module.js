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
const page_service_1 = require("./page.service");
const page_entity_1 = require("./page.entity");
const page_controller_1 = require("./page.controller");
const auth_module_1 = require("../auth/auth.module");
const evaluation_module_1 = require("../evaluation/evaluation.module");
const website_entity_1 = require("../website/website.entity");
const evaluation_entity_1 = require("../evaluation/evaluation.entity");
const page_gateway_1 = require("./page.gateway");
let PageModule = class PageModule {
};
PageModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([website_entity_1.Website, page_entity_1.Page, evaluation_entity_1.Evaluation]), auth_module_1.AuthModule, evaluation_module_1.EvaluationModule],
        exports: [page_service_1.PageService],
        providers: [page_service_1.PageService, page_gateway_1.PageGateway],
        controllers: [page_controller_1.PageController]
    })
], PageModule);
exports.PageModule = PageModule;
//# sourceMappingURL=page.module.js.map