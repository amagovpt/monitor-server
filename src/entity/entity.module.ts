import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "./entity.service";
import { EntityTable } from "./entity.entity";
import { EntityController } from "./entity.controller";

@Module({
  imports: [TypeOrmModule.forFeature([EntityTable])],
  exports: [EntityService],
  providers: [EntityService],
  controllers: [EntityController],
})
export class EntityModule {}
