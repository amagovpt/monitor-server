import { Module } from '@nestjs/common';
import { ObservatoryController } from './observatory.controller';
import { PageModule } from '../page/page.module';
import { Observatory } from './observatory.entity';
import { ObservatoryService } from './observatory.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Observatory])],
  exports: [ObservatoryService],
  controllers: [ObservatoryController],
  providers: [ObservatoryService]
})
export class ObservatoryModule {}
