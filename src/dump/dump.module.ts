import { Module } from '@nestjs/common';
import { DumpService } from './dump.service';
import { DumpController } from './dump.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dump } from './entities/dump.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dump])],
  controllers: [DumpController],
  providers: [DumpService]
})
export class DumpModule {}
