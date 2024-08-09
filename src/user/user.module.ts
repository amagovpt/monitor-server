import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { User } from "./user.entity";
import { Tag } from "../tag/tag.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Tag])],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
