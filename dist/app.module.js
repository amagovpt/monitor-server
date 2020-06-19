"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const serve_static_1 = require("@nestjs/serve-static");
const nest_crawler_1 = require("nest-crawler");
const path_1 = require("path");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const observatory_module_1 = require("./observatory/observatory.module");
const page_module_1 = require("./page/page.module");
const tag_module_1 = require("./tag/tag.module");
const website_module_1 = require("./website/website.module");
const domain_module_1 = require("./domain/domain.module");
const entity_module_1 = require("./entity/entity.module");
const evaluation_module_1 = require("./evaluation/evaluation.module");
const amp_module_1 = require("./amp/amp.module");
const stamp_module_1 = require("./stamp/stamp.module");
const crawler_module_1 = require("./crawler/crawler.module");
const fs_1 = require("fs");
const databaseConfig = JSON.parse(fs_1.readFileSync('../monitor_db.json').toString());
let AppModule = class AppModule {
};
AppModule = __decorate([
    common_1.Module({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: databaseConfig.host,
                port: 3306,
                username: databaseConfig.user,
                password: databaseConfig.password,
                database: databaseConfig.database,
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: false,
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: path_1.join(__dirname, '..', 'public'),
            }),
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            observatory_module_1.ObservatoryModule,
            page_module_1.PageModule,
            tag_module_1.TagModule,
            website_module_1.WebsiteModule,
            domain_module_1.DomainModule,
            entity_module_1.EntityModule,
            evaluation_module_1.EvaluationModule,
            amp_module_1.AmpModule,
            stamp_module_1.StampModule,
            crawler_module_1.CrawlerModule,
            nest_crawler_1.NestCrawlerModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map