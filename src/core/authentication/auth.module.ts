import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../domains/identity/user/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConstants } from './constants/constants';
import { AppLoggerModule } from '../app-logger/app-logger.module';
import { PassportModule } from '@nestjs/passport';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    AppLoggerModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  exports: [AuthService],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
