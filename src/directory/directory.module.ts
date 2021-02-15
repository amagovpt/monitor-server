import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DirectoryController } from "./directory.controller";
import { Directory } from "./directory.entity";
import { DirectoryService } from "./directory.service";

@Module({
  imports: [TypeOrmModule.forFeature([Directory])],
  exports: [DirectoryService],
  controllers: [DirectoryController],
  providers: [DirectoryService],
})
export class DirectoryModule {}
