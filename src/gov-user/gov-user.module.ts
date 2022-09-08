import { Module } from '@nestjs/common';
import { GovUserService } from './gov-user.service';
import { GovUserController } from './gov-user.controller';
import { GovUser } from './entities/gov-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [GovUserController],
  providers: [GovUserService],
  imports: [
    TypeOrmModule.forFeature([GovUser]),],
})
export class GovUserModule { }
