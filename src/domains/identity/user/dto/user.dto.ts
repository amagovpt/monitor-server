import { Expose, Type } from 'class-transformer';
import { RoleDTO } from '../../role/role.dto';
export class UserDTO {
  @Expose()
  id: number;
  @Expose()
  username: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
  @Expose()
  lastLogin: Date;
  @Expose()
  @Type(() => RoleDTO)
  role: RoleDTO;

  @Expose()
  permission: string;

  @Expose()
  teamCount: number;

  @Expose()
  websiteCount: number;
}
