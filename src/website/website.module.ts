import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteService } from './website.service';
import { Website } from './website.entity';
import { WebsiteController } from './website.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Website])],
  exports: [WebsiteService],
  providers: [WebsiteService],
  controllers: [WebsiteController]
})
export class WebsiteModule {}
