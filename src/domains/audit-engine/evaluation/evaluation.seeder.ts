import * as crypto from 'crypto';
import { DataSource, EntityMetadata } from 'typeorm';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

/**
 * Test helper: creates rows from the real entity metadata.
 *
 * Every NOT NULL column without a default gets a dummy value and every required parent row (FK)
 * is created on the fly, so a test only states the values it cares about.
 * Overrides can be keyed by property name, database column name, or relation property name
 * (a relation override accepts either the related entity or its id).
 */
export type SeedTarget = Function | string | EntityMetadata;

export function createSchemaSeeder(getDataSource: () => DataSource) {
  let seq = 0;

  const metaOf = (t: SeedTarget): EntityMetadata => {
    const dataSource = getDataSource();
    if (t instanceof EntityMetadata) return t;
    if (typeof t === 'string') {
      const m = dataSource.entityMetadatas.find((e) => e.tableName === t);
      if (!m) throw new Error(`No entity mapped to table "${t}"`);
      return m;
    }
    return dataSource.getMetadata(t);
  };

  function dummyFor(col: ColumnMetadata): unknown {
    const n = ++seq;
    const t = col.type as unknown;
    if (col.enum?.length) return col.enum[0];
    if (t === Boolean || t === 'boolean' || t === 'bool') return false;
    if (
      t === Number ||
      [
        'int',
        'integer',
        'int2',
        'int4',
        'int8',
        'smallint',
        'bigint',
        'float',
        'float4',
        'float8',
        'double precision',
        'real',
        'numeric',
        'decimal',
      ].includes(t as string)
    ) {
      return n;
    }
    if (t === Date || (typeof t === 'string' && /^(timestamp|date|time)/.test(t)))
      return new Date();
    if (typeof t === 'string' && /json/.test(t)) return {};
    if (t === 'simple-array' || col.isArray) return [];
    if (t === 'uuid') return crypto.randomUUID();
    const s = `${col.propertyName}_${n}`;
    return col.length ? s.slice(0, Number(col.length)) : s;
  }

  async function buildValues(
    target: SeedTarget,
    overrides: Record<string, any> = {},
    depth = 0,
  ): Promise<Record<string, any>> {
    if (depth > 6) throw new Error('Seed recursion too deep (circular required relations?)');
    const meta = metaOf(target);

    const resolved = new Map<ColumnMetadata, unknown>();
    for (const [key, value] of Object.entries(overrides)) {
      const rel = meta.relations.find((r) => r.propertyName === key);
      const col = rel
        ? rel.joinColumns[0]
        : meta.columns.find((c) => c.propertyName === key || c.databaseName === key);
      if (!col) throw new Error(`Unknown column/relation "${key}" on ${meta.tableName}`);
      let v = value;
      if (rel && value && typeof value === 'object') v = value[col.referencedColumn!.propertyName];
      resolved.set(col, v);
    }

    const values: Record<string, any> = {};
    for (const col of meta.columns) {
      if (resolved.has(col)) {
        values[col.propertyName] = resolved.get(col);
        continue;
      }
      if (
        col.isGenerated ||
        col.isCreateDate ||
        col.isUpdateDate ||
        col.isDeleteDate ||
        col.isVersion
      ) {
        continue;
      }
      if (col.isNullable || col.default !== undefined) continue;
      if (col.relationMetadata) {
        const parent = await make(col.relationMetadata.inverseEntityMetadata, {}, depth + 1);
        values[col.propertyName] = parent[col.referencedColumn!.propertyName];
        continue;
      }
      values[col.propertyName] = dummyFor(col);
    }
    return values;
  }

  async function make(
    target: SeedTarget,
    overrides: Record<string, any> = {},
    depth = 0,
  ): Promise<any> {
    const meta = metaOf(target);
    const values = await buildValues(meta, overrides, depth);
    return getDataSource()
      .getRepository(meta.target as any)
      .save(values as any);
  }

  return { metaOf, buildValues, make };
}
