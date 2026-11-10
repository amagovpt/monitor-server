import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domains/identity/user/user.entity';
import { comparePasswordHash } from '../../common/security';
import axios from 'axios';
import { NAME_CONVERTER, NIC } from './constants/constants';
import { AppLoggerService } from '../app-logger/app-logger.service';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { FgaService } from '../authorization/fga.service';
import { UserPermission } from './interfaces/types';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/types';
export interface JWTTokenPayload {
  username: string;
  sub: number;
  role: string;
  hash: string;
}

/** How long a revoked token is remembered when it carries no usable "exp" claim. */
const FALLBACK_BLACKLIST_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly openFgaService: FgaService,
    private readonly logger: AppLoggerService,
  ) {}

  private async getAuthorizationLevel(userId: number, roleSlug: string): Promise<UserPermission> {
    return this.openFgaService.getAuthorizationLevel(userId, roleSlug);
  }

  async isTokenBlackListed(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `auth:blacklist:${tokenHash}`;
    const exists = await this.redis.exists(redisKey);
    return exists === 1;
  }

  async loginLocal(
    username: string,
    password: string,
  ): Promise<{ id: number; token: string; amsEnv: string; authorizationLevel: string } | null> {
    const AMS_ENV = this.configService.get<string>('AMS_ENV') ?? 'DEV';
    const user = await this.verifyUserCredentials(username, password);
    if (!user || !user.id || !user.username || !user.role || !user.uniqueHash) {
      throw new UnauthorizedException();
    }
    const payload: JWTTokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role?.slug,
      hash: user.uniqueHash,
    };
    const authorizationLevel = await this.getAuthorizationLevel(user.id, user.role?.slug);
    return { id: user.id, token: this.signToken(payload), amsEnv: AMS_ENV, authorizationLevel };
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const result = await this.userRepository.update(userId, { lastLogin: date });

    if (!(result.affected != null && result.affected > 0)) {
      throw new InternalServerErrorException(`Failed to update last login for user ${userId}`);
    }
  }

  async verifyUserCredentials(username: string, password: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: ['role'],
      select: ['id', 'username', 'password', 'role', 'uniqueHash'],
    });

    if (user && (await comparePasswordHash(password, user.password))) {
      const { password: _, createdAt: __, lastLogin: ___, ...userWithoutPrivateDetails } = user;

      return userWithoutPrivateDetails;
    } else {
      return null;
    }
  }

  async verifyUserPayload(payload: JWTTokenPayload): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'uniqueHash'],
    });

    return !!user && user.uniqueHash === payload.hash;
  }

  generateAuthToken(user: User): string {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role.slug,
      hash: user.uniqueHash,
    };
    return this.signToken(payload);
  }

  signToken(payload: JWTTokenPayload): string {
    return this.jwtService.sign(payload, { algorithm: 'HS256' });
  }

  verifyJWT(jwt: string): any {
    return this.jwtService.verify(jwt);
  }

  async logout(token: string): Promise<void> {
    const alreadyInvalid = await this.isTokenBlackListed(token);
    if (alreadyInvalid) {
      return;
    }

    let ttlSeconds: number;
    try {
      const payload = this.jwtService.decode(token);
      if (payload?.exp) {
        ttlSeconds = Math.ceil(payload.exp - Date.now() / 1000);
        // already expired: nothing to revoke
        if (ttlSeconds <= 0) return;
      } else {
        // a token without "exp" never expires by itself, so it must still be revoked
        ttlSeconds = FALLBACK_BLACKLIST_TTL_SECONDS;
      }
    } catch {
      this.logger.warn('Could not decode JWT exp, using fallback expiration');
      ttlSeconds = FALLBACK_BLACKLIST_TTL_SECONDS;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `auth:blacklist:${tokenHash}`;

    await this.redis.set(redisKey, '1', 'EX', ttlSeconds, 'NX');

    return;
  }

  async verifyLoginUser(token: string) {
    const atributes = await this.getAtributes(token);
    const ccNumber = atributes.cc;
    if (!ccNumber) {
      return null;
    }
    await this.userRepository.update({ ccNumber }, { lastLogin: new Date() });
    return this.userRepository.findOne({ where: { ccNumber } });
  }
  async getAtributes(token: string) {
    const AUTH_SERVER = this.configService.get('AUTH_SERVER');
    const atributesName = [
      'http://interop.gov.pt/MDC/Cidadao/NIC',
      'http://interop.gov.pt/MDC/Cidadao/NomeCompleto',
    ];
    const responseStart = await axios.post(
      `${AUTH_SERVER}/oauthresourceserver/api/AttributeManager`,
      { token, atributesName },
    );
    const authenticationContextId = responseStart.data.authenticationContextId;
    // `params` URL-encodes the values, so tokens with "+", "&", "#" etc. arrive intact
    const responseAtributes = await axios.get(
      `${AUTH_SERVER}/oauthresourceserver/api/AttributeManager`,
      { params: { token, authenticationContextId } },
    );
    return this.parseAtributes(responseAtributes.data);
  }

  private parseAtributes(atributes: any[]) {
    const result = { cc: null, name: '' };
    atributes.forEach((attr) => {
      const mappedKey = NAME_CONVERTER[attr.name];
      if (mappedKey) result[mappedKey] = attr.value;
    });
    return result;
  }
}
