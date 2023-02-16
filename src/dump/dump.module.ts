import { Module } from '@nestjs/common';
import { DumpService } from './dump.service';
import { DumpController } from './dump.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dump } from './entities/dump.entity';

@Module({
  controllers: [DumpController],
  providers: [DumpService],
  imports: [
    TypeOrmModule.forFeature([Dump])],
})
export class DumpModule {}
