import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { PermissionLevel } from '../user.entity';

export class UpdateUserDto {
  @IsNumber({}, { message: 'ID must be a number.' })
  @IsNotEmpty({ message: 'ID is required.' })
  id: number;
  @IsString({ message: 'Names must be a string.' })
  @IsOptional()
  names: string;
  @IsString({ message: 'Email must be a string.' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  email: string;
  @IsString({ message: 'Role must be a string.' })
  @IsOptional()
  @IsIn([RoleSlug.ADMIN, RoleSlug.MONITOR], {
    message: 'Role must be one of the following values: nimda, study, monitor.',
  })
  role: string;

  @IsOptional()
  @IsString({ message: 'Citizen card number must be a string' })
  @MinLength(1, { message: 'Citizen card number cannot be empty' })
  @MaxLength(30, { message: 'Citizen card number is too long' })
  ccNumber: string;

  @IsOptional()
  @IsString({ message: 'Permissions must be a string.' })
  @IsEnum(PermissionLevel, {
    message: `Permissions must be a valid permission. Valid permissions are: ${Object.values(PermissionLevel).join(', ')}`,
  })
  permission: PermissionLevel;
}
