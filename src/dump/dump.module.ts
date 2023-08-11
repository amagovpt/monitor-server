import { Module } from '@nestjs/common';
import { DumpService } from './dump.service';
import { DumpController } from './dump.controller';

@Module({
  controllers: [DumpController],
  providers: [DumpService]
})
export class DumpModule {}
