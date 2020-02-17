import { Module } from '@nestjs/common';
import { ObservatoryController } from './observatory.controller';
import { PageModule } from '../page/page.module';

@Module({
  imports: [PageModule],
  controllers: [ObservatoryController],
  providers: []
})
export class ObservatoryModule {}
