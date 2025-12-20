import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { User } from "src/user/user.entity";
import { CreateGovUserDto } from "./create-gov-user.dto";

export class UpdateGovUserDto extends PartialType(CreateGovUserDto) {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsOptional()
  entities?: User[];
}
