import { Module } from '@nestjs/common';
import { CollectionDateService } from './collection-date.service';
import { CollectionDateController } from './collection-date.controller';

@Module({
  controllers: [CollectionDateController],
  providers: [CollectionDateService]
})
export class CollectionDateModule {}
