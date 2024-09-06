import { Module } from "@nestjs/common";
import { CollectionDateService } from "./collection-date.service";
import { CollectionDateController } from "./collection-date.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CollectionDate } from "./entities/collection-date.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CollectionDate])],
  controllers: [CollectionDateController],
  providers: [CollectionDateService],
  exports: [CollectionDateService],
})
export class CollectionDateModule {}
