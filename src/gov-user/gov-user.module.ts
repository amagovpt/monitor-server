import { Module } from '@nestjs/common';
import { GovUserService } from './gov-user.service';
import { GovUserController } from './gov-user.controller';
import { GovUser } from './entities/gov-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [GovUserController],
  providers: [GovUserService],
  imports: [
    TypeOrmModule.forFeature([GovUser]),
    UserModule],
})
export class GovUserModule { }
