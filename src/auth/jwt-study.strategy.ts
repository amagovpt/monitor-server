import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStudyStrategy extends PassportStrategy(Strategy, 'jwt-study') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secret: jwtConstants.secret,
    });
  }

  async validate(payload: any): Promise<any> {
    const valid = await this.authService.verifyUserPayload(payload);

    delete payload.exp;
    const token = this.authService.signToken(payload);

    const isBlackListed = await this.authService.isTokenBlackListed(token);
    
    if (!valid || payload.type !== 'studies' || isBlackListed) {
      throw new UnauthorizedException(); 
    }
    
    return { userId: payload.sub, username: payload.username };
  }
}