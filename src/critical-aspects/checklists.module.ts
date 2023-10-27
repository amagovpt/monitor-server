import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistsController } from './checklists.controller';
import { Criteria } from './entities/criteria.entity';
import { ChecklistsService } from './checklists.service';
import { WebsiteCriteriaNotes } from './entities/website-criteria-notes.entity';
import { ShareCode } from './entities/share-code.entity';
import { Website } from 'src/website/website.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Criteria,WebsiteCriteriaNotes,ShareCode,Website])],
  exports: [ChecklistsService],
  providers: [ChecklistsService],
  controllers: [ChecklistsController]
})
export class ChecklistsModule {}
