import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainService } from './domain.service';
import { Domain } from './domain.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Domain])],
  exports: [DomainService],
  providers: [DomainService]
})
export class DomainModule {}
