import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.key'),
    });
  }

  async validate(payload: any): Promise<any> {
    const valid = await this.authService.verifyUserPayload(payload);
    
    delete payload.exp;
    const token = this.authService.signToken(payload);

    const isBlackListed = await this.authService.isTokenBlackListed(token);
    if (!valid || isBlackListed) {
      throw new UnauthorizedException(); 
    }
    
    return { userId: payload.sub, username: payload.username };
  }
}