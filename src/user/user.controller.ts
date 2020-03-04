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

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('create')
  async createUser(@Request() req: any): Promise<any> {
    const user = new User();
    user.Username = req.body.username;
    user.Password = await generatePasswordHash(req.body.password);
    user.Names = req.body.names;
    user.Emails = req.body.emails;
    user.Type = req.body.type;
    user.Register_Date = new Date();
    user.Unique_Hash = createRandomUniqueHash();

    const websites = JSON.parse(req.body.websites);
    const transfer = req.body.transfer === 'true';
    
    const createSuccess = await this.userService.createOne(user, websites, transfer);
    if (!createSuccess) {
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
}
