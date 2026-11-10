import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import {
  ContextEnum,
  ContextHierarchyByRole,
  ContextMap,
} from 'src/domains/inventory/context/context.enum';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { ContextFilterGuard } from './context.guard';

const allContexts = Object.values(ContextEnum) as ContextEnum[];
const hierarchy = ContextHierarchyByRole as unknown as Record<string, ContextEnum[]>;
const configuredRoles = Object.keys(hierarchy);

const allowedFor = (role: string): ContextEnum[] => hierarchy[role] ?? [];
const forbiddenFor = (role: string): ContextEnum[] =>
  allContexts.filter((c) => !allowedFor(role).includes(c));

const buildExecutionContext = (user: unknown, body: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user, body }),
    }),
  }) as unknown as ExecutionContext;

const buildUser = (role: string) => ({
  id: 1,
  username: 'test-user',
  role_slug: role,
  context: { id: 1, code: 'TEST' },
});

/**
 * The places where a client may send contexts:
 * - `body.contexts` (WebsiteQueryRequestDTO)
 * - `body.filters.contexts`
 */
const bodyShapes: Array<[string, (value: unknown) => unknown]> = [
  ['body.contexts', (value) => ({ contexts: value })],
  ['body.filters.contexts', (value) => ({ filters: { contexts: value } })],
];

describe('ContextFilterGuard', () => {
  let guard: ContextFilterGuard;

  const run = (role: string, body: unknown) =>
    guard.canActivate(buildExecutionContext(buildUser(role), body));

  beforeEach(() => {
    guard = new ContextFilterGuard();
  });

  describe('test setup sanity', () => {
    it('MONITOR is configured in ContextHierarchyByRole', () => {
      expect(allowedFor(RoleSlug.MONITOR).length).toBeGreaterThan(0);
    });

    it('MONITOR has at least one forbidden context (e.g. AMS)', () => {
      expect(forbiddenFor(RoleSlug.MONITOR).length).toBeGreaterThan(0);
    });
  });

  describe('authentication / authorization setup', () => {
    it('throws Forbidden when there is no authenticated user', () => {
      const ctx = buildExecutionContext(undefined, { contexts: [allContexts[0]] });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws Forbidden when the role has no authorized contexts and contexts are requested', () => {
      expect(() => run('unknown_role', { contexts: [allContexts[0]] })).toThrow(ForbiddenException);
    });

    it('allows an unknown role when no contexts are requested', () => {
      expect(run('unknown_role', {})).toBe(true);
    });
  });

  describe('requests without contexts', () => {
    it.each([
      ['undefined body', undefined],
      ['null body', null],
      ['non-object body', 'text'],
      ['empty body', {}],
      ['null contexts', { contexts: null }],
      ['empty contexts array', { contexts: [] }],
      ['empty filters', { filters: {} }],
      ['null filters', { filters: null }],
      ['null filters.contexts', { filters: { contexts: null } }],
      ['empty filters.contexts array', { filters: { contexts: [] } }],
      ['both empty', { contexts: [], filters: { contexts: [] } }],
    ])('allows MONITOR with %s', (_label, body) => {
      expect(run(RoleSlug.MONITOR, body)).toBe(true);
    });
  });

  describe.each(bodyShapes)('MONITOR requesting forbidden contexts via %s', (_shape, build) => {
    it.each(forbiddenFor(RoleSlug.MONITOR))('blocks %s as a single string', (forbidden) => {
      expect(() => run(RoleSlug.MONITOR, build(forbidden))).toThrow(ForbiddenException);
    });

    it.each(forbiddenFor(RoleSlug.MONITOR))('blocks %s inside an array', (forbidden) => {
      expect(() => run(RoleSlug.MONITOR, build([forbidden]))).toThrow(ForbiddenException);
    });

    it.each(forbiddenFor(RoleSlug.MONITOR))(
      'blocks %s when lowercase and padded with whitespace',
      (forbidden) => {
        expect(() =>
          run(RoleSlug.MONITOR, build([`  ${String(forbidden).toLowerCase()} `])),
        ).toThrow(ForbiddenException);
      },
    );

    it.each(forbiddenFor(RoleSlug.MONITOR))('blocks %s sent as numeric id', (forbidden) => {
      const id = (ContextMap as Record<string, number>)[forbidden];
      expect(id).toBeDefined();
      expect(() => run(RoleSlug.MONITOR, build([id]))).toThrow(ForbiddenException);
    });

    it.each(forbiddenFor(RoleSlug.MONITOR))(
      'blocks %s when mixed with an allowed context (any order)',
      (forbidden) => {
        const allowed = allowedFor(RoleSlug.MONITOR)[0];
        expect(() => run(RoleSlug.MONITOR, build([allowed, forbidden]))).toThrow(
          ForbiddenException,
        );
        expect(() => run(RoleSlug.MONITOR, build([forbidden, allowed]))).toThrow(
          ForbiddenException,
        );
      },
    );

    it('blocks all forbidden contexts requested together', () => {
      expect(() => run(RoleSlug.MONITOR, build(forbiddenFor(RoleSlug.MONITOR)))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe.each(bodyShapes)('MONITOR requesting allowed contexts via %s', (_shape, build) => {
    it.each(allowedFor(RoleSlug.MONITOR))('allows %s as a single string', (allowed) => {
      expect(run(RoleSlug.MONITOR, build(allowed))).toBe(true);
    });

    it.each(allowedFor(RoleSlug.MONITOR))('allows %s inside an array', (allowed) => {
      expect(run(RoleSlug.MONITOR, build([allowed]))).toBe(true);
    });

    it.each(allowedFor(RoleSlug.MONITOR))('allows %s sent as numeric id', (allowed) => {
      const id = (ContextMap as Record<string, number>)[allowed];
      expect(id).toBeDefined();
      expect(run(RoleSlug.MONITOR, build([id]))).toBe(true);
    });

    it('allows lowercase and padded values of an allowed context', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      expect(run(RoleSlug.MONITOR, build([` ${String(allowed).toLowerCase()} `]))).toBe(true);
    });

    it('allows all contexts of its hierarchy together', () => {
      expect(run(RoleSlug.MONITOR, build(allowedFor(RoleSlug.MONITOR)))).toBe(true);
    });
  });

  describe('contexts sent in both places at once', () => {
    it('blocks when filters.contexts is allowed but body.contexts is forbidden', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      const forbidden = forbiddenFor(RoleSlug.MONITOR)[0];
      expect(() =>
        run(RoleSlug.MONITOR, { contexts: [forbidden], filters: { contexts: [allowed] } }),
      ).toThrow(ForbiddenException);
    });

    it('blocks when body.contexts is allowed but filters.contexts is forbidden', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      const forbidden = forbiddenFor(RoleSlug.MONITOR)[0];
      expect(() =>
        run(RoleSlug.MONITOR, { contexts: [allowed], filters: { contexts: [forbidden] } }),
      ).toThrow(ForbiddenException);
    });

    it('allows when both places only contain allowed contexts', () => {
      const allowed = allowedFor(RoleSlug.MONITOR);
      expect(run(RoleSlug.MONITOR, { contexts: allowed, filters: { contexts: allowed } })).toBe(
        true,
      );
    });
  });

  describe('every configured role', () => {
    describe.each(bodyShapes)('via %s', (_shape, build) => {
      it.each(configuredRoles)('can request each context it owns (%s)', (role) => {
        for (const allowed of allowedFor(role)) {
          expect(run(role, build([allowed]))).toBe(true);
        }
      });

      it.each(configuredRoles)('cannot request contexts it does not own (%s)', (role) => {
        for (const forbidden of forbiddenFor(role)) {
          expect(() => run(role, build([forbidden]))).toThrow(ForbiddenException);
        }
      });
    });
  });

  describe.each(bodyShapes)('invalid values via %s (fail closed)', (_shape, build) => {
    it.each([
      ['unknown string', 'NOT_A_CONTEXT'],
      ['empty string', ''],
      ['whitespace string', '   '],
      ['unknown number', 999999],
      ['negative number', -1],
      ['NaN', NaN],
      ['boolean', true],
      ['object', { code: 'AMS' }],
      ['nested array', [allContexts[0]]],
    ])('throws BadRequest for %s', (_label, value) => {
      expect(() => run(RoleSlug.MONITOR, build([value]))).toThrow(BadRequestException);
    });

    it('throws BadRequest for an invalid single (non-array) value', () => {
      expect(() => run(RoleSlug.MONITOR, build('NOT_A_CONTEXT'))).toThrow(BadRequestException);
    });

    it('does not let an invalid value bypass the check when mixed with valid ones', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      expect(() => run(RoleSlug.MONITOR, build([allowed, 'NOT_A_CONTEXT']))).toThrow(
        BadRequestException,
      );
    });

    it('does not let an invalid value bypass the check when mixed with forbidden ones', () => {
      const forbidden = forbiddenFor(RoleSlug.MONITOR)[0];
      expect(() => run(RoleSlug.MONITOR, build([forbidden, 'NOT_A_CONTEXT']))).toThrow(
        BadRequestException,
      );
    });
  });

  describe('request integrity', () => {
    it('does not mutate the request body', () => {
      const allowed = allowedFor(RoleSlug.MONITOR)[0];
      const body = {
        contexts: [` ${String(allowed).toLowerCase()} `],
        filters: { contexts: [allowed] },
      };
      const snapshot = JSON.parse(JSON.stringify(body));

      run(RoleSlug.MONITOR, body);

      expect(body).toEqual(snapshot);
    });
  });
});
