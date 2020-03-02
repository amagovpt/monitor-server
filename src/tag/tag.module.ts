import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagService } from './tag.service';
import { Tag } from './tag.entity';
import { TagController } from './tag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  exports: [TagService],
  providers: [TagService],
  controllers: [TagController]
})
export class TagModule {}
