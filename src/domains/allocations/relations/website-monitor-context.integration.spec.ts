import { randomUUID } from 'crypto';
import { join } from 'path';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { Website } from 'src/domains/inventory/website/website.entity';
import { Context } from 'src/domains/inventory/context/context.entity';
import { ContextEnum, ContextMap } from 'src/domains/inventory/context/context.enum';
import { Role } from 'src/domains/identity/role/roles.entity';
import { User, PermissionLevel } from 'src/domains/identity/user/user.entity';
import { Team } from 'src/domains/identity/team/team.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { UserWebsite } from './user-websites/user-websites.entity';
import { TeamWebsites } from './team-websites/team-websites.entity';
import { UserWebsitesService } from './user-websites/user-websites.service';
import { TeamWebsitesService } from './team-websites/team-websites.service';
import {
  attachWebsitesToMonitorContext,
  detachOrphanWebsitesFromMonitorContext,
} from './website-monitor-context.helper';

const MONITOR_ID = ContextMap[ContextEnum.MONITOR];
const OBSERVATORY_ID = ContextMap[ContextEnum.OBSERVATORY];

describe('Website <-> MONITOR context (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let roleId: number;
  let seq = 0;

  let outbox: { putInOutbox: jest.Mock; putManyInOutbox: jest.Mock };
  let userService: UserWebsitesService;
  let teamService: TeamWebsitesService;

  // ---------------------------------------------------------------------------
  // Infra
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      entities: [join(__dirname, '../../../**/*.entity.{ts,js}')],
      synchronize: true,
      logging: false,
    });
    await dataSource.initialize();
  }, 120_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await container?.stop();
  });

  beforeEach(async () => {
    await truncateAll();
    await seedContexts();
    roleId = await insertRow(Role);

    outbox = {
      putInOutbox: jest.fn().mockResolvedValue(undefined),
      putManyInOutbox: jest.fn().mockResolvedValue(undefined),
    };
    userService = new UserWebsitesService(
      dataSource.getRepository(UserWebsite),
      outbox as unknown as OutboxService,
    );
    teamService = new TeamWebsitesService(
      dataSource.getRepository(TeamWebsites),
      outbox as unknown as OutboxService,
    );
  });

  // ---------------------------------------------------------------------------
  // Helpers de dados
  // ---------------------------------------------------------------------------

  async function truncateAll(): Promise<void> {
    const tables = dataSource.entityMetadatas.map((m) => `"${m.tableName}"`);
    const unique = Array.from(new Set(tables)).join(', ');
    await dataSource.query(`TRUNCATE TABLE ${unique} RESTART IDENTITY CASCADE`);
  }

  async function seedContexts(): Promise<void> {
    await dataSource.getRepository(Context).insert(
      Object.values(ContextEnum).map((code) => ({
        id: ContextMap[code],
        code,
        name: code,
      })),
    );
  }

  function sampleValue(column: ColumnMetadata): unknown {
    if (column.enum && column.enum.length > 0) return column.enum[0];

    const type = column.type;
    const typeName = String(type).toLowerCase();

    if (
      type === Number ||
      ['int', 'integer', 'int2', 'int4', 'int8', 'smallint', 'bigint'].includes(typeName) ||
      ['numeric', 'decimal', 'float', 'double precision', 'real'].includes(typeName)
    ) {
      return 1;
    }
    if (type === Boolean || typeName === 'boolean') return false;
    if (typeName === 'uuid') return randomUUID();
    if (typeName === 'json' || typeName === 'jsonb') return {};
    if (type === Date || /timestamp|date|time/.test(typeName)) return new Date();

    const value = `${column.propertyName}-${++seq}`;
    return column.length ? value.slice(0, Number(column.length)) : value;
  }

  /**
   * Insere uma linha preenchendo automaticamente as colunas obrigatórias
   * (not null, sem default, não geradas). Os `overrides` têm prioridade.
   * Devolve o `id` gerado (quando existe).
   */
  async function insertRow(
    entity: EntityTarget<ObjectLiteral>,
    overrides: Record<string, unknown> = {},
  ): Promise<number> {
    const metadata = dataSource.getMetadata(entity);
    const row: Record<string, unknown> = {};

    for (const column of metadata.columns) {
      if (
        column.isGenerated ||
        column.isCreateDate ||
        column.isUpdateDate ||
        column.isDeleteDate ||
        column.isVersion ||
        column.isNullable ||
        column.default !== undefined
      ) {
        continue;
      }
      row[column.propertyName] = sampleValue(column);
    }

    const result = await dataSource
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values({ ...row, ...overrides })
      .execute();

    return result.identifiers[0]?.id as number;
  }

  async function createWebsite(): Promise<number> {
    const n = ++seq;
    return insertRow(Website, { title: `Website ${n}`, baseUrl: `https://site-${n}.test` });
  }

  async function createUser(): Promise<number> {
    const overrides: Record<string, unknown> = { roleId };
    if (dataSource.getMetadata(User).findColumnWithPropertyName('permission')) {
      overrides.permission = PermissionLevel.VIEWER;
    }
    return insertRow(User, overrides);
  }

  async function createTeam(): Promise<number> {
    return insertRow(Team);
  }

  async function assignUser(userId: number, websiteId: number): Promise<void> {
    await insertRow(UserWebsite, { userId, websiteId });
  }

  async function assignTeam(teamId: number, websiteId: number): Promise<void> {
    await insertRow(TeamWebsites, { teamId, websiteId });
  }

  async function addContext(websiteId: number, contextId: number): Promise<void> {
    await dataSource.query(
      'INSERT INTO website_contexts (website_id, context_id) VALUES ($1, $2)',
      [websiteId, contextId],
    );
  }

  async function contextIdsOf(websiteId: number): Promise<number[]> {
    const rows: { context_id: number }[] = await dataSource.query(
      'SELECT context_id FROM website_contexts WHERE website_id = $1 ORDER BY context_id',
      [websiteId],
    );
    return rows.map((r) => Number(r.context_id));
  }

  async function userAssignmentsOf(websiteId: number): Promise<number> {
    return dataSource.getRepository(UserWebsite).count({ where: { websiteId } });
  }

  async function teamAssignmentsOf(websiteId: number): Promise<number> {
    return dataSource.getRepository(TeamWebsites).count({ where: { websiteId } });
  }

  const inTransaction = <T>(fn: (manager: EntityManager) => Promise<T>) =>
    dataSource.transaction(fn);

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------

  describe('attachWebsitesToMonitorContext', () => {
    it('associa os websites ao contexto MONITOR', async () => {
      const w1 = await createWebsite();
      const w2 = await createWebsite();

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1, w2]));

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
      expect(await contextIdsOf(w2)).toEqual([MONITOR_ID]);
    });

    it('é idempotente', async () => {
      const w1 = await createWebsite();

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));
      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('não altera outros contextos já associados', async () => {
      const w1 = await createWebsite();
      await addContext(w1, OBSERVATORY_ID);

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID, OBSERVATORY_ID]);
    });

    it('não faz nada com lista vazia', async () => {
      await expect(
        inTransaction((m) => attachWebsitesToMonitorContext(m, [])),
      ).resolves.toBeUndefined();
    });
  });

  describe('detachOrphanWebsitesFromMonitorContext', () => {
    it('remove o MONITOR de websites sem users nem teams', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('mantém o MONITOR se ainda existir um user associado', async () => {
      const w1 = await createWebsite();
      const user = await createUser();
      await addContext(w1, MONITOR_ID);
      await assignUser(user, w1);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('mantém o MONITOR se ainda existir uma team associada', async () => {
      const w1 = await createWebsite();
      const team = await createTeam();
      await addContext(w1, MONITOR_ID);
      await assignTeam(team, w1);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('remove só o MONITOR e preserva os outros contextos', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);
      await addContext(w1, OBSERVATORY_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([OBSERVATORY_ID]);
    });

    it('trata corretamente um lote misto (órfãos e em uso)', async () => {
      const orphan = await createWebsite();
      const inUse = await createWebsite();
      const user = await createUser();
      await addContext(orphan, MONITOR_ID);
      await addContext(inUse, MONITOR_ID);
      await assignUser(user, inUse);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [orphan, inUse]));

      expect(await contextIdsOf(orphan)).toEqual([]);
      expect(await contextIdsOf(inUse)).toEqual([MONITOR_ID]);
    });

    it('não faz nada com lista vazia', async () => {
      await expect(
        inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [])),
      ).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // UserWebsitesService
  // ---------------------------------------------------------------------------

  describe('UserWebsitesService.updateUserWebsites', () => {
    it('ao adicionar website a um user, associa-o ao MONITOR', async () => {
      const user = await createUser();
      const w1 = await createWebsite();

      await userService.updateUserWebsites(user, [w1], []);

      expect(await userAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover o último user, retira o website do MONITOR', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      await userService.updateUserWebsites(user, [w1], []);

      await userService.updateUserWebsites(user, [], [w1]);

      expect(await userAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('ao remover um user mas existindo outro user, mantém o MONITOR', async () => {
      const userA = await createUser();
      const userB = await createUser();
      const w1 = await createWebsite();
      await userService.updateUserWebsites(userA, [w1], []);
      await userService.updateUserWebsites(userB, [w1], []);

      await userService.updateUserWebsites(userA, [], [w1]);

      expect(await userAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover um user mas existindo uma team, mantém o MONITOR', async () => {
      const user = await createUser();
      const team = await createTeam();
      const w1 = await createWebsite();
      await teamService.updateTeamWebsites(team, [w1], []);
      await userService.updateUserWebsites(user, [w1], []);

      await userService.updateUserWebsites(user, [], [w1]);

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('suporta adicionar e remover websites na mesma chamada', async () => {
      const user = await createUser();
      const oldSite = await createWebsite();
      const newSite = await createWebsite();
      await userService.updateUserWebsites(user, [oldSite], []);

      await userService.updateUserWebsites(user, [newSite], [oldSite]);

      expect(await contextIdsOf(oldSite)).toEqual([]);
      expect(await contextIdsOf(newSite)).toEqual([MONITOR_ID]);
    });

    it('envia para o outbox apenas os eventos de autorização (FGA)', async () => {
      const user = await createUser();
      const w1 = await createWebsite();

      await userService.updateUserWebsites(user, [w1], []);
      await userService.updateUserWebsites(user, [], [w1]);

      // 1 evento de add + 1 evento de remove, nenhum extra para o contexto
      expect(outbox.putInOutbox).toHaveBeenCalledTimes(2);
    });

    it('faz rollback da associação ao contexto se o outbox falhar', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(userService.updateUserWebsites(user, [w1], [])).rejects.toThrow('outbox down');

      expect(await userAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('faz rollback da remoção do contexto se o outbox falhar', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      await userService.updateUserWebsites(user, [w1], []);
      outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(userService.updateUserWebsites(user, [], [w1])).rejects.toThrow('outbox down');

      expect(await userAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });
  });

  // ---------------------------------------------------------------------------
  // TeamWebsitesService
  // ---------------------------------------------------------------------------

  describe('TeamWebsitesService.updateTeamWebsites', () => {
    it('ao adicionar website a uma team, associa-o ao MONITOR', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();

      await teamService.updateTeamWebsites(team, [w1], []);

      expect(await teamAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover a última team, retira o website do MONITOR', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      await teamService.updateTeamWebsites(team, [w1], []);

      await teamService.updateTeamWebsites(team, [], [w1]);

      expect(await teamAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('ao remover uma team mas existindo outra team, mantém o MONITOR', async () => {
      const teamA = await createTeam();
      const teamB = await createTeam();
      const w1 = await createWebsite();
      await teamService.updateTeamWebsites(teamA, [w1], []);
      await teamService.updateTeamWebsites(teamB, [w1], []);

      await teamService.updateTeamWebsites(teamA, [], [w1]);

      expect(await teamAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover uma team mas existindo um user, mantém o MONITOR', async () => {
      const team = await createTeam();
      const user = await createUser();
      const w1 = await createWebsite();
      await userService.updateUserWebsites(user, [w1], []);
      await teamService.updateTeamWebsites(team, [w1], []);

      await teamService.updateTeamWebsites(team, [], [w1]);

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('faz rollback da associação ao contexto se o outbox falhar', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      outbox.putManyInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(teamService.updateTeamWebsites(team, [w1], [])).rejects.toThrow('outbox down');

      expect(await teamAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Concorrência
  // ---------------------------------------------------------------------------

  describe('concorrência', () => {
    it('remoção do último user em paralelo com adição de outro user mantém estado consistente', async () => {
      for (let i = 0; i < 5; i++) {
        const userA = await createUser();
        const userB = await createUser();
        const w1 = await createWebsite();
        await userService.updateUserWebsites(userA, [w1], []);

        await Promise.all([
          userService.updateUserWebsites(userA, [], [w1]),
          userService.updateUserWebsites(userB, [w1], []),
        ]);

        // userB ficou atribuído, logo o website TEM de estar no MONITOR
        expect(await userAssignmentsOf(w1)).toBe(1);
        expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
      }
    });

    it('remoção do último user em paralelo com adição de uma team mantém estado consistente', async () => {
      for (let i = 0; i < 5; i++) {
        const user = await createUser();
        const team = await createTeam();
        const w1 = await createWebsite();
        await userService.updateUserWebsites(user, [w1], []);

        await Promise.all([
          userService.updateUserWebsites(user, [], [w1]),
          teamService.updateTeamWebsites(team, [w1], []),
        ]);

        expect(await teamAssignmentsOf(w1)).toBe(1);
        expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
      }
    });
  });
});
