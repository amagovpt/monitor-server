import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import {
  ContextEnum,
  ContextHierarchyByRole,
  ContextMap,
} from 'src/domains/inventory/context/context.enum';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { ContextFilterGuard } from './context.guard';

const allContexts = Object.values(ContextEnum) as ContextEnum[];

const allowedFor = (role: RoleSlug): ContextEnum[] => ContextHierarchyByRole[role] ?? [];
const forbiddenFor = (role: RoleSlug): ContextEnum[] =>
  allContexts.filter((c) => !allowedFor(role).includes(c));

const buildUser = (role: RoleSlug | string): AuthenticatedUser =>
  ({
    id: 1,
    username: 'test-user',
    role_slug: role as RoleSlug,
    context: { id: 1, code: 'TEST' },
  }) as AuthenticatedUser;

const buildExecutionContext = (user: unknown, body: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user, body }),
    }),
  }) as unknown as ExecutionContext;

/**
 * The body shapes in which a client may send contexts, following
 * WebsiteQueryRequestDTO (top-level `contexts`) and the guard (`filters.contexts`).
 */
const bodyShapes: Array<[string, (value: unknown) => unknown]> = [
  ['body.filters.contexts', (value) => ({ filters: { contexts: value } })],
  ['body.contexts (WebsiteQueryRequestDTO)', (value) => ({ contexts: value })],
];

describe('ContextFilterGuard', () => {
  let guard: ContextFilterGuard;

  beforeEach(() => {
    guard = new ContextFilterGuard();
  });

  const run = (role: RoleSlug | string, body: unknown) =>
    guard.canActivate(buildExecutionContext(buildUser(role), body));

  describe('test setup sanity', () => {
    it('MONITOR has at least one forbidden context (e.g. AMS)', () => {
      expect(forbiddenFor(RoleSlug.MONITOR).length).toBeGreaterThan(0);
    });

    it('MONITOR has at least one allowed context', () => {
      expect(allowedFor(RoleSlug.MONITOR).length).toBeGreaterThan(0);
    });
  });

  describe('authentication', () => {
    it('throws Forbidden when there is no authenticated user', () => {
      const ctx = buildExecutionContext(undefined, {
        filters: { contexts: [allContexts[0]] },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws Forbidden when the role has no authorized contexts', () => {
      expect(() => run('unknown_role', { filters: { contexts: [allContexts[0]] } })).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('requests without contexts', () => {
    it.each([
      ['undefined body', undefined],
      ['empty body', {}],
      ['empty filters', { filters: {} }],
      ['null filters.contexts', { filters: { contexts: null } }],
      ['empty filters.contexts array', { filters: { contexts: [] } }],
    ])('allows MONITOR with %s', (_label, body) => {
      expect(run(RoleSlug.MONITOR, body)).toBe(true);
    });
  });

  describe.each(bodyShapes)('MONITOR requesting forbidden contexts via %s', (_shape, build) => {
    forbiddenFor(RoleSlug.MONITOR).forEach((forbidden) => {
      describe(`context ${forbidden}`, () => {
        it('is blocked as a single string', () => {
          expect(() => run(RoleSlug.MONITOR, build(forbidden))).toThrow(ForbiddenException);
        });

        it('is blocked inside an array', () => {
          expect(() => run(RoleSlug.MONITOR, build([forbidden]))).toThrow(ForbiddenException);
        });

        it('is blocked when lowercase and padded with whitespace', () => {
          expect(() =>
            run(RoleSlug.MONITOR, build([`  ${String(forbidden).toLowerCase()} `])),
          ).toThrow(ForbiddenException);
        });

        it('is blocked when sent as numeric id', () => {
          const id = (ContextMap as Record<string, number>)[forbidden];
          if (id === undefined) return;
          expect(() => run(RoleSlug.MONITOR, build([id]))).toThrow(ForbiddenException);
        });

        it('is blocked when mixed with an allowed context', () => {
          const allowed = allowedFor(RoleSlug.MONITOR)[0];
          expect(() => run(RoleSlug.MONITOR, build([allowed, forbidden]))).toThrow(
            ForbiddenException,
          );
          expect(() => run(RoleSlug.MONITOR, build([forbidden, allowed]))).toThrow(
            ForbiddenException,
          );
        });
      });
    });
  });

  describe.each(bodyShapes)('MONITOR requesting allowed contexts via %s', (_shape, build) => {
    allowedFor(RoleSlug.MONITOR).forEach((allowed) => {
      it(`allows context ${allowed}`, () => {
        expect(run(RoleSlug.MONITOR, build([allowed]))).toBe(true);
      });
    });

    it('allows all contexts of its hierarchy together', () => {
      expect(run(RoleSlug.MONITOR, build(allowedFor(RoleSlug.MONITOR)))).toBe(true);
    });
  });

  describe('contexts sent in both places at once', () => {
    it('blocks MONITOR when filters.contexts is allowed but body.contexts is forbidden', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      const forbidden = forbiddenFor(RoleSlug.MONITOR)[0];
      expect(() =>
        run(RoleSlug.MONITOR, { filters: { contexts: [allowed] }, contexts: [forbidden] }),
      ).toThrow(ForbiddenException);
    });

    it('blocks MONITOR when body.contexts is allowed but filters.contexts is forbidden', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      const forbidden = forbiddenFor(RoleSlug.MONITOR)[0];
      expect(() =>
        run(RoleSlug.MONITOR, { filters: { contexts: [forbidden] }, contexts: [allowed] }),
      ).toThrow(ForbiddenException);
    });
  });

  describe('ADMIN', () => {
    it.each(bodyShapes)('can request every context it owns via %s', (_shape, build) => {
      for (const allowed of allowedFor(RoleSlug.ADMIN)) {
        expect(run(RoleSlug.ADMIN, build([allowed]))).toBe(true);
      }
    });

    it.each(bodyShapes)('cannot request contexts outside its hierarchy via %s', (_shape, build) => {
      for (const forbidden of forbiddenFor(RoleSlug.ADMIN)) {
        expect(() => run(RoleSlug.ADMIN, build([forbidden]))).toThrow(ForbiddenException);
      }
    });
  });

  describe.each(bodyShapes)('invalid values via %s (fail closed)', (_shape, build) => {
    it.each([
      ['unknown string', 'NOT_A_CONTEXT'],
      ['unknown number', 999999],
      ['boolean', true],
      ['object', { code: 'AMS' }],
      ['empty string', ''],
    ])('throws BadRequest for %s', (_label, value) => {
      expect(() => run(RoleSlug.MONITOR, build([value]))).toThrow(BadRequestException);
    });

    it('does not let an invalid value bypass the check when mixed with valid ones', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      expect(() => run(RoleSlug.MONITOR, build([allowed, 'NOT_A_CONTEXT']))).toThrow(
        BadRequestException,
      );
    });
  });
});
