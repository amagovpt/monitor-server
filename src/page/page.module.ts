import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageService } from './page.service';
import { Page } from './page.entity';
import { PageController } from './page.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Page])],
  exports: [PageService],
  providers: [PageService],
  controllers: [PageController]
})
export class PageModule {}
