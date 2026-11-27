import {
  attachWebsitesToMonitorContext,
  detachOrphanWebsitesFromMonitorContext,
} from './website-monitor-context.helper';
import {
  MONITOR_ID,
  OBSERVATORY_ID,
  setupMonitorContextHarness,
} from './website-monitor-context.test-harness';

describe('Website <-> MONITOR context (integration)', () => {
  const h = setupMonitorContextHarness();
  const {
    createWebsite,
    createUser,
    createTeam,
    assignUser,
    assignTeam,
    addContext,
    contextIdsOf,
    userAssignmentsOf,
    teamAssignmentsOf,
    inTransaction,
  } = h;

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

      await h.userService.updateUserWebsites(user, [w1], []);

      expect(await userAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover o último user, retira o website do MONITOR', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      await h.userService.updateUserWebsites(user, [w1], []);

      await h.userService.updateUserWebsites(user, [], [w1]);

      expect(await userAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('ao remover um user mas existindo outro user, mantém o MONITOR', async () => {
      const userA = await createUser();
      const userB = await createUser();
      const w1 = await createWebsite();
      await h.userService.updateUserWebsites(userA, [w1], []);
      await h.userService.updateUserWebsites(userB, [w1], []);

      await h.userService.updateUserWebsites(userA, [], [w1]);

      expect(await userAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover um user mas existindo uma team, mantém o MONITOR', async () => {
      const user = await createUser();
      const team = await createTeam();
      const w1 = await createWebsite();
      await h.teamService.updateTeamWebsites(team, [w1], []);
      await h.userService.updateUserWebsites(user, [w1], []);

      await h.userService.updateUserWebsites(user, [], [w1]);

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('suporta adicionar e remover websites na mesma chamada', async () => {
      const user = await createUser();
      const oldSite = await createWebsite();
      const newSite = await createWebsite();
      await h.userService.updateUserWebsites(user, [oldSite], []);

      await h.userService.updateUserWebsites(user, [newSite], [oldSite]);

      expect(await contextIdsOf(oldSite)).toEqual([]);
      expect(await contextIdsOf(newSite)).toEqual([MONITOR_ID]);
    });

    it('envia para o outbox apenas os eventos de autorização (FGA)', async () => {
      const user = await createUser();
      const w1 = await createWebsite();

      await h.userService.updateUserWebsites(user, [w1], []);
      await h.userService.updateUserWebsites(user, [], [w1]);

      // 1 evento de add + 1 evento de remove, nenhum extra para o contexto
      expect(h.outbox.putInOutbox).toHaveBeenCalledTimes(2);
    });

    it('faz rollback da associação ao contexto se o outbox falhar', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      h.outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.userService.updateUserWebsites(user, [w1], [])).rejects.toThrow('outbox down');

      expect(await userAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('faz rollback da remoção do contexto se o outbox falhar', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      await h.userService.updateUserWebsites(user, [w1], []);
      h.outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.userService.updateUserWebsites(user, [], [w1])).rejects.toThrow('outbox down');

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

      await h.teamService.updateTeamWebsites(team, [w1], []);

      expect(await teamAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover a última team, retira o website do MONITOR', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      await h.teamService.updateTeamWebsites(team, [w1], []);

      await h.teamService.updateTeamWebsites(team, [], [w1]);

      expect(await teamAssignmentsOf(w1)).toBe(0);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('ao remover uma team mas existindo outra team, mantém o MONITOR', async () => {
      const teamA = await createTeam();
      const teamB = await createTeam();
      const w1 = await createWebsite();
      await h.teamService.updateTeamWebsites(teamA, [w1], []);
      await h.teamService.updateTeamWebsites(teamB, [w1], []);

      await h.teamService.updateTeamWebsites(teamA, [], [w1]);

      expect(await teamAssignmentsOf(w1)).toBe(1);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('ao remover uma team mas existindo um user, mantém o MONITOR', async () => {
      const team = await createTeam();
      const user = await createUser();
      const w1 = await createWebsite();
      await h.userService.updateUserWebsites(user, [w1], []);
      await h.teamService.updateTeamWebsites(team, [w1], []);

      await h.teamService.updateTeamWebsites(team, [], [w1]);

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('faz rollback da associação ao contexto se o outbox falhar', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      h.outbox.putManyInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.teamService.updateTeamWebsites(team, [w1], [])).rejects.toThrow('outbox down');

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
        await h.userService.updateUserWebsites(userA, [w1], []);

        await Promise.all([
          h.userService.updateUserWebsites(userA, [], [w1]),
          h.userService.updateUserWebsites(userB, [w1], []),
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
        await h.userService.updateUserWebsites(user, [w1], []);

        await Promise.all([
          h.userService.updateUserWebsites(user, [], [w1]),
          h.teamService.updateTeamWebsites(team, [w1], []),
        ]);

        expect(await teamAssignmentsOf(w1)).toBe(1);
        expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
      }
    });
  });
});
