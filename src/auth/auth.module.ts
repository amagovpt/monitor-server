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
import { JwtMonitorStrategy } from './jwt-monitor.strategy';
import { JwtStudyStrategy } from './jwt-study.strategy';
import { GovUserModule } from 'src/gov-user/gov-user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, InvalidToken]),
    GovUserModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        signOptions: { expiresIn: '1d' },
        secret: configService.get<string>('auth.key'),
      }),
      inject: [ConfigService],
    })
  ],
  exports: [AuthService],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy, 
    JwtAdminStrategy, 
    JwtMonitorStrategy,
    JwtStudyStrategy
  ],
  controllers: [AuthController]
})
export class AuthModule {}
