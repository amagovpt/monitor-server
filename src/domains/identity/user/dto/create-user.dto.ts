import {
  IsIn,
  IsNotEmpty,
  IsStrongPassword,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { RoleSlug, UserPermission } from 'src/core/authentication/interfaces/types';
import { PermissionLevel } from '../user.entity';

export class CreateUserDto {
  @IsString({ message: 'Username must be a string.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsString({ message: 'Role must be a string.' })
  @IsNotEmpty({ message: 'Role is required.' })
  @IsIn([RoleSlug.ADMIN, RoleSlug.MONITOR], {
    message: `Role must be one of the following values: ${Object.values(RoleSlug).join(', ')}`,
  })
  role: RoleSlug;

  @IsOptional()
  @IsString({ message: 'Citizen card number must be a string' })
  @MinLength(1, { message: 'Citizen card number cannot be empty' })
  @MaxLength(30, { message: 'Citizen card number is too long' })
  ccNumber: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is too weak. It must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols.',
    },
  )
  password: string;

  @IsString({ message: 'Permissions must be a string.' })
  @IsEnum(PermissionLevel, {
    message: `Permissions must be a valid permission. Valid permissions are: ${Object.values(PermissionLevel).join(', ')}`,
  })
  permission: PermissionLevel = PermissionLevel.VIEWER;
}
