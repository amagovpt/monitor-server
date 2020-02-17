import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('user')
export class UserController {

  constructor(
    private readonly userService: UserService
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('create')
  async createUser(): Promise<string> {
    const user = new User();
    user.Username = 'Carlos';
    user.Password = 'ola';
    user.Type = 'monitor';
    user.Register_Date = new Date();
    user.Unique_Hash = 'nkjandjcwjca';
    
    await this.userService.createOne(user);

    return 'inserted or not';
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('get/:id')
  getUser(@Param('id') id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('all')
  getAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }
}
