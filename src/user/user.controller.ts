import { Controller, InternalServerErrorException, Post, Get, Request, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { User } from './user.entity';
import { generatePasswordHash, createRandomUniqueHash } from '../lib/security';
import { success } from '../response';

@Controller('user')
export class UserController {

  constructor(
    private readonly userService: UserService
  ) { }

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
    
    const createSuccess = await this.userService.createOne(user);
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
}
