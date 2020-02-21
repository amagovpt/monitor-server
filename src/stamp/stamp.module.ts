import { Module } from '@nestjs/common';
import { StampService } from './stamp.service';
import { StampController } from './stamp.controller';

@Module({
  providers: [StampService],
  controllers: [StampController]
})
export class StampModule {}
