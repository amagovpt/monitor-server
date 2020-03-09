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
const website_service_1 = require("./website.service");
const website_entity_1 = require("./website.entity");
const tag_entity_1 = require("../tag/tag.entity");
const page_entity_1 = require("../page/page.entity");
const website_controller_1 = require("./website.controller");
const evaluation_module_1 = require("../evaluation/evaluation.module");
let WebsiteModule = class WebsiteModule {
};
WebsiteModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([tag_entity_1.Tag, website_entity_1.Website, page_entity_1.Page]), evaluation_module_1.EvaluationModule],
        exports: [website_service_1.WebsiteService],
        providers: [website_service_1.WebsiteService],
        controllers: [website_controller_1.WebsiteController]
    })
], WebsiteModule);
exports.WebsiteModule = WebsiteModule;
//# sourceMappingURL=website.module.js.map