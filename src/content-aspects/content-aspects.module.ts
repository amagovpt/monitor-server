import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContentAspectsService } from "./content-aspects.service";
import { ContentAspects } from "./content-aspects.entity";
import { ContentAspectsController } from "./content-aspects.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentAspects])
  ],
  exports: [ContentAspectsService],
  providers: [ContentAspectsService],
  controllers: [ContentAspectsController],
})
export class ContentAspectsModule {}
