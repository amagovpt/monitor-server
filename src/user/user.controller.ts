import {
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Request,
  Param,
  UseGuards,
  UnauthorizedException,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { generatePasswordHash, createRandomUniqueHash } from "../lib/security";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";

@ApiBasicAuth()
@ApiTags('tag')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("user")
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'The password was changed',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt"))
  @Post("changePassword")
  async changeUserPassword(@Request() req: any): Promise<any> {
    if (!this.passwordValidator(req.body.newPassword)) {
      throw new InternalServerErrorException();
    }

    const password = req.body.password;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmPassword;

    if (newPassword !== confirmNewPassword) {
      throw new UnauthorizedException();
    }

    return success(
      !!(await this.userService.changePassword(
        req.user.userId,
        password,
        newPassword
      ))
    );
  }

  private passwordValidator(password: string): boolean {
    const isShort = password.length < 8 || password.length === 0;

    const hasUpperCase = password.toLowerCase() !== password;

    const hasLowerCase = password.toUpperCase() !== password;

    const specialFormat = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    const hasSpecial = specialFormat.test(password);

    const numberFormat = /\d/g;
    const hasNumber = numberFormat.test(password);

    if (
      isShort ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumber ||
      !hasSpecial
    ) {
      return false;
    }

    return true;
  }


  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({
    status: 200,
    description: 'A new user was created',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("create")
  async createUser(@Body() createUserDto: CreateUserDto): Promise<any> {
    if (!this.passwordValidator(createUserDto.password)) {
      throw new InternalServerErrorException();
    }

    const user = new User();
    user.username = createUserDto.username;
    user.password = await generatePasswordHash(createUserDto.password);
    user.names = createUserDto.names;
    user.emails = createUserDto.emails;
    user.type = createUserDto.type;
    user.registerDate = new Date();
    user.uniqueHash = createRandomUniqueHash();

    const tags = createUserDto.tags;
    const websites = createUserDto.websites;
    const transfer = !!createUserDto.transfer;

    const createSuccess = await this.userService.createOne(
      user,
      tags,
      websites,
      transfer
    );
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'The user was updated',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("update")
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<any> {
    const userId = updateUserDto.userId;
    const password = updateUserDto.password;
    const confirmPassword = updateUserDto.confirmPassword;//FIXME

    if (password && confirmPassword && !this.passwordValidator(password)) {
      throw new InternalServerErrorException();
    }

    if (password !== confirmPassword) {
      return success(false);
    }

    const names = updateUserDto.names;
    const emails = updateUserDto.emails;
    const app = updateUserDto.app;

    const websites = updateUserDto.websites;
    const defaultWebsites = updateUserDto.defaultWebsites;
    const transfer = !!updateUserDto.transfer;

    const updateSuccess = await this.userService.update(
      userId,
      password,
      names,
      emails,
      app,
      defaultWebsites,
      websites,
      transfer
    );
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'The user was deleted',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Post("delete")
  async deleteUser(@Body() deleteUserDto: DeleteUserDto): Promise<any> {
    const userId = deleteUserDto.userId;
    const app = deleteUserDto.app;

    const deleteSuccess = await this.userService.delete(userId, app);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @ApiOperation({ summary: 'Find user by id' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("get/:id")
  getUser(@Param("id") id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @ApiOperation({ summary: 'Find user info by id' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("info/:userId")
  async getUserInfo(@Param("userId") userId: number): Promise<User> {
    return success(await this.userService.findInfo(userId));
  }

  @ApiOperation({ summary: 'Check if user exists by id' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("exists/:username")
  async checkIfUsernameExists(
    @Param("username") username: string
  ): Promise<boolean> {
    return success(!!(await this.userService.findByUsername(username)));
  }

  @ApiOperation({ summary: 'Find all users AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("all")
  async getAllNonAdminUsers(): Promise<any> {
    return success(await this.userService.findAll());
  }


  @ApiOperation({ summary: 'Find all users MyMonitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("myMonitor")
  async getAllMyMonitorUsers(): Promise<any> {
    return success(await this.userService.findAllFromMyMonitor());
  }

  @ApiOperation({ summary: 'Find total users Study Monitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return success(await this.userService.findNumberOfStudyMonitor());
  }

  @ApiOperation({ summary: 'Find total users My Monitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("myMonitor/total")
  async getNumberOfMyMonitorUsers(): Promise<any> {
    return success(await this.userService.findNumberOfMyMonitor());
  }

  @ApiOperation({ summary: 'Check if tag name exists' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-study"))
  @Get("tag/nameExists/:name")
  async checkIfUserTagNameExists(
    @Request() req: any,
    @Param("name") name: string
  ): Promise<any> {
    if (name) {
      return success(
        !!(await this.userService.findStudyMonitorUserTagByName(
          req.user.userId,
          name
        ))
      );
    } else {
      return success(false);
    }
  }

  @ApiOperation({ summary: 'Find user type' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("type/:user")
  async getUserType(@Param("user") user: string): Promise<any> {
    if (user) {
      return success(await this.userService.findType(user));
    } else {
      return success(null);
    }
  }

  @ApiOperation({ summary: 'Find websites by user' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("websites/:user")
  async getListOfUserWebsites(@Param("user") user: string): Promise<any> {
    if (user) {
      return success(await this.userService.findAllWebsites(user));
    } else {
      throw new InternalServerErrorException();
    }
  }

  @ApiOperation({ summary: 'Find tags by user' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt-admin"))
  @Get("tags/:user")
  async getListOfUserTags(@Param("user") user: string): Promise<any> {
    if (user) {
      return success(await this.userService.findAllTags(user));
    } else {
      throw new InternalServerErrorException();
    }
  }
}
