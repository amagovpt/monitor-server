import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriticalAspectsController } from './critical-aspects.controller';
import { Criteria } from './entities/criteria.entity';
import { SubCriteria } from './entities/sub-criteria.entity';
import { CriticalAspectService } from './critical-aspects.service';
import { WebsiteCriteriaNotes } from './entities/website-criteria-notes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Criteria,SubCriteria,WebsiteCriteriaNotes])],
  exports: [CriticalAspectService],
  providers: [CriticalAspectService],
  controllers: [CriticalAspectsController]
})
export class CriticalAspectsModule {}
