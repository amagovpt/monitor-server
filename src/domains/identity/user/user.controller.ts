import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { UserDocs } from './user.swagger';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { UserQueryDTO } from './dto/request/user-request.dto';
import { UserDTO } from './dto/user.dto';
import { UpdateMeDTO } from './dto/update-user-me.dto';
import { UserPaginationResponse } from './dto/pagination-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@UserDocs.controller
@Controller('users')
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UserDocs.findAll
  @Get('')
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getAllUsers(
    @Query() query: UserQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserPaginationResponse> {
    return await this.userService.getUsers({ user: user }, query);
  }
  @UserDocs.getUser
  @Get(':id')
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @UserDocs.create
  @Post('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async createUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserDTO> {
    return await this.userService.createUser(user, createUserDto);
  }

  @UserDocs.updateMe
  @Patch('me')
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateMeDto: UpdateMeDTO,
  ): Promise<UserDTO> {
    return await this.userService.updateMe(user.id, updateMeDto);
  }

  @UserDocs.update
  @Patch('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<UserDTO> {
    return await this.userService.updateUser(updateUserDto.id, updateUserDto);
  }

  @UserDocs.delete
  @Delete(':id')
  @HttpCode(204)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.userService.delete(id);
  }
  @UserDocs.recover
  @Post(':id/restore')
  @HttpCode(204)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async restoreUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.userService.restoreUser(id);
  }
}
