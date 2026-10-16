import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PermissionLevel, User } from './user.entity';
import { plainToInstance } from 'class-transformer';
import {
  comparePasswordHash,
  createRandomUniqueHash,
  generatePasswordHash,
} from '../../../common/security';
import {
  AuthenticatedUser,
  RoleSlug,
  SecurityContext,
} from 'src/core/authentication/interfaces/types';
import { UserQueryDTO } from './dto/request/user-request.dto';
import { UserDTO } from './dto/user.dto';
import { UserRepository } from './repositories/user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleService } from '../role/role.service';
import { UpdateMeDTO } from './dto/update-user-me.dto';
import { Not } from 'typeorm';
import { FieldConflictException } from 'src/common/exceptions/conflict.exception';
import { Role } from '../role/roles.entity';

interface UniqueUserCriteria {
  ccNumber?: string;
  username: string;
}
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
  ) {}

  async findUserByGovCC(ccNumber: string): Promise<User> {
    const user = await this.userRepository
      .getOrmRepository()
      .findOne({ where: { ccNumber: ccNumber } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async changeUserPassword(
    userId: number,
    password: string,
    newPassword: string,
  ): Promise<boolean> {
    if (!password || !newPassword) {
      throw new BadRequestException('Both current password and new password are required.');
    }

    const user = await this.userRepository
      .getOrmRepository()
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await comparePasswordHash(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('The current password provided is incorrect.');
    }

    const newPasswordHash = await generatePasswordHash(newPassword);

    const updateResult = await this.userRepository
      .getOrmRepository()
      .update({ id: userId }, { password: newPasswordHash });

    if (updateResult.affected === 0) {
      throw new UnauthorizedException();
    }

    return true;
  }

  async updateMe(userId: number, dto: UpdateMeDTO): Promise<UserDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.newPassword) {
      await this.changeUserPassword(userId, dto.currentPassword, dto.newPassword);
    }
    return plainToInstance(UserDTO, user, { excludeExtraneousValues: true });
  }

  async updateUser(userId: number, dto: UpdateUserDto): Promise<UserDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.validateUniqueness(userId, dto);

    const previousRoleSlug = this.roleService.getSlugByRoleId(user.roleId);
    const previousPermission = user.permission;

    let newRoleSlug: RoleSlug | undefined;
    let roleChanged = false;

    if (dto.role !== undefined) {
      newRoleSlug = dto.role as RoleSlug;
      const newRoleId = this.roleService.getRoleIdBySlug(newRoleSlug);
      if (!newRoleId) {
        throw new BadRequestException('The provided role is not valid in the system.');
      }
      roleChanged = newRoleId !== user.roleId;
      if (roleChanged) {
        user.roleId = newRoleId;
      }
    }

    if (dto.ccNumber !== undefined) {
      user.ccNumber = dto.ccNumber;
    }

    let newPermission: PermissionLevel | undefined;
    let permissionChanged = false;

    if (dto.permission !== undefined) {
      newPermission = dto.permission as unknown as PermissionLevel;
      permissionChanged = previousPermission !== newPermission;
      if (permissionChanged) {
        user.permission = newPermission;
      }
    }

    if (!roleChanged && !permissionChanged && dto.ccNumber === undefined) {
      return plainToInstance(UserDTO, user, { excludeExtraneousValues: true });
    }

    const savedUser = await this.userRepository.updateUser(user, {
      role: previousRoleSlug,
      newRoleSlug: roleChanged ? newRoleSlug : undefined,
      permission: previousPermission,
      newPermission: permissionChanged ? newPermission : undefined,
    });

    if (roleChanged && newRoleSlug) {
      savedUser.role = {
        id: savedUser.roleId,
        slug: newRoleSlug,
      } as Role;
    }

    return plainToInstance(UserDTO, savedUser, { excludeExtraneousValues: true });
  }
  async delete(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    await this.userRepository.deleteUser(userId);
  }

  public async getUsers(
    securityContext: SecurityContext,
    query: UserQueryDTO,
  ): Promise<{
    data: UserDTO[];
    meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
  }> {
    const result = await this.userRepository.findManyWithMetadata({
      filters: query.filters,
      sortings: query.sorts,
      pagination: query.pagination,
      securityContext,
    });

    return {
      data: plainToInstance(UserDTO, result.data, { excludeExtraneousValues: true }),
      meta: result.meta,
    };
  }

  async findAllFromMyMonitor(): Promise<User[]> {
    return this.userRepository.getOrmRepository().find({
      select: ['id', 'username', 'createdAt', 'lastLogin'],
      where: { role: { slug: RoleSlug.MONITOR } },
      relations: ['role'],
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.getOrmRepository().findOne({ where: { id: id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.getOrmRepository().findOne({ where: { username: username } });
  }

  async createUser(
    securityContext: AuthenticatedUser,
    userCreateDto: CreateUserDto,
  ): Promise<UserDTO> {
    await this.validateUniqueUserConflicts(userCreateDto, {
      ccNumber: userCreateDto.ccNumber,
      username: userCreateDto.username,
    });

    const user = new User();
    user.username = userCreateDto.username;
    user.password = await generatePasswordHash(userCreateDto.password);

    user.ccNumber = userCreateDto.ccNumber ?? null;
    user.roleId = this.roleService.getRoleIdBySlug(userCreateDto.role as RoleSlug);
    user.uniqueHash = createRandomUniqueHash();
    user.createdById = securityContext.id;
    user.permission = userCreateDto.permission as unknown as PermissionLevel;
    const savedUser = await this.userRepository.createUser(
      user,
      userCreateDto.role,
      userCreateDto.permission,
    );

    return plainToInstance(UserDTO, savedUser, { excludeExtraneousValues: true });
  }
  async restoreUser(id: number): Promise<void> {
    const result = await this.userRepository.getOrmRepository().restore({ id: id });
    if (result.affected === 0) {
      throw new NotFoundException();
    }
  }

  private async validateUniqueness(userId: number, dto: UpdateUserDto): Promise<void> {
    if (!dto.ccNumber) return;

    const conflict = await this.userRepository.getOrmRepository().findOne({
      where: { ccNumber: dto.ccNumber, id: Not(userId) },
    });

    if (conflict) {
      throw new BadRequestException('A user with the provided citizen card number already exists.');
    }
  }

  private async validateUniqueUserConflicts(
    userData: CreateUserDto,
    criteria: UniqueUserCriteria,
  ): Promise<void> {
    const conflictingUsers = await this.userRepository.findByUniqueCriteria({
      ccNumber: userData.ccNumber,
      username: userData.username,
    });
    if (!conflictingUsers || conflictingUsers.length === 0) {
      return;
    }

    const conflicts: Record<string, string> = {};

    const hasCcConflict =
      criteria.ccNumber && conflictingUsers.some((u) => u.ccNumber === criteria.ccNumber);
    const hasUsernameConflict = conflictingUsers.some((u) => u.username === criteria.username);

    if (hasCcConflict) {
      conflicts['ccNumber'] = 'A user with the provided citizen card number already exists.';
    }

    if (hasUsernameConflict) {
      conflicts['username'] = 'A user with the provided username already exists.';
    }

    if (Object.keys(conflicts).length > 0) {
      throw new FieldConflictException(conflicts);
    }
  }
}
