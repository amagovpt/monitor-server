import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageService } from './page.service';
import { Page } from './page.entity';
import { PageController } from './page.controller';
import { AuthModule } from '../auth/auth.module';
import { PageGateway } from './page.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Page]), AuthModule],
  exports: [PageService],
  providers: [PageService, PageGateway],
  controllers: [PageController]
})
export class PageModule {}
