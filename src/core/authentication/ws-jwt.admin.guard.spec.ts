import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { WsJwtAdminGuard } from './strategies/ws-jwt-admin.strategy';
import { RoleSlug } from 'src/core/authentication/interfaces/types';

describe('WsJwtAdminGuard (unit)', () => {
  let guard: WsJwtAdminGuard;

  beforeEach(() => {
    guard = new WsJwtAdminGuard();
  });

  describe('getRequest', () => {
    it('uses the websocket handshake as the request (that is where the headers live)', () => {
      const handshake = { headers: { authorization: 'Bearer x' } };
      const getClient = jest.fn().mockReturnValue({ handshake });
      const context = { switchToWs: () => ({ getClient }) } as unknown as ExecutionContext;

      expect(guard.getRequest(context)).toBe(handshake);
      expect(getClient).toHaveBeenCalled();
    });
  });

  describe('handleRequest', () => {
    const admin = { id: 1, username: 'root', role_slug: RoleSlug.ADMIN };

    it('returns the user when there is no error', () => {
      expect(guard.handleRequest(null, admin, undefined)).toBe(admin);
    });

    it('throws a WsException with the access-denied message when there is no user', () => {
      let thrown: any;
      try {
        guard.handleRequest(null, false, { message: 'No auth token' });
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeInstanceOf(WsException);
      expect(thrown.getError()).toBe('Acesso Administrativo Negado');
    });

    it.each([[undefined], [null], [false]])('denies when user is %s', (user) => {
      expect(() => guard.handleRequest(null, user, undefined)).toThrow(WsException);
    });

    it('rethrows the original error when authentication produced one', () => {
      const err = new UnauthorizedException();

      expect(() => guard.handleRequest(err, false, undefined)).toThrow(err);
    });

    it('rethrows the original error even if a user came with it', () => {
      const err = new Error('boom');

      expect(() => guard.handleRequest(err, admin, undefined)).toThrow(err);
    });

    // This is the "admin" guard ("Acesso Administrativo Negado"): an authenticated user that
    // is not an administrator must be denied.
    it('denies an authenticated user who is not an administrator', () => {
      const monitor = { id: 2, username: 'mona', role_slug: RoleSlug.MONITOR };

      expect(() => guard.handleRequest(null, monitor, undefined)).toThrow(WsException);
    });
  });
});
