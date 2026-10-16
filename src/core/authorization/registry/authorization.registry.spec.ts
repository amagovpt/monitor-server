import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { OpenFgaClient } from '@openfga/sdk';
import { transformer } from '@openfga/syntax-transformer';
import path from 'node:path';
import fs from 'node:fs';
import { FgaService } from '../fga.service';
import { FgaClientProvider } from '../fga.provider';
import { AuthorizationRegistry } from './authorization.registry';
import { AUTHORIZATION_ACTION } from './registry.keys';
import type { AuthorizationModel } from '@openfga/sdk';
import { RoleSlug } from '../../authentication/interfaces/types';
import { FGA_RESOURCE } from '../types/fga.types';

describe('AuthorizationRegistry (Integration Tests - OpenFga)', () => {
  let container: StartedTestContainer;
  let moduleRef: TestingModule;
  let fgaService: FgaService;
  let registry: AuthorizationRegistry;
  let apiUrl: string;
  let jsonModel: Omit<AuthorizationModel, 'id'>;

  beforeAll(async () => {
    container = await new GenericContainer('openfga/openfga:v1.18.0')
      .withCommand(['run', '--datastore-engine', 'memory'])
      .withExposedPorts(8080)
      .withWaitStrategy(Wait.forHttp('/healthz', 8080))
      .withStartupTimeout(60_000)
      .start();

    const host = container.getHost() === 'localhost' ? '127.0.0.1' : container.getHost();
    apiUrl = `http://${host}:${container.getMappedPort(8080)}`;

    const dslPath = path.resolve(__dirname, '../../../../openfga/model.fga');
    const dslFileContent = fs.readFileSync(dslPath, 'utf8');
    jsonModel = transformer.transformDSLToJSONObject(dslFileContent);
  }, 120_000);

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    const setupClient = new OpenFgaClient({ apiUrl });
    const store = await setupClient.createStore({ name: `Registry Test Store ${Date.now()}` });
    const storeId = store.id;

    const modelResponse = await setupClient.writeAuthorizationModel(
      {
        schema_version: jsonModel.schema_version,
        type_definitions: jsonModel.type_definitions,
      },
      { storeId },
    );

    process.env.FGA_API_URL = apiUrl;
    process.env.FGA_STORE_ID = storeId;
    process.env.FGA_MODEL_ID = modelResponse.authorization_model_id;

    moduleRef = await Test.createTestingModule({
      providers: [FgaService, FgaClientProvider, AuthorizationRegistry],
    }).compile();

    fgaService = moduleRef.get<FgaService>(FgaService);
    registry = moduleRef.get<AuthorizationRegistry>(AuthorizationRegistry);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  describe('User Update Actions (with newRole and newPermission)', () => {
    it('should update only the permission using newPermission while keeping the role', async () => {
      // 1. Criar utilizador inicialmente como VIEWER no MONITOR
      await registry.execute(AUTHORIZATION_ACTION.USER_CREATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 301,
        action: AUTHORIZATION_ACTION.USER_CREATE,
        userId: 301,
        permission: 'viewer',
        role: RoleSlug.MONITOR,
      });

      expect(await fgaService.check('user:301', 'viewer', 'role:monitor')).toBe(true);

      // 2. Atualizar enviando apenas newPermission ('editor')
      await registry.execute(AUTHORIZATION_ACTION.USER_UPDATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 301,
        action: AUTHORIZATION_ACTION.USER_UPDATE,
        userId: 301,
        role: RoleSlug.MONITOR,
        permission: 'viewer',
        newPermission: 'editor',
      });

      // Validações
      expect(await fgaService.check('user:301', 'viewer', 'role:monitor')).toBe(false);
      expect(await fgaService.check('user:301', 'editor', 'role:monitor')).toBe(true);
    });

    it('should update only the role using newRole while keeping the permission', async () => {
      // 1. Criar utilizador com permissão 'manager' no MONITOR
      await registry.execute(AUTHORIZATION_ACTION.USER_CREATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 302,
        action: AUTHORIZATION_ACTION.USER_CREATE,
        userId: 302,
        permission: 'manager',
        role: RoleSlug.MONITOR,
      });

      expect(await fgaService.check('user:302', 'manager', 'role:monitor')).toBe(true);

      // 2. Atualizar enviando newRole (AMS) mantendo a permissão 'manager'
      await registry.execute(AUTHORIZATION_ACTION.USER_UPDATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 302,
        action: AUTHORIZATION_ACTION.USER_UPDATE,
        userId: 302,
        role: RoleSlug.MONITOR,
        newRole: RoleSlug.ADMIN,
        permission: 'manager',
      });

      // Validações
      expect(await fgaService.check('user:302', 'manager', 'role:monitor')).toBe(false);
      expect(await fgaService.check('user:302', 'manager', 'role:ams')).toBe(true);
    });

    it('should update both role and permission simultaneously using newRole and newPermission', async () => {
      // 1. Criar utilizador como VIEWER no MONITOR
      await registry.execute(AUTHORIZATION_ACTION.USER_CREATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 303,
        action: AUTHORIZATION_ACTION.USER_CREATE,
        userId: 303,
        permission: 'viewer',
        role: RoleSlug.MONITOR,
      });

      // 2. Transitar simultaneamente para newRole (AMS) e newPermission (editor)
      await registry.execute(AUTHORIZATION_ACTION.USER_UPDATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 303,
        action: AUTHORIZATION_ACTION.USER_UPDATE,
        userId: 303,
        role: RoleSlug.MONITOR,
        newRole: RoleSlug.ADMIN,
        permission: 'viewer',
        newPermission: 'editor',
      });

      // Validações estritas de transição e purga de tuplos antigos
      expect(await fgaService.check('user:303', 'viewer', 'role:monitor')).toBe(false);
      expect(await fgaService.check('user:303', 'editor', 'role:ams')).toBe(true);
    });

    it('should create a user relationship with valid permissions and roles', async () => {
      await registry.execute(AUTHORIZATION_ACTION.USER_CREATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 101,
        action: AUTHORIZATION_ACTION.USER_CREATE,
        userId: 101,
        permission: 'viewer',
        role: RoleSlug.MONITOR,
      });

      const allowed = await fgaService.check('user:101', 'viewer', 'role:monitor');

      expect(allowed).toBe(true);
    });

    it('should throw an error for invalid permissions on user creation', async () => {
      await expect(
        registry.execute(AUTHORIZATION_ACTION.USER_CREATE, {
          resourceType: FGA_RESOURCE.USER,
          resourceId: 102,
          action: AUTHORIZATION_ACTION.USER_CREATE,
          userId: 102,
          permission: 'INVALID_PERMISSION' as any,
          role: RoleSlug.MONITOR,
        }),
      ).rejects.toThrow('Invalid permission: INVALID_PERMISSION');
    });

    it('should purge all tuples for a user on user deletion', async () => {
      await registry.execute(AUTHORIZATION_ACTION.USER_CREATE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 103,
        action: AUTHORIZATION_ACTION.USER_CREATE,
        userId: 103,
        permission: 'editor',
        role: RoleSlug.MONITOR,
      });

      await registry.execute(AUTHORIZATION_ACTION.USER_DELETE, {
        resourceType: FGA_RESOURCE.USER,
        resourceId: 103,
        action: AUTHORIZATION_ACTION.USER_DELETE,
        userId: 103,
        role: RoleSlug.MONITOR,
        permission: 'editor',
      });

      const allowed = await fgaService.check('user:103', 'editor', 'role:monitor');

      expect(allowed).toBe(false);
    });
  });

  describe('Team Actions', () => {
    it('should create a team with default monitor and admin roles', async () => {
      await registry.execute(AUTHORIZATION_ACTION.TEAM_CREATE, {
        resourceType: FGA_RESOURCE.TEAM,
        resourceId: 50,
        action: AUTHORIZATION_ACTION.TEAM_CREATE,
        teamId: 50,
      });

      const hasTeamRole = await fgaService.check('role:monitor', 'team_role', 'team:50');

      const hasAdminRole = await fgaService.check('role:ams', 'admin_role', 'team:50');

      expect(hasTeamRole).toBe(true);
      expect(hasAdminRole).toBe(true);
    });

    it('should add and remove members from a team correctly', async () => {
      await registry.execute(AUTHORIZATION_ACTION.TEAM_CREATE, {
        resourceType: FGA_RESOURCE.TEAM,
        resourceId: 60,
        action: AUTHORIZATION_ACTION.TEAM_CREATE,
        teamId: 60,
      });

      // Adicionar membros
      await registry.execute(AUTHORIZATION_ACTION.TEAM_ADD_MEMBER, {
        resourceType: FGA_RESOURCE.TEAM,
        resourceId: 60,
        action: AUTHORIZATION_ACTION.TEAM_ADD_MEMBER,
        teamId: 60,
        userIds: [1, 2],
      });

      let isMember = await fgaService.check('user:1', 'member', 'team:60');
      expect(isMember).toBe(true);

      // Remover membros
      await registry.execute(AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER, {
        resourceType: FGA_RESOURCE.TEAM,
        resourceId: 60,
        action: AUTHORIZATION_ACTION.TEAM_REMOVE_MEMBER,
        teamId: 60,
        userIds: [1],
      });

      isMember = await fgaService.check('user:1', 'member', 'team:60');
      expect(isMember).toBe(false);
    });
  });

  describe('Website Actions', () => {
    it('should assign and clear direct user website permissions', async () => {
      await registry.execute(AUTHORIZATION_ACTION.USER_ADD_WEBSITE, {
        resourceType: FGA_RESOURCE.WEBSITE,
        resourceId: 500,
        action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
        userId: 42,
        websiteIds: [500],
        permission: 'viewer',
      });

      const canView = await fgaService.check('user:42', 'viewer', 'website:500');
      expect(canView).toBe(true);

      // Remover permissões do website
      await registry.execute(AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE, {
        resourceType: FGA_RESOURCE.WEBSITE,
        resourceId: 500,
        action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
        userId: 42,
        websiteIds: [500],
        permission: 'viewer',
      });

      const canViewAfterRemoval = await fgaService.check('user:42', 'viewer', 'website:500');
      expect(canViewAfterRemoval).toBe(false);
    });
  });
});
