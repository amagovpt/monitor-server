import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FunctionalAspectsService } from "./functional-aspects.service";
import { FunctionalAspects } from "./functional-aspects.entity";
import { FunctionalAspectsController } from "./functional-aspects.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([FunctionalAspects])
  ],
  exports: [FunctionalAspectsService],
  providers: [FunctionalAspectsService],
  controllers: [FunctionalAspectsController],
})
export class FunctionalAspectsModule {}
