import { PageStatus } from 'src/domains/inventory/page/page-contexts.entity';
import {
  attachWebsitesToMonitorContext,
  detachOrphanWebsitesFromMonitorContext,
} from './website-monitor-context.helper';
import {
  MONITOR_ID,
  OBSERVATORY_ID,
  setupMonitorContextHarness,
  sorted,
} from './website-monitor-context.test-harness';

describe('Page <-> MONITOR context (integration)', () => {
  const h = setupMonitorContextHarness();
  const {
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
    contextIdsOf,
    pageContextIdsOf,
    pageIdsWithContext,
    pageStatusOf,
    userAssignmentsOf,
    teamAssignmentsOf,
    inTransaction,
  } = h;

  // ---------------------------------------------------------------------------
  // Helper: attachWebsitesToMonitorContext
  // ---------------------------------------------------------------------------

  describe('attachWebsitesToMonitorContext', () => {
    it('associa ao MONITOR as páginas com isInObservatory=true de um website novo', async () => {
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      const p2 = await createPage(w1, { isInObservatory: true });

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(p2)).toEqual([MONITOR_ID]);
    });

    it('não associa páginas com isInObservatory=false', async () => {
      const w1 = await createWebsite();
      const observatory = await createPage(w1, { isInObservatory: true });
      const regular = await createPage(w1, { isInObservatory: false });

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(observatory)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(regular)).toEqual([]);
    });

    it('não associa páginas soft-deleted', async () => {
      const w1 = await createWebsite();
      const active = await createPage(w1, { isInObservatory: true });
      const deleted = await createPage(w1, { isInObservatory: true, deleted: true });

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(active)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(deleted)).toEqual([]);
    });

    it('não associa páginas de outros websites', async () => {
      const w1 = await createWebsite();
      const other = await createWebsite();
      const own = await createPage(w1, { isInObservatory: true });
      const foreign = await createPage(other, { isInObservatory: true });

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(own)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(foreign)).toEqual([]);
      expect(await contextIdsOf(other)).toEqual([]);
    });

    it('o novo registo fica com page_status PENDING', async () => {
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageStatusOf(p1, MONITOR_ID)).toBe(PageStatus.PENDING);
    });

    it('preserva os outros contextos da página', async () => {
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, OBSERVATORY_ID);

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID, OBSERVATORY_ID]);
    });

    it('não duplica nem altera o estado se a página já tiver o contexto MONITOR', async () => {
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, MONITOR_ID, PageStatus.EVALUATED);

      await expect(
        inTransaction((m) => attachWebsitesToMonitorContext(m, [w1])),
      ).resolves.toBeUndefined();

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      expect(await pageStatusOf(p1, MONITOR_ID)).toBe(PageStatus.EVALUATED);
    });

    it('não mexe nas páginas se o website já estava associado ao MONITOR', async () => {
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await addContext(w1, MONITOR_ID);

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([]);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });

    it('segunda chamada não repõe páginas removidas manualmente (website já associado)', async () => {
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));
      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);

      await removePageContext(p1, MONITOR_ID);
      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([]);
    });

    it('trata corretamente um lote misto (website novo e website já associado)', async () => {
      const fresh = await createWebsite();
      const existing = await createWebsite();
      const freshPage = await createPage(fresh, { isInObservatory: true });
      const existingPage = await createPage(existing, { isInObservatory: true });
      await addContext(existing, MONITOR_ID);

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [fresh, existing]));

      expect(await pageContextIdsOf(freshPage)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(existingPage)).toEqual([]);
    });

    it('funciona com website sem páginas', async () => {
      const w1 = await createWebsite();

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
      expect(await pageIdsWithContext(w1, MONITOR_ID)).toEqual([]);
    });

    it('associa muitas páginas numa única operação', async () => {
      const w1 = await createWebsite();
      const observatoryPages: number[] = [];
      for (let i = 0; i < 20; i++) {
        observatoryPages.push(await createPage(w1, { isInObservatory: true }));
        await createPage(w1, { isInObservatory: false });
      }

      await inTransaction((m) => attachWebsitesToMonitorContext(m, [w1]));

      expect(await pageIdsWithContext(w1, MONITOR_ID)).toEqual(sorted(observatoryPages));
    });
  });

  // ---------------------------------------------------------------------------
  // Helper: detachOrphanWebsitesFromMonitorContext
  // ---------------------------------------------------------------------------

  describe('detachOrphanWebsitesFromMonitorContext', () => {
    it('remove o MONITOR de todas as páginas de um website órfão', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);
      const p1 = await createPage(w1, { isInObservatory: true });
      const p2 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, MONITOR_ID);
      await addPageContext(p2, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([]);
      expect(await pageContextIdsOf(p2)).toEqual([]);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('remove o MONITOR mesmo de páginas sem a flag isInObservatory', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);
      const regular = await createPage(w1, { isInObservatory: false });
      await addPageContext(regular, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(regular)).toEqual([]);
    });

    it('remove o MONITOR mesmo de páginas soft-deleted', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);
      const deleted = await createPage(w1, { isInObservatory: true, deleted: true });
      await addPageContext(deleted, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(deleted)).toEqual([]);
    });

    it('remove só o MONITOR e preserva os outros contextos da página', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, MONITOR_ID);
      await addPageContext(p1, OBSERVATORY_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([OBSERVATORY_ID]);
    });

    it('mantém o MONITOR das páginas se ainda existir um user associado', async () => {
      const w1 = await createWebsite();
      const user = await createUser();
      await addContext(w1, MONITOR_ID);
      await assignUser(user, w1);
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('mantém o MONITOR das páginas se ainda existir uma team associada', async () => {
      const w1 = await createWebsite();
      const team = await createTeam();
      await addContext(w1, MONITOR_ID);
      await assignTeam(team, w1);
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('não toca nas páginas de outros websites', async () => {
      const orphan = await createWebsite();
      const other = await createWebsite();
      await addContext(orphan, MONITOR_ID);
      await addContext(other, MONITOR_ID);
      const orphanPage = await createPage(orphan, { isInObservatory: true });
      const otherPage = await createPage(other, { isInObservatory: true });
      await addPageContext(orphanPage, MONITOR_ID);
      await addPageContext(otherPage, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [orphan]));

      expect(await pageContextIdsOf(orphanPage)).toEqual([]);
      expect(await pageContextIdsOf(otherPage)).toEqual([MONITOR_ID]);
      expect(await contextIdsOf(other)).toEqual([MONITOR_ID]);
    });

    it('trata corretamente um lote misto (órfão e em uso) ao nível das páginas', async () => {
      const orphan = await createWebsite();
      const inUse = await createWebsite();
      const user = await createUser();
      await addContext(orphan, MONITOR_ID);
      await addContext(inUse, MONITOR_ID);
      await assignUser(user, inUse);
      const orphanPage = await createPage(orphan, { isInObservatory: true });
      const inUsePage = await createPage(inUse, { isInObservatory: true });
      await addPageContext(orphanPage, MONITOR_ID);
      await addPageContext(inUsePage, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [orphan, inUse]));

      expect(await pageContextIdsOf(orphanPage)).toEqual([]);
      expect(await pageContextIdsOf(inUsePage)).toEqual([MONITOR_ID]);
    });

    it('funciona com website órfão sem páginas', async () => {
      const w1 = await createWebsite();
      await addContext(w1, MONITOR_ID);

      await inTransaction((m) => detachOrphanWebsitesFromMonitorContext(m, [w1]));

      expect(await contextIdsOf(w1)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // UserWebsitesService
  // ---------------------------------------------------------------------------

  describe('UserWebsitesService.updateUserWebsites', () => {
    it('ao adicionar website a um user, associa ao MONITOR as páginas isInObservatory', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const observatory = await createPage(w1, { isInObservatory: true });
      const regular = await createPage(w1, { isInObservatory: false });
      const deleted = await createPage(w1, { isInObservatory: true, deleted: true });

      await h.userService.updateUserWebsites(user, [w1], []);

      expect(await pageContextIdsOf(observatory)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(regular)).toEqual([]);
      expect(await pageContextIdsOf(deleted)).toEqual([]);
    });

    it('ao remover o último user, remove o MONITOR de todas as páginas do website', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const observatory = await createPage(w1, { isInObservatory: true });
      const regular = await createPage(w1, { isInObservatory: false });
      await h.userService.updateUserWebsites(user, [w1], []);
      // página sem flag mas com MONITOR atribuído por outra via
      await addPageContext(regular, MONITOR_ID);

      await h.userService.updateUserWebsites(user, [], [w1]);

      expect(await pageContextIdsOf(observatory)).toEqual([]);
      expect(await pageContextIdsOf(regular)).toEqual([]);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('ao remover um user mas existindo outro user, mantém o MONITOR nas páginas', async () => {
      const userA = await createUser();
      const userB = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(userA, [w1], []);
      await h.userService.updateUserWebsites(userB, [w1], []);

      await h.userService.updateUserWebsites(userA, [], [w1]);

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('ao remover um user mas existindo uma team, mantém o MONITOR nas páginas', async () => {
      const user = await createUser();
      const team = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.teamService.updateTeamWebsites(team, [w1], []);
      await h.userService.updateUserWebsites(user, [w1], []);

      await h.userService.updateUserWebsites(user, [], [w1]);

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('adicionar um segundo user não volta a propagar páginas (website já no MONITOR)', async () => {
      const userA = await createUser();
      const userB = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(userA, [w1], []);
      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);

      await removePageContext(p1, MONITOR_ID);
      await h.userService.updateUserWebsites(userB, [w1], []);

      expect(await pageContextIdsOf(p1)).toEqual([]);
    });

    it('adicionar um segundo user preserva o page_status existente', async () => {
      const userA = await createUser();
      const userB = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(userA, [w1], []);
      await setPageStatus(p1, MONITOR_ID, PageStatus.EVALUATED);

      await h.userService.updateUserWebsites(userB, [w1], []);

      expect(await pageStatusOf(p1, MONITOR_ID)).toBe(PageStatus.EVALUATED);
    });

    it('depois de ficar órfão e ser reatribuído, volta a associar as páginas isInObservatory', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(user, [w1], []);
      await h.userService.updateUserWebsites(user, [], [w1]);
      expect(await pageContextIdsOf(p1)).toEqual([]);

      const p2 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(user, [w1], []);

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(p2)).toEqual([MONITOR_ID]);
    });

    it('preserva outros contextos das páginas ao adicionar e remover', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, OBSERVATORY_ID);

      await h.userService.updateUserWebsites(user, [w1], []);
      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID, OBSERVATORY_ID]);

      await h.userService.updateUserWebsites(user, [], [w1]);
      expect(await pageContextIdsOf(p1)).toEqual([OBSERVATORY_ID]);
    });

    it('suporta adicionar e remover websites na mesma chamada ao nível das páginas', async () => {
      const user = await createUser();
      const oldSite = await createWebsite();
      const newSite = await createWebsite();
      const oldPage = await createPage(oldSite, { isInObservatory: true });
      const newPage = await createPage(newSite, { isInObservatory: true });
      await h.userService.updateUserWebsites(user, [oldSite], []);

      await h.userService.updateUserWebsites(user, [newSite], [oldSite]);

      expect(await pageContextIdsOf(oldPage)).toEqual([]);
      expect(await pageContextIdsOf(newPage)).toEqual([MONITOR_ID]);
    });

    it('não afeta páginas de websites não envolvidos', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const untouched = await createWebsite();
      const untouchedPage = await createPage(untouched, { isInObservatory: true });
      await createPage(w1, { isInObservatory: true });

      await h.userService.updateUserWebsites(user, [w1], []);

      expect(await pageContextIdsOf(untouchedPage)).toEqual([]);
      expect(await contextIdsOf(untouched)).toEqual([]);
    });

    it('faz rollback das páginas se o outbox falhar ao adicionar', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      h.outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.userService.updateUserWebsites(user, [w1], [])).rejects.toThrow('outbox down');

      expect(await pageContextIdsOf(p1)).toEqual([]);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('faz rollback das páginas se o outbox falhar ao remover', async () => {
      const user = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(user, [w1], []);
      h.outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.userService.updateUserWebsites(user, [], [w1])).rejects.toThrow('outbox down');

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });
  });

  // ---------------------------------------------------------------------------
  // TeamWebsitesService
  // ---------------------------------------------------------------------------

  describe('TeamWebsitesService.updateTeamWebsites', () => {
    it('ao adicionar website a uma team, associa ao MONITOR as páginas isInObservatory', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      const observatory = await createPage(w1, { isInObservatory: true });
      const regular = await createPage(w1, { isInObservatory: false });
      const deleted = await createPage(w1, { isInObservatory: true, deleted: true });

      await h.teamService.updateTeamWebsites(team, [w1], []);

      expect(await pageContextIdsOf(observatory)).toEqual([MONITOR_ID]);
      expect(await pageContextIdsOf(regular)).toEqual([]);
      expect(await pageContextIdsOf(deleted)).toEqual([]);
    });

    it('ao remover a última team, remove o MONITOR de todas as páginas do website', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      const observatory = await createPage(w1, { isInObservatory: true });
      const regular = await createPage(w1, { isInObservatory: false });
      await h.teamService.updateTeamWebsites(team, [w1], []);
      await addPageContext(regular, MONITOR_ID);

      await h.teamService.updateTeamWebsites(team, [], [w1]);

      expect(await pageContextIdsOf(observatory)).toEqual([]);
      expect(await pageContextIdsOf(regular)).toEqual([]);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('ao remover uma team mas existindo outra team, mantém o MONITOR nas páginas', async () => {
      const teamA = await createTeam();
      const teamB = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.teamService.updateTeamWebsites(teamA, [w1], []);
      await h.teamService.updateTeamWebsites(teamB, [w1], []);

      await h.teamService.updateTeamWebsites(teamA, [], [w1]);

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('ao remover uma team mas existindo um user, mantém o MONITOR nas páginas', async () => {
      const team = await createTeam();
      const user = await createUser();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(user, [w1], []);
      await h.teamService.updateTeamWebsites(team, [w1], []);

      await h.teamService.updateTeamWebsites(team, [], [w1]);

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('website já no MONITOR via user: adicionar uma team não volta a propagar páginas', async () => {
      const user = await createUser();
      const team = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.userService.updateUserWebsites(user, [w1], []);
      await removePageContext(p1, MONITOR_ID);

      await h.teamService.updateTeamWebsites(team, [w1], []);

      expect(await pageContextIdsOf(p1)).toEqual([]);
    });

    it('depois de ficar órfão e ser reatribuído a uma team, volta a associar as páginas', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.teamService.updateTeamWebsites(team, [w1], []);
      await h.teamService.updateTeamWebsites(team, [], [w1]);
      expect(await pageContextIdsOf(p1)).toEqual([]);

      await h.teamService.updateTeamWebsites(team, [w1], []);

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
    });

    it('preserva outros contextos das páginas ao adicionar e remover', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await addPageContext(p1, OBSERVATORY_ID);

      await h.teamService.updateTeamWebsites(team, [w1], []);
      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID, OBSERVATORY_ID]);

      await h.teamService.updateTeamWebsites(team, [], [w1]);
      expect(await pageContextIdsOf(p1)).toEqual([OBSERVATORY_ID]);
    });

    it('faz rollback das páginas se o outbox falhar ao adicionar', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      h.outbox.putManyInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.teamService.updateTeamWebsites(team, [w1], [])).rejects.toThrow('outbox down');

      expect(await pageContextIdsOf(p1)).toEqual([]);
      expect(await contextIdsOf(w1)).toEqual([]);
    });

    it('faz rollback das páginas se o outbox falhar ao remover', async () => {
      const team = await createTeam();
      const w1 = await createWebsite();
      const p1 = await createPage(w1, { isInObservatory: true });
      await h.teamService.updateTeamWebsites(team, [w1], []);
      h.outbox.putInOutbox.mockRejectedValueOnce(new Error('outbox down'));

      await expect(h.teamService.updateTeamWebsites(team, [], [w1])).rejects.toThrow('outbox down');

      expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
    });
  });

  // ---------------------------------------------------------------------------
  // Concorrência
  // ---------------------------------------------------------------------------

  describe('concorrência', () => {
    it('remoção do último user em paralelo com adição de outro user mantém as páginas consistentes', async () => {
      for (let i = 0; i < 5; i++) {
        const userA = await createUser();
        const userB = await createUser();
        const w1 = await createWebsite();
        const p1 = await createPage(w1, { isInObservatory: true });
        await h.userService.updateUserWebsites(userA, [w1], []);

        await Promise.all([
          h.userService.updateUserWebsites(userA, [], [w1]),
          h.userService.updateUserWebsites(userB, [w1], []),
        ]);

        // userB ficou atribuído, logo o website e a página observatory TÊM de estar no MONITOR
        expect(await userAssignmentsOf(w1)).toBe(1);
        expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
        expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      }
    });

    it('remoção do último user em paralelo com adição de uma team mantém as páginas consistentes', async () => {
      for (let i = 0; i < 5; i++) {
        const user = await createUser();
        const team = await createTeam();
        const w1 = await createWebsite();
        const p1 = await createPage(w1, { isInObservatory: true });
        await h.userService.updateUserWebsites(user, [w1], []);

        await Promise.all([
          h.userService.updateUserWebsites(user, [], [w1]),
          h.teamService.updateTeamWebsites(team, [w1], []),
        ]);

        expect(await teamAssignmentsOf(w1)).toBe(1);
        expect(await contextIdsOf(w1)).toEqual([MONITOR_ID]);
        expect(await pageContextIdsOf(p1)).toEqual([MONITOR_ID]);
      }
    });

    it('remoção do último user em paralelo com adição de uma team: páginas não observatory nunca ficam com MONITOR', async () => {
      for (let i = 0; i < 5; i++) {
        const user = await createUser();
        const team = await createTeam();
        const w1 = await createWebsite();
        const observatory = await createPage(w1, { isInObservatory: true });
        const regular = await createPage(w1, { isInObservatory: false });
        await h.userService.updateUserWebsites(user, [w1], []);

        await Promise.all([
          h.userService.updateUserWebsites(user, [], [w1]),
          h.teamService.updateTeamWebsites(team, [w1], []),
        ]);

        expect(await pageContextIdsOf(observatory)).toEqual([MONITOR_ID]);
        expect(await pageContextIdsOf(regular)).toEqual([]);
      }
    });

    it('remoção do último user em paralelo com adição de outro user mantém todas as páginas observatory com MONITOR', async () => {
      for (let i = 0; i < 5; i++) {
        const userA = await createUser();
        const userB = await createUser();
        const w1 = await createWebsite();
        const pages = [
          await createPage(w1, { isInObservatory: true }),
          await createPage(w1, { isInObservatory: true }),
          await createPage(w1, { isInObservatory: true }),
        ];
        await h.userService.updateUserWebsites(userA, [w1], []);

        await Promise.all([
          h.userService.updateUserWebsites(userA, [], [w1]),
          h.userService.updateUserWebsites(userB, [w1], []),
        ]);

        expect(await pageIdsWithContext(w1, MONITOR_ID)).toEqual(sorted(pages));
      }
    });
  });
});
