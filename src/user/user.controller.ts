import { Controller, InternalServerErrorException, Post, Get, Request, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { User } from './user.entity';
import { generatePasswordHash, createRandomUniqueHash } from '../lib/security';
import { success } from '../lib/response';

@Controller('user')
export class UserController {

  constructor(
    private readonly userService: UserService
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('changePassword')
  async changeUserPassword(@Request() req: any): Promise<any> {
    const password = req.body.password;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmPassword;

    if (newPassword !== confirmNewPassword) {
      throw new UnauthorizedException();
    }

    return success(!!await this.userService.changePassword(req.user.userId, password, newPassword));
  }

  private passwordValidator(password: string): boolean {
    const isShort = password.length < 8 || password.length === 0;

    const hasUpperCase = password.toLowerCase() !== password;

    const hasLowerCase = password.toUpperCase() !== password;

    const specialFormat = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    const hasSpecial = specialFormat.test(password);

    const numberFormat = /\d/g;
    const hasNumber = numberFormat.test(password);

    if (isShort || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      return false;
    }
  
    return true;
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('create')
  async createUser(@Request() req: any): Promise<any> {
    if (!this.passwordValidator(req.body.password)) {
      throw new InternalServerErrorException();
    }

    const user = new User();
    user.Username = req.body.username;
    user.Password = await generatePasswordHash(req.body.password);
    user.Names = req.body.names;
    user.Emails = req.body.emails;
    user.Type = req.body.type;
    user.Register_Date = new Date();
    user.Unique_Hash = createRandomUniqueHash();

    const tags = JSON.parse(req.body.tags);
    const websites = JSON.parse(req.body.websites);
    const transfer = !!req.body.transfer;
    
    const createSuccess = await this.userService.createOne(user, tags, websites, transfer);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('update')
  async updateUser(@Request() req: any): Promise<any> {
    const userId = req.body.userId;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!this.passwordValidator(password)) {
      throw new InternalServerErrorException();
    }

    if (password !== confirmPassword) {
      return success(false);
    }

    const names = req.body.names;
    const emails = req.body.emails;
    const app = req.body.app;

    const websites = JSON.parse(req.body.websites);
    const defaultWebsites = JSON.parse(req.body.defaultWebsites);
    const transfer = !!req.body.transfer;
    
    const updateSuccess = await this.userService.update(userId, password, names, emails, app, defaultWebsites, websites, transfer);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('delete')
  async deleteUser(@Request() req: any): Promise<any> {
    const userId = req.body.userId;
    const app = req.body.app;
    
    const deleteSuccess = await this.userService.delete(userId, app);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('get/:id')
  getUser(@Param('id') id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('info/:userId')
  async getUserInfo(@Param('userId') userId: number): Promise<User> {
    return success(await this.userService.findInfo(userId));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/:username')
  async checkIfUsernameExists(@Param('username') username: string): Promise<boolean> {
    return success(!!await this.userService.findByUsername(username.toLowerCase()));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllNonAdminUsers(): Promise<any> {
    return success(await this.userService.findAllNonAdmin());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('myMonitor')
  async getAllMyMonitorUsers(): Promise<any> {
    return success(await this.userService.findAllFromMyMonitor());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('studyMonitor/total')
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return success(await this.userService.findNumberOfStudyMonitor());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('myMonitor/total')
  async getNumberOfMyMonitorUsers(): Promise<any> {
    return success(await this.userService.findNumberOfMyMonitor());
  }

  @UseGuards(AuthGuard('jwt-study'))
  @Get('tag/nameExists/:name')
  async checkIfUserTagNameExists(@Request() req: any, @Param('name') name: string): Promise<any> {
    if (name) {
      return success(!!await this.userService.findStudyMonitorUserTagByName(req.user.userId, name));
    } else {
      return success(false);
    }
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('type/:user')
  async getUserType(@Param('user') user: string): Promise<any> {
    if (user) {
      return success(await this.userService.findType(user));
    } else {
      return success(null);
    }
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('websites/:user')
  async getListOfUserWebsites(@Param('user') user: string): Promise<any> {
    if (user) {
      return success(await this.userService.findAllWebsites(user));
    } else {
      throw new InternalServerErrorException();
    }
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('tags/:user')
  async getListOfUserTags(@Param('user') user: string): Promise<any> {
    if (user) {
      return success(await this.userService.findAllTags(user));
    } else {
      throw new InternalServerErrorException();
    }
  }
}
