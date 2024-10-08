import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { RateLimiterModule, RateLimiterGuard } from "nestjs-rate-limiter";
import { readFileSync } from "fs";
import { join } from "path";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { ObservatoryModule } from "./observatory/observatory.module";
import { PageModule } from "./page/page.module";
import { TagModule } from "./tag/tag.module";
import { WebsiteModule } from "./website/website.module";
import { EntityModule } from "./entity/entity.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { AmpModule } from "./amp/amp.module";
import { StampModule } from "./stamp/stamp.module";
import { CrawlerModule } from "./crawler/crawler.module";
import { DirectoryModule } from "./directory/directory.module";
import { AccessibilityStatementModule } from "./accessibility-statement-module/accessibility-statement/accessibility-statement.module";
import { AutomaticEvaluationModule } from "./accessibility-statement-module/automatic-evaluation/automatic-evaluation.module";
import { ManualEvaluationModule } from "./accessibility-statement-module/manual-evaluation/manual-evaluation.module";
import { UserEvaluationModule } from "./accessibility-statement-module/user-evaluation/user-evaluation.module";
import { GovUserModule } from "./gov-user/gov-user.module";
import winston from "winston";
import "winston-daily-rotate-file";
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from "nest-winston";
import { LogModule } from "./log/log.module";
import { DumpModule } from "./dump/dump.module";
import { ApiSeloModule } from "./api-selo/api-selo.module";

const databaseConfig = JSON.parse(
  readFileSync("../monitor_db.json").toString()
);

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.DailyRotateFile({
          filename: "error-log/monitor-server-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "1m",
          level: "error",
        }),
        new winston.transports.DailyRotateFile({
          filename: "action-log/monitor-server-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "1m",
          level: "http",
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike("monitor-server", {
              // options
            })
          ),
        }),
      ],
      // options
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: databaseConfig.host,
      port: 3306,
      username: databaseConfig.user,
      password: databaseConfig.password,
      database: databaseConfig.database,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
    }),
    RateLimiterModule.register({
      points: 1000,
    }),
    AuthModule,
    UserModule,
    ObservatoryModule,
    PageModule,
    TagModule,
    WebsiteModule,
    EntityModule,
    EvaluationModule,
    AmpModule,
    StampModule,
    CrawlerModule,
    DirectoryModule,
    AccessibilityStatementModule,
    AutomaticEvaluationModule,
    ManualEvaluationModule,
    UserEvaluationModule,
    GovUserModule,
    LogModule,
    DumpModule,
    ApiSeloModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
})
export class AppModule {}
