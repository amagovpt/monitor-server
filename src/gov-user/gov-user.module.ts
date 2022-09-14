import { Module } from '@nestjs/common';
import { GovUserService } from './gov-user.service';
import { GovUserController } from './gov-user.controller';
import { GovUser } from './entities/gov-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [GovUserController],
  providers: [GovUserService],
  imports: [
    TypeOrmModule.forFeature([GovUser]),
    UserService],
})
export class GovUserModule { }
