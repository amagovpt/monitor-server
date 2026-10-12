import * as crypto from 'crypto';
import axios from 'axios';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { AuthService, JWTTokenPayload } from 'src/core/authentication/auth.service';
import { NAME_CONVERTER } from 'src/core/authentication/constants/constants';
import { comparePasswordHash } from 'src/common/security';

jest.mock('axios');
jest.mock('src/common/security', () => ({ comparePasswordHash: jest.fn() }));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCompare = comparePasswordHash as jest.Mock;

const ATTR_NIC = 'http://interop.gov.pt/MDC/Cidadao/NIC';
const ATTR_NAME = 'http://interop.gov.pt/MDC/Cidadao/NomeCompleto';
const attrNameFor = (field: string, fallback: string) =>
  Object.entries(NAME_CONVERTER as Record<string, string>).find(([, v]) => v === field)?.[0] ??
  fallback;
const CC_ATTR = attrNameFor('cc', ATTR_NIC);
const NAME_ATTR = attrNameFor('name', ATTR_NAME);

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

describe('AuthService (unit, mocked collaborators)', () => {
  let service: AuthService;

  const userRepository = { findOne: jest.fn(), update: jest.fn() };
  const redis = { exists: jest.fn(), set: jest.fn() };
  const jwtService = { sign: jest.fn(), verify: jest.fn(), decode: jest.fn() };
  const config: Record<string, string | undefined> = {};
  const configService = { get: jest.fn((k: string) => config[k]) };
  const fga = { getAuthorizationLevel: jest.fn() };
  const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };

  const NOW = new Date('2026-01-15T12:00:00.000Z');
  const nowSec = Math.floor(NOW.getTime() / 1000);

  beforeEach(() => {
    jest.resetAllMocks();
    configService.get.mockImplementation((k: string) => config[k]);
    for (const k of Object.keys(config)) delete config[k];
    jest.useFakeTimers({ now: NOW });

    service = new AuthService(
      userRepository as any,
      redis as any,
      jwtService as any,
      configService as any,
      fga as any,
      logger as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  describe('isTokenBlackListed', () => {
    it('looks the token up by its sha256 hash under auth:blacklist:', async () => {
      redis.exists.mockResolvedValue(0);

      await service.isTokenBlackListed('my.jwt.token');

      expect(redis.exists).toHaveBeenCalledWith(`auth:blacklist:${sha('my.jwt.token')}`);
    });

    it('is true when the key exists and false when it does not', async () => {
      redis.exists.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      expect(await service.isTokenBlackListed('t')).toBe(true);
      expect(await service.isTokenBlackListed('t')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyUserCredentials', () => {
    const stored = {
      id: 1,
      username: 'alice',
      password: 'stored-hash',
      uniqueHash: 'h',
      role: { slug: 'admin' },
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    it('looks the user up by username including role, password and uniqueHash', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await service.verifyUserCredentials('alice', 'pw');

      const args = userRepository.findOne.mock.calls[0][0];
      expect(args.where).toEqual({ username: 'alice' });
      expect(args.relations).toContain('role');
      expect(args.select).toEqual(
        expect.arrayContaining(['id', 'username', 'password', 'uniqueHash']),
      );
    });

    it('compares the given password with the stored hash', async () => {
      userRepository.findOne.mockResolvedValue(stored);
      mockedCompare.mockResolvedValue(true);

      await service.verifyUserCredentials('alice', 'pw');

      expect(mockedCompare).toHaveBeenCalledWith('pw', 'stored-hash');
    });

    it('returns the user without password, createdAt and lastLogin when the password matches', async () => {
      userRepository.findOne.mockResolvedValue({ ...stored });
      mockedCompare.mockResolvedValue(true);

      const res = await service.verifyUserCredentials('alice', 'pw');

      expect(res).toEqual({ id: 1, username: 'alice', uniqueHash: 'h', role: { slug: 'admin' } });
    });

    it('returns null when the password does not match', async () => {
      userRepository.findOne.mockResolvedValue({ ...stored });
      mockedCompare.mockResolvedValue(false);

      expect(await service.verifyUserCredentials('alice', 'bad')).toBeNull();
    });

    it('returns null for an unknown user, without comparing any password', async () => {
      userRepository.findOne.mockResolvedValue(null);

      expect(await service.verifyUserCredentials('ghost', 'pw')).toBeNull();
      expect(mockedCompare).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('loginLocal', () => {
    const good = { id: 5, username: 'alice', uniqueHash: 'h', role: { slug: 'admin' } };

    beforeEach(() => {
      jest.spyOn(service, 'verifyUserCredentials').mockResolvedValue(good as any);
      fga.getAuthorizationLevel.mockResolvedValue('LEVEL_ADMIN');
      jwtService.sign.mockReturnValue('signed.jwt');
    });

    it('returns id, signed token, environment and authorization level', async () => {
      config.AMS_ENV = 'PROD';

      const res = await service.loginLocal('alice', 'pw');

      expect(res).toEqual({
        id: 5,
        token: 'signed.jwt',
        amsEnv: 'PROD',
        authorizationLevel: 'LEVEL_ADMIN',
      });
    });

    it('signs sub, username, role slug and hash (and nothing else)', async () => {
      await service.loginLocal('alice', 'pw');

      expect(jwtService.sign.mock.calls[0][0]).toEqual({
        sub: 5,
        username: 'alice',
        role: 'admin',
        hash: 'h',
      });
    });

    it('asks the authorization service for the level of this user and role', async () => {
      await service.loginLocal('alice', 'pw');

      expect(fga.getAuthorizationLevel).toHaveBeenCalledWith(5, 'admin');
    });

    it("defaults the environment to 'DEV'", async () => {
      expect((await service.loginLocal('alice', 'pw'))!.amsEnv).toBe('DEV');
    });

    it('verifies the given credentials', async () => {
      await service.loginLocal('alice', 'pw');

      expect(service.verifyUserCredentials).toHaveBeenCalledWith('alice', 'pw');
    });

    it.each([
      ['no user', null],
      ['no id', { ...good, id: undefined }],
      ['no username', { ...good, username: undefined }],
      ['no role', { ...good, role: undefined }],
      ['no uniqueHash', { ...good, uniqueHash: undefined }],
    ])('throws UnauthorizedException when the credentials result has %s', async (_l, value) => {
      (service.verifyUserCredentials as jest.Mock).mockResolvedValue(value);

      await expect(service.loginLocal('alice', 'pw')).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(fga.getAuthorizationLevel).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('updateUserLastLogin', () => {
    it("updates the user's lastLogin with the current UTC time as 'YYYY-MM-DD HH:mm:ss'", async () => {
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateUserLastLogin(9);

      expect(userRepository.update).toHaveBeenCalledWith(9, { lastLogin: '2026-01-15 12:00:00' });
    });

    it.each([[0], [undefined], [null]])(
      'throws InternalServerErrorException when affected is %s',
      async (affected) => {
        userRepository.update.mockResolvedValue({ affected });

        await expect(service.updateUserLastLogin(9)).rejects.toThrow(InternalServerErrorException);
        await expect(service.updateUserLastLogin(9)).rejects.toThrow(
          'Failed to update last login for user 9',
        );
      },
    );
  });

  // -------------------------------------------------------------------------
  describe('verifyUserPayload', () => {
    const payload: JWTTokenPayload = { sub: 3, username: 'a', role: 'r', hash: 'h' };

    it('looks the user up by the id in the token', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await service.verifyUserPayload(payload);

      expect(userRepository.findOne.mock.calls[0][0].where).toEqual({ id: 3 });
    });

    it('is true when the stored hash equals the token hash', async () => {
      userRepository.findOne.mockResolvedValue({ id: 3, uniqueHash: 'h' });

      expect(await service.verifyUserPayload(payload)).toBe(true);
    });

    it('is false when the hash differs', async () => {
      userRepository.findOne.mockResolvedValue({ id: 3, uniqueHash: 'other' });

      expect(await service.verifyUserPayload(payload)).toBe(false);
    });

    it('is false when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      expect(await service.verifyUserPayload(payload)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('generateAuthToken / signToken / verifyJWT', () => {
    it('generateAuthToken signs username, sub, role slug and hash', () => {
      jwtService.sign.mockReturnValue('tok');
      const user = { id: 4, username: 'bob', uniqueHash: 'hb', role: { slug: 'monitor' } } as any;

      expect(service.generateAuthToken(user)).toBe('tok');
      expect(jwtService.sign.mock.calls[0][0]).toEqual({
        username: 'bob',
        sub: 4,
        role: 'monitor',
        hash: 'hb',
      });
    });

    it('signToken signs with HS256', () => {
      jwtService.sign.mockReturnValue('tok');
      const payload: JWTTokenPayload = { sub: 1, username: 'a', role: 'r', hash: 'h' };

      expect(service.signToken(payload)).toBe('tok');
      expect(jwtService.sign).toHaveBeenCalledWith(payload, { algorithm: 'HS256' });
    });

    it('verifyJWT returns the verified payload and lets verification errors through', () => {
      jwtService.verify.mockReturnValueOnce({ sub: 1 });
      expect(service.verifyJWT('tok')).toEqual({ sub: 1 });
      expect(jwtService.verify).toHaveBeenCalledWith('tok');

      const err = new Error('jwt expired');
      jwtService.verify.mockImplementationOnce(() => {
        throw err;
      });
      expect(() => service.verifyJWT('tok')).toThrow(err);
    });
  });

  // -------------------------------------------------------------------------
  describe('logout', () => {
    const key = (t: string) => `auth:blacklist:${sha(t)}`;

    beforeEach(() => {
      redis.exists.mockResolvedValue(0);
    });

    it('blacklists the token hash until the token expires', async () => {
      jwtService.decode.mockReturnValue({ exp: nowSec + 120 });

      await service.logout('tok');

      expect(redis.set).toHaveBeenCalledWith(key('tok'), '1', 'EX', 120, 'NX');
    });

    it('rounds the remaining lifetime up to whole seconds', async () => {
      jest.setSystemTime(new Date(NOW.getTime() + 400)); // 0.4 s into the second
      jwtService.decode.mockReturnValue({ exp: nowSec + 10 });

      await service.logout('tok');

      expect(redis.set.mock.calls[0][3]).toBe(10); // 9.6 s left -> 10
    });

    it('does nothing when the token is already blacklisted', async () => {
      redis.exists.mockResolvedValue(1);

      await service.logout('tok');

      expect(redis.set).not.toHaveBeenCalled();
    });

    it('does nothing for a token that has already expired', async () => {
      jwtService.decode.mockReturnValue({ exp: nowSec - 5 });

      await service.logout('tok');

      expect(redis.set).not.toHaveBeenCalled();
    });

    it('falls back to a 24 h entry (and warns) when the token cannot be decoded', async () => {
      jwtService.decode.mockImplementation(() => {
        throw new Error('bad token');
      });

      await service.logout('tok');

      expect(logger.warn).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(key('tok'), '1', 'EX', 24 * 60 * 60, 'NX');
    });

    // A token without "exp" never expires by itself, so logout must still revoke it.
    it('still revokes a token that has no expiry claim', async () => {
      jwtService.decode.mockReturnValue({ sub: 1 });

      await service.logout('tok');

      expect(redis.set).toHaveBeenCalledTimes(1);
      const ttl = redis.set.mock.calls[0][3];
      expect(ttl).toBeGreaterThan(0);
    });

    it('never stores the raw token', async () => {
      jwtService.decode.mockReturnValue({ exp: nowSec + 60 });

      await service.logout('super.secret.token');

      expect(JSON.stringify(redis.set.mock.calls)).not.toContain('super.secret.token');
    });
  });

  // -------------------------------------------------------------------------
  describe('getAtributes', () => {
    beforeEach(() => {
      config.AUTH_SERVER = 'https://auth.example';
      mockedAxios.post.mockResolvedValue({ data: { authenticationContextId: 'ctx-1' } });
      mockedAxios.get.mockResolvedValue({ data: [] });
    });

    it('posts the token and requested attribute names to the AttributeManager', async () => {
      await service.getAtributes('tok');

      const [url, body] = mockedAxios.post.mock.calls[0] as any;
      expect(url).toBe('https://auth.example/oauthresourceserver/api/AttributeManager');
      expect(body.token).toBe('tok');
      expect(body.atributesName).toEqual(expect.arrayContaining([ATTR_NIC, ATTR_NAME]));
    });

    it('then fetches the attributes using the returned authenticationContextId', async () => {
      await service.getAtributes('tok');

      const url = new URL(mockedAxios.get.mock.calls[0][0] as string);
      expect(url.origin + url.pathname).toBe(
        'https://auth.example/oauthresourceserver/api/AttributeManager',
      );
      expect(url.searchParams.get('token')).toBe('tok');
      expect(url.searchParams.get('authenticationContextId')).toBe('ctx-1');
    });

    it('maps known attributes to { cc, name } and ignores unknown ones', async () => {
      mockedAxios.get.mockResolvedValue({
        data: [
          { name: CC_ATTR, value: '123' },
          { name: NAME_ATTR, value: 'Maria' },
          { name: 'unknown', value: 'x' },
        ],
      });

      expect(await service.getAtributes('tok')).toEqual({ cc: '123', name: 'Maria' });
    });

    it('returns cc null and an empty name when the provider returned nothing', async () => {
      expect(await service.getAtributes('tok')).toEqual({ cc: null, name: '' });
    });

    it('does not call the second endpoint when the first one fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network'));

      await expect(service.getAtributes('tok')).rejects.toThrow('network');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('URL-encodes the token so reserved characters survive', async () => {
      const token = 'a+b/c=d&e=f#g';

      await service.getAtributes(token);

      const url = new URL(mockedAxios.get.mock.calls[0][0] as string);
      expect(url.searchParams.get('token')).toBe(token);
    });
  });

  // -------------------------------------------------------------------------
  describe('verifyLoginUser', () => {
    it('returns null without touching the database when the provider gave no cc number', async () => {
      jest.spyOn(service, 'getAtributes').mockResolvedValue({ cc: null, name: 'x' });

      expect(await service.verifyLoginUser('tok')).toBeNull();
      expect(userRepository.update).not.toHaveBeenCalled();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('records the login for that cc number and returns the matching user', async () => {
      jest.spyOn(service, 'getAtributes').mockResolvedValue({ cc: '123', name: 'x' } as any);
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValue({ id: 8, ccNumber: '123' });

      const res = await service.verifyLoginUser('tok');

      expect(userRepository.update).toHaveBeenCalledWith({ ccNumber: '123' }, { lastLogin: NOW });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { ccNumber: '123' } });
      expect(res).toEqual({ id: 8, ccNumber: '123' });
    });

    it('returns null when no user has that cc number', async () => {
      jest.spyOn(service, 'getAtributes').mockResolvedValue({ cc: '999', name: 'x' } as any);
      userRepository.update.mockResolvedValue({ affected: 0 });
      userRepository.findOne.mockResolvedValue(null);

      expect(await service.verifyLoginUser('tok')).toBeNull();
    });
  });
});
