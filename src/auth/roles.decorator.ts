import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/user/role';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);