import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
//import { NestCrawlerModule } from 'nest-crawler';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ObservatoryModule } from './observatory/observatory.module';
import { PageModule } from './page/page.module';
import { TagModule } from './tag/tag.module';
import { WebsiteModule } from './website/website.module';
import { DomainModule } from './domain/domain.module';
import { EntityModule } from './entity/entity.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AmpModule } from './amp/amp.module';
import { StampModule } from './stamp/stamp.module';
import { CrawlerModule } from './crawler/crawler.module';

import { readFileSync } from 'fs';
import { DirectoryModule } from './directory/directory.module';

const databaseConfig = JSON.parse(readFileSync('../monitor_db.json').toString());

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: databaseConfig.host,
      port: databaseConfig.port ? databaseConfig.port : 3306,
      username: databaseConfig.user,
      password: databaseConfig.password,
      database: databaseConfig.database,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    AuthModule,
    UserModule,
    ObservatoryModule,
    PageModule,
    TagModule,
    WebsiteModule,
    DomainModule,
    EntityModule,
    EvaluationModule,
    AmpModule,
    StampModule,
    CrawlerModule,
    DirectoryModule,
    //NestCrawlerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
