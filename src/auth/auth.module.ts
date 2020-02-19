import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../user/user.entity';
import { InvalidToken } from './invalid-token.entity';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtAdminStrategy } from './jwt-admin.strategy';
import { jwtConstants } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, InvalidToken]),
    JwtModule.register({
      publicKey: jwtConstants.publicKey,
      privateKey: jwtConstants.privateKey,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  exports: [AuthService],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtAdminStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
