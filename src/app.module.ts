import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusMonitorModule } from 'nest-status-monitor';

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
import { AdminModule } from './admin/admin.module';
import { MonitorModule } from './monitor/monitor.module';
import { StudiesModule } from './studies/studies.module';

const statusMonitorConfig = {
  pageTitle: 'Nest.js Monitoring Page',
  port: 3001,
  path: '/status',
  ignoreStartsWith: '/health/alive',
  spans: [
    {
      interval: 1, // Every second
      retention: 60, // Keep 60 datapoints in memory
    },
    {
      interval: 5, // Every 5 seconds
      retention: 60,
    },
    {
      interval: 15, // Every 15 seconds
      retention: 60,
    }
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true,
  },
  healthChecks: [
    {
      protocol: 'http',
      host: 'localhost',
      path: '/health/alive',
      port: 3001,
    },
    {
      protocol: 'http',
      host: 'localhost',
      path: '/health/dead',
      port: 3001,
    }
  ]
};

@Module({
  imports: [
    StatusMonitorModule.setUp(statusMonitorConfig),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'accessmonitor',
      password: 'accessmonitor',
      database: 'accessmonitor',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
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
    AdminModule,
    MonitorModule,
    StudiesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
