import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainService } from './domain.service';
import { Domain } from './domain.entity';
import { DomainController } from './domain.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Domain])],
  exports: [DomainService],
  providers: [DomainService],
  controllers: [DomainController]
})
export class DomainModule {}
