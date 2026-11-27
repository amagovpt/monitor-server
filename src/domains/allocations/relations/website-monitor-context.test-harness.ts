import { randomUUID } from 'crypto';
import { join } from 'path';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { Website } from 'src/domains/inventory/website/website.entity';
import { Page } from 'src/domains/inventory/page/page.entity';
import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';
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

export const MONITOR_ID = ContextMap[ContextEnum.MONITOR];
export const OBSERVATORY_ID = ContextMap[ContextEnum.OBSERVATORY];

export interface CreatePageOptions {
  isInObservatory?: boolean;
  deleted?: boolean;
}

export interface OutboxMock {
  putInOutbox: jest.Mock;
  putManyInOutbox: jest.Mock;
}

export const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);

/**
 * Registers the jest hooks for the MONITOR context integration tests
 * and returns the data helpers. Call it inside a `describe`.
 *
 * `dataSource`, `outbox`, `userService` and `teamService` are getters
 * because they are recreated in each `beforeEach`. Don't destructure them.
 */
export function setupMonitorContextHarness() {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let roleId: number;
  let seq = 0;

  let outbox: OutboxMock;
  let userService: UserWebsitesService;
  let teamService: TeamWebsitesService;

  // Infra

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

  // Data helpers

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
   * Inserts a row, auto-filling required columns (not null, no default,
   * not generated). `overrides` take priority. Returns the generated `id`.
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

  /** urlHash must be unique per website (uq_pages_site_url_hash), so use the global counter. */
  async function createPage(websiteId: number, options: CreatePageOptions = {}): Promise<number> {
    const n = ++seq;
    const overrides: Record<string, unknown> = {
      websiteId,
      url: `https://page-${n}.test/path`,
      urlHash: String(n),
      isInObservatory: options.isInObservatory ?? false,
    };
    if (options.deleted) {
      overrides.deletedAt = new Date();
    }
    return insertRow(Page, overrides);
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

  async function addPageContext(
    pageId: number,
    contextId: number,
    status: PageStatus = PageStatus.PENDING,
  ): Promise<void> {
    await dataSource.query(
      'INSERT INTO page_contexts (page_id, context_id, page_status) VALUES ($1, $2, $3)',
      [pageId, contextId, status],
    );
  }

  async function removePageContext(pageId: number, contextId: number): Promise<void> {
    await dataSource.query('DELETE FROM page_contexts WHERE page_id = $1 AND context_id = $2', [
      pageId,
      contextId,
    ]);
  }

  async function setPageStatus(
    pageId: number,
    contextId: number,
    status: PageStatus,
  ): Promise<void> {
    await dataSource.query(
      'UPDATE page_contexts SET page_status = $3 WHERE page_id = $1 AND context_id = $2',
      [pageId, contextId, status],
    );
  }

  async function contextIdsOf(websiteId: number): Promise<number[]> {
    const rows: { context_id: number }[] = await dataSource.query(
      'SELECT context_id FROM website_contexts WHERE website_id = $1 ORDER BY context_id',
      [websiteId],
    );
    return rows.map((r) => Number(r.context_id));
  }

  async function pageContextIdsOf(pageId: number): Promise<number[]> {
    const rows: { context_id: number }[] = await dataSource.query(
      'SELECT context_id FROM page_contexts WHERE page_id = $1 ORDER BY context_id',
      [pageId],
    );
    return rows.map((r) => Number(r.context_id));
  }

  /** Sorted IDs of the website's pages that have the given context. */
  async function pageIdsWithContext(websiteId: number, contextId: number): Promise<number[]> {
    const rows: { page_id: number }[] = await dataSource.query(
      `SELECT pc.page_id
         FROM page_contexts pc
         INNER JOIN pages p ON p.id = pc.page_id
        WHERE p.website_id = $1 AND pc.context_id = $2
        ORDER BY pc.page_id`,
      [websiteId, contextId],
    );
    return rows.map((r) => Number(r.page_id));
  }

  async function pageStatusOf(pageId: number, contextId: number): Promise<PageStatus | undefined> {
    const rows: { page_status: PageStatus }[] = await dataSource.query(
      'SELECT page_status FROM page_contexts WHERE page_id = $1 AND context_id = $2',
      [pageId, contextId],
    );
    return rows[0]?.page_status;
  }

  async function userAssignmentsOf(websiteId: number): Promise<number> {
    return dataSource.getRepository(UserWebsite).count({ where: { websiteId } });
  }

  async function teamAssignmentsOf(websiteId: number): Promise<number> {
    return dataSource.getRepository(TeamWebsites).count({ where: { websiteId } });
  }

  const inTransaction = <T>(fn: (manager: EntityManager) => Promise<T>) =>
    dataSource.transaction(fn);

  return {
    // Recreated each test; always access via `h.xxx`
    get dataSource() {
      return dataSource;
    },
    get outbox() {
      return outbox;
    },
    get userService() {
      return userService;
    },
    get teamService() {
      return teamService;
    },

    // Data creation
    createWebsite,
    createUser,
    createTeam,
    createPage,
    assignUser,
    assignTeam,
    addContext,
    addPageContext,
    removePageContext,
    setPageStatus,

    // State reads
    contextIdsOf,
    pageContextIdsOf,
    pageIdsWithContext,
    pageStatusOf,
    userAssignmentsOf,
    teamAssignmentsOf,

    // Transactions
    inTransaction,
  };
}

export type MonitorContextHarness = ReturnType<typeof setupMonitorContextHarness>;
