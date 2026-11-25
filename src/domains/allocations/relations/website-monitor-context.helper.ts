import { EntityManager, In } from 'typeorm';
import { Website } from 'src/domains/inventory/website/website.entity';
import { UserWebsite } from './user-websites/user-websites.entity';
import { TeamWebsites } from './team-websites/team-websites.entity';
import { ContextEnum, getContextIdByCode } from 'src/domains/inventory/context/context.enum';

const WEBSITE_CONTEXTS_TABLE = 'website_contexts';

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
 * Associates the websites with the MONITOR context. Idempotent.
 * Must be called with the manager of the ongoing transaction.
 */
export async function attachWebsitesToMonitorContext(
  manager: EntityManager,
  websiteIds: number[],
): Promise<void> {
  if (websiteIds.length === 0) return;

  const contextId = getMonitorContextId();

  await lockWebsites(manager, websiteIds);

  await manager
    .createQueryBuilder()
    .insert()
    .into(WEBSITE_CONTEXTS_TABLE, ['website_id', 'context_id'])
    .values(websiteIds.map((websiteId) => ({ website_id: websiteId, context_id: contextId })))
    .orIgnore()
    .execute();
}

/**
 * Removes the MONITOR context from the websites that no longer have any user
 * nor team assigned. Websites that are still in use are left untouched.
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

  await manager
    .createQueryBuilder()
    .delete()
    .from(WEBSITE_CONTEXTS_TABLE)
    .where('website_id IN (:...orphanIds)', { orphanIds })
    .andWhere('context_id = :contextId', { contextId })
    .execute();
}
