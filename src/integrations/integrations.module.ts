import { Module } from '@nestjs/common';
import { ObservatoryModule } from './observatory/observatory.module';
import { ApiSeloModule } from './api-selo/api-selo.module';

const modules = [ApiSeloModule, ObservatoryModule];
@Module({
  imports: modules,
  exports: modules,
})
export class IntegrationsModule {}
