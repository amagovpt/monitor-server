import { Module } from '@nestjs/common';
import { ListenerModule } from './core/listener/listener.module';
import { TelemetryModule } from './core/telemetry/telemetry.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { SseModule } from './core/sse/sse.module';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IntegrationsModule } from './integrations/integrations.module';
import { CoreModule } from './core/core.module';
import { DomainsModule } from './domains/domains.module';
import { ConfigAppModule } from './core/config-app/config-app.module';
import { PersistenceModule } from './core/database/persistence.module';
import { AuthorizationModule } from './core/authorization/authorization.module';
import { MaxOffsetLimitConstraint } from './core/validators/max-limit-pag.validator';
import { ClickhouseModule } from './core/clickhouse/clickhouse.module';
import { ThrottlerModule } from '@nestjs/throttler/dist/throttler.module';
import { ConfigService } from '@nestjs/config';
import { DbConstraintExceptionFilter } from './core/filters/db-unique-contraint.filter';
import { EvaluationConsumerModule } from './core/consumer/consumer.module';
@Module({
  imports: [
    ConfigAppModule,
    TelemetryModule,
    EventEmitterModule.forRoot(),

    PersistenceModule,
    EvaluationConsumerModule,

    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigAppModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isEnabled = configService.get<boolean>('RATE_LIMIT_ENABLED');
        const ttl = configService.get<number>('RATE_LIMIT_TTL');
        const limit = configService.get<number>('RATE_LIMIT_LIMIT');

        return {
          throttlers: [
            {
              name: 'global',
              ttl: ttl ?? 60000,
              limit: isEnabled ? (limit ?? 100) : 1000000000,
            },
          ],
        };
      },
    }),

    CoreModule,
    DomainsModule,
    IntegrationsModule,
    AuthorizationModule,
    ClickhouseModule,
    SseModule,
    ListenerModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    MaxOffsetLimitConstraint,
    {
      provide: APP_FILTER,
      useClass: DbConstraintExceptionFilter,
    },
  ],
})
export class AppModule {}
