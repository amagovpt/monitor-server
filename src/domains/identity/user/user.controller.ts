import {
  Controller, Post, Get, Param, UseGuards, UseInterceptors, Body,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
  HttpCode,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { UserDocs } from "./user.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { UserQueryDTO } from "./dto/request/user-request.dto";
import { UserDTO } from "./dto/user.dto";
import { UpdateMeDTO } from "./dto/update-user-me.dto";
import { UserPaginationResponse } from "./dto/pagination-response.dto";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

@UserDocs.controller
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard,FgaGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}


  
  @UserDocs.findAll
  @Roles(RoleSlug.ADMIN)
  @Get("")
  async getAllUsers(  @Query() query: UserQueryDTO, @CurrentUser() user: AuthenticatedUser): Promise<UserPaginationResponse> {
    return await this.userService.getUsers( {user:user}, query);
   }
  @UserDocs.getUser
  @Roles(RoleSlug.ADMIN)
  @Get(":id")
  getUser(@Param("id", ParseIntPipe) id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @UserDocs.create
  @FgaAuthorized({
        objectType: "role",
        action: "can_manage_users",
        resourceIdResolver: () => "ams"
  })
  @Roles(RoleSlug.ADMIN)
  @Post("")
  async createUser(@CurrentUser() user: AuthenticatedUser, @Body() createUserDto: CreateUserDto): Promise<UserDTO> {

   return await this.userService.createUser(user,createUserDto);
   
  }

  @UserDocs.updateMe  
  @Roles(RoleSlug.ADMIN, RoleSlug.MONITOR)
  @Patch("me") 
  async updateMe(
    @CurrentUser() user: AuthenticatedUser, 
    @Body() updateMeDto: UpdateMeDTO 
  ): Promise<UserDTO> {
    return await this.userService.updateMe(user.id, updateMeDto);
  }

  @UserDocs.update
  @FgaAuthorized({
        objectType: "role",
        action: "can_manage_users",
        resourceIdResolver: () => "ams"
  })
  @Roles(RoleSlug.ADMIN)
  @Patch("")
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<UserDTO> {
    return await this.userService.updateUser(updateUserDto.id, updateUserDto);
  }
  

  
  @UserDocs.delete
  @FgaAuthorized({
        objectType: "role",
        action: "can_manage_users",
        resourceIdResolver: () => "ams"
  })
  @Roles(RoleSlug.ADMIN)
  @Delete(":id")
  @HttpCode(204)
  async deleteUser(@Param("id", ParseIntPipe) id: number): Promise<void> {

    return await this.userService.delete(id);
  }
  @UserDocs.recover
  @FgaAuthorized({
        objectType: "role",
        action: "can_manage_users",
        resourceIdResolver: () => "ams"
  })
  @Roles(RoleSlug.ADMIN)
  @Post(":id/restore")
  @HttpCode(204)
  async restoreUser(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return await this.userService.restoreUser(id);
  }

}