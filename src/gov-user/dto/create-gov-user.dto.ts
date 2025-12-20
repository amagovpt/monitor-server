import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
export class CreateGovUserDto {
  @IsNotEmpty({ message: "Citizen card number is required" })
  @IsString({ message: "Citizen card number must be a string" })
  @MinLength(1, { message: "Citizen card number cannot be empty" })
  @MaxLength(255, { message: "Citizen card number is too long" })
  ccNumber: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @MinLength(1, { message: "Name cannot be empty" })
  @MaxLength(100, { message: "Name cannot exceed 100 characters" })
  name: string;
}
