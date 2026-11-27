import { EntityManager, In } from 'typeorm';
import { Website } from 'src/domains/inventory/website/website.entity';
import { UserWebsite } from './user-websites/user-websites.entity';
import { TeamWebsites } from './team-websites/team-websites.entity';
import { ContextEnum, getContextIdByCode } from 'src/domains/inventory/context/context.enum';

function getMonitorContextId(): number {
  const contextId = getContextIdByCode(ContextEnum.MONITOR);
  if (contextId === undefined) {
    throw new Error('MONITOR context id is not configured');
  }
  return contextId;
}

/** Locks website rows by ID to serialize assignment changes. */
async function lockWebsites(manager: EntityManager, websiteIds: number[]): Promise<void> {
  await manager
    .getRepository(Website)
    .createQueryBuilder('website')
    .select('website.id')
    .where('website.id IN (:...websiteIds)', { websiteIds })
    .orderBy('website.id', 'ASC')
    .setLock('pessimistic_write')
    .getMany();
}

/**
 * Returns the IDs (among the given ones) of the websites that already
 * have the given context associated.
 */
async function findWebsitesWithContext(
  manager: EntityManager,
  websiteIds: number[],
  contextId: number,
): Promise<Set<number>> {
  const rows: { website_id: number | string }[] = await manager
    .createQueryBuilder()
    .select('wc.website_id', 'website_id')
    .from('website_contexts', 'wc')
    .where('wc.website_id IN (:...websiteIds)', { websiteIds })
    .andWhere('wc.context_id = :contextId', { contextId })
    .getRawMany();

  return new Set<number>(rows.map((r) => Number(r.website_id)));
}

/**
 * Adds to the MONITOR context all the (non soft-deleted) pages flagged with
 * is_in_observatory = true that belong to the given websites. Idempotent.
 */
async function attachObservatoryPagesToMonitorContext(
  manager: EntityManager,
  websiteIds: number[],
  contextId: number,
): Promise<void> {
  if (websiteIds.length === 0) return;

  await manager.query(
    `INSERT INTO page_contexts (page_id, context_id)
     SELECT p.id, $1
     FROM pages p
     WHERE p.website_id = ANY($2::int[])
       AND p.is_in_observatory = true
       AND p.deleted_at IS NULL
     ON CONFLICT DO NOTHING`,
    [contextId, websiteIds],
  );
}

/**
 * Removes the MONITOR context from ALL the pages that belong to the given websites.
 */
async function detachAllPagesFromMonitorContext(
  manager: EntityManager,
  websiteIds: number[],
  contextId: number,
): Promise<void> {
  if (websiteIds.length === 0) return;

  await manager.query(
    `DELETE FROM page_contexts
     WHERE context_id = $1
       AND page_id IN (
         SELECT p.id FROM pages p WHERE p.website_id = ANY($2::int[])
       )`,
    [contextId, websiteIds],
  );
}

/**
 * Associates the websites with the MONITOR context. Idempotent.
 * For the websites that were not yet associated with the MONITOR context, all
 * their pages with isInObservatory = true are also associated with it.
 * Must be called with the manager of the ongoing transaction.
 */
export async function attachWebsitesToMonitorContext(
  manager: EntityManager,
  websiteIds: number[],
): Promise<void> {
  if (websiteIds.length === 0) return;

  const contextId = getMonitorContextId();

  await lockWebsites(manager, websiteIds);

  // Must be evaluated after the lock and before the insert, to know which
  // websites are being associated with the MONITOR context for the first time.
  const alreadyAssociated = await findWebsitesWithContext(manager, websiteIds, contextId);
  const newlyAssociatedIds = websiteIds.filter((id) => !alreadyAssociated.has(id));

  await manager
    .createQueryBuilder()
    .insert()
    .into('website_contexts', ['website_id', 'context_id'])
    .values(websiteIds.map((websiteId) => ({ website_id: websiteId, context_id: contextId })))
    .orIgnore()
    .execute();

  await attachObservatoryPagesToMonitorContext(manager, newlyAssociatedIds, contextId);
}

/**
 * Removes the MONITOR context from the websites that no longer have any user
 * nor team assigned, and from all the pages of those websites.
 * Websites that are still in use are left untouched.
 * Must be called with the manager of the ongoing transaction, AFTER the
 * assignments were deleted.
 */
export async function detachOrphanWebsitesFromMonitorContext(
  manager: EntityManager,
  websiteIds: number[],
): Promise<void> {
  if (websiteIds.length === 0) return;

  const contextId = getMonitorContextId();

  await lockWebsites(manager, websiteIds);

  const stillAssignedToUsers = await manager.getRepository(UserWebsite).find({
    where: { websiteId: In(websiteIds) },
    select: ['websiteId'],
  });

  const stillAssignedToTeams = await manager.getRepository(TeamWebsites).find({
    where: { websiteId: In(websiteIds) },
    select: ['websiteId'],
  });

  const inUse = new Set<number>([
    ...stillAssignedToUsers.map((a) => a.websiteId),
    ...stillAssignedToTeams.map((a) => a.websiteId),
  ]);

  const orphanIds = websiteIds.filter((id) => !inUse.has(id));
  if (orphanIds.length === 0) return;

  await detachAllPagesFromMonitorContext(manager, orphanIds, contextId);

  await manager
    .createQueryBuilder()
    .delete()
    .from('website_contexts')
    .where('website_id IN (:...orphanIds)', { orphanIds })
    .andWhere('context_id = :contextId', { contextId })
    .execute();
}
