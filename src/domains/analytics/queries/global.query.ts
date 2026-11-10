export interface EvaluationFilterOptions {
  websiteId?: number;
  pageId?: number;
  directoryId?: number;
  /**
   * true  -> usa accessibility.v_latest_pages_evaluations (só observatório)
   * false -> usa accessibility.v_latest_pages_evaluations_all (todas as páginas)
   */
  onlyObservatory?: boolean;
  institutionId?: number;
  tagId?: number;
}

export interface ClickHouseQueryParams {
  [key: string]: string | number | boolean | Array<string | number>;
}

export interface BuiltQuery {
  query: string;
  queryParams: ClickHouseQueryParams;
}

export type CounterType = 'directory' | 'institution' | 'website' | 'page';

const VIEW_OBSERVATORY = 'accessibility.v_latest_pages_evaluations_real_time_obs';
const VIEW_ALL = 'accessibility.v_latest_pages_evaluations_real_time_all';

const QUARTILE_TYPE =
  'Tuple(total String, percentage String, interval Tuple(lower String, upper String))';
const ROW_ITEM_TYPE = `Tuple(key String, occurrenceCount String, pageCount String, level String, quartiles Array(${QUARTILE_TYPE}))`;
const TABLE_TYPE = `Tuple(keys Array(String), data Array(${ROW_ITEM_TYPE}))`;
const TOP_RULE_TYPE =
  'Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64)';

/**
 * Constrói a CTE `combined_latest` a partir de uma das duas views:
 *  - v_latest_pages_evaluations      (apenas observatório)
 *  - v_latest_pages_evaluations_all  (sem restrições de observatório)
 *
 * A deduplicação (temp vs principal, version, is_deleted) vive nas views;
 * aqui só se aplicam filtros por website, página, diretório, instituição e tag.
 */
export const buildEvaluationsCombinedLatestCTE = (
  options: EvaluationFilterOptions = {},
): { cteSql: string; queryParams: ClickHouseQueryParams } => {
  const conditions: string[] = ['1 = 1'];
  const queryParams: ClickHouseQueryParams = {};

  if (options.websiteId !== undefined) {
    conditions.push(`website_id = {websiteId: UInt32}`);
    queryParams.websiteId = options.websiteId;
  }

  if (options.pageId !== undefined) {
    conditions.push(`page_id = {pageId: UInt32}`);
    queryParams.pageId = options.pageId;
  }

  if (options.directoryId !== undefined) {
    // Fonte de verdade: directories_metadata_dict.website_ids
    conditions.push(
      `website_id IN (
            SELECT arrayJoin(
                dictGetOrDefault(
                    'directories_metadata_dict',
                    'website_ids',
                    toUInt64({directoryId: UInt32}),
                    CAST([], 'Array(UInt32)')
                )
            )
        )`,
    );
    if (options.onlyObservatory) {
      conditions.push(
        `dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', toUInt64({directoryId: UInt32}), false) = true`,
      );
    }
    queryParams.directoryId = options.directoryId;
  }

  if (options.institutionId !== undefined) {
    // latest_page_evaluations não tem institution_id -> vem do dicionário
    conditions.push(
      `dictGetOrDefault('institution_websites_dict', 'institution_id', website_id, 0) = {institutionId: UInt32}`,
    );
    queryParams.institutionId = options.institutionId;
  }

  if (options.tagId !== undefined) {
    conditions.push(
      `has(dictGetOrDefault('institution_websites_dict', 'tags_ids', website_id, CAST([], 'Array(Int32)')), {tagId: Int32})`,
    );
    queryParams.tagId = options.tagId;
  }

  const source = options.onlyObservatory ? VIEW_OBSERVATORY : VIEW_ALL;
  const whereClause = conditions.join('\n          AND ');

  const cteSql = `
    combined_latest AS (
        SELECT
            website_id,
            page_id,
            score,
            aaa_error_count,
            aa_error_count,
            a_error_count,
            total_error_count,
            failed_rules,
            warning_rules,
            passed_rules,
            evaluation_date
        FROM ${source}
        WHERE ${whereClause}
    )
  `;

  return { cteSql, queryParams };
};

/**
 * Query analítica unificada. Executa tudo numa única passagem sobre combined_latest.
 */
export const buildGlobalAnalyticsQuery = (options: EvaluationFilterOptions = {}): BuiltQuery => {
  const { cteSql, queryParams } = buildEvaluationsCombinedLatestCTE(options);

  const counterRegistry: Record<CounterType, string> = {
    directory: options.onlyObservatory
      ? `dictGet('dict_app_counters', 'total_count', tuple('directories_obs'))`
      : `dictGet('dict_app_counters', 'total_count', tuple('directories'))`,
    institution: `dictGet('dict_app_counters', 'total_count', tuple('institutions'))`,
    website: options.onlyObservatory
      ? `dictGet('dict_app_counters', 'total_count', tuple('websites_observatorio'))`
      : `dictGet('dict_app_counters', 'total_count', tuple('websites'))`,
    page: options.onlyObservatory
      ? `dictGet('dict_app_counters', 'total_count', tuple('pages_observatorio'))`
      : `dictGet('dict_app_counters', 'total_count', tuple('pages'))`,
  };

  // Os contadores do dicionário são globais. Com filtros de âmbito,
  // usam-se os valores calculados sobre combined_latest.
  const hasScopeFilter =
    options.websiteId !== undefined ||
    options.pageId !== undefined ||
    options.directoryId !== undefined ||
    options.institutionId !== undefined ||
    options.tagId !== undefined;

  const websitesExpr = hasScopeFilter ? 'c.websitesCount' : counterRegistry.website;
  const pagesExpr = hasScopeFilter ? 'c.total_pages_evaluated' : counterRegistry.page;

  const query = `
WITH
    ${cteSql},

    -- 1. Resumo e estatísticas globais das páginas
    conformance AS (
        SELECT
            count() AS total_pages_evaluated,
            round(avg(score), 2) AS global_avg_score,
            sum(total_error_count) AS total_errors_across_all_pages,
            min(evaluation_date) AS oldestPageDate,
            max(evaluation_date) AS recentPageDate,
            uniqExact(website_id) AS websitesCount,
            countIf(a_error_count = 0 AND aa_error_count > 0) AS pagesWithoutErrorsA,
            countIf(a_error_count = 0 AND aa_error_count = 0 AND aaa_error_count > 0) AS pagesWithoutErrorsAA,
            countIf(a_error_count = 0 AND aa_error_count = 0 AND aaa_error_count = 0) AS pagesWithoutErrorsAAA
        FROM combined_latest
    ),

    -- 2. Histograma de scores (0 a 9)
    score_distribution AS (
        SELECT [
            countIf(floor(score) = 0),
            countIf(floor(score) = 1),
            countIf(floor(score) = 2),
            countIf(floor(score) = 3),
            countIf(floor(score) = 4),
            countIf(floor(score) = 5),
            countIf(floor(score) = 6),
            countIf(floor(score) = 7),
            countIf(floor(score) = 8),
            countIf(floor(score) >= 9)
        ] AS scoreDistributionFrequency
        FROM combined_latest
    ),

    -- 3. Explode os Maps (failed e passed)
    flattened_rules AS (
        SELECT
            'failed' AS expected_result,
            website_id,
            page_id,
            rule_entry.1 AS rule_id,
            rule_entry.2 AS latest_count
        FROM combined_latest
        ARRAY JOIN arrayZip(mapKeys(failed_rules), mapValues(failed_rules)) AS rule_entry

        UNION ALL

        SELECT
            'passed' AS expected_result,
            website_id,
            page_id,
            rule_entry.1 AS rule_id,
            rule_entry.2 AS latest_count
        FROM combined_latest
        ARRAY JOIN arrayZip(mapKeys(passed_rules), mapValues(passed_rules)) AS rule_entry
    ),

    -- 4. Top 10 regras por categoria
    top_rules AS (
        SELECT
            expected_result,
            rule_id,
            toString(dictGet('rules_dict', 'wcag_level', rule_id)) AS wcag_level,
            sum(latest_count) AS total_occurrences,
            uniqExact(page_id) AS pages_count,
            uniqExact(website_id) AS websites_count
        FROM flattened_rules
        GROUP BY expected_result, rule_id
        ORDER BY total_occurrences DESC
        LIMIT 10 BY expected_result
    ),

    -- 5. Top cards (ordem garantida por arrayReverseSort sobre as ocorrências)
    top_cards_summary AS (
        SELECT
            CAST(
                arrayMap(
                    t -> (t.2, t.1, t.3, t.4),
                    arrayReverseSort(
                        groupArrayIf(
                            tuple(total_occurrences, rule_id, pages_count, websites_count),
                            expected_result = 'failed'
                        )
                    )
                ),
                'Array(${TOP_RULE_TYPE})'
            ) AS topErrors,
            CAST(
                arrayMap(
                    t -> (t.2, t.1, t.3, t.4),
                    arrayReverseSort(
                        groupArrayIf(
                            tuple(total_occurrences, rule_id, pages_count, websites_count),
                            expected_result = 'passed'
                        )
                    )
                ),
                'Array(${TOP_RULE_TYPE})'
            ) AS topBestPractices
        FROM top_rules
    ),

    -- 6. Dispersão e quartis confinados ao top 10
    base_metrics AS (
        SELECT
            r.expected_result AS expected_result,
            r.rule_id AS rule_id,
            tr.wcag_level AS wcag_level,
            tr.total_occurrences AS total_occurrences,
            count() AS total_pages,
            arraySort(groupArray(r.latest_count)) AS vals,
            quantilesExact(0.25, 0.50, 0.75, 1.0)(r.latest_count) AS q
        FROM flattened_rules AS r
        INNER JOIN top_rules AS tr
            ON r.expected_result = tr.expected_result
           AND r.rule_id = tr.rule_id
        GROUP BY r.expected_result, r.rule_id, tr.wcag_level, tr.total_occurrences
    ),

    quartiles_built AS (
        SELECT
            expected_result,
            rule_id,
            wcag_level,
            total_pages,
            total_occurrences,
            arrayMap(
                b -> tuple(
                    toString(length(b)),
                    toString(round((length(b) / total_pages) * 100)),
                    tuple(toString(b[1]), toString(b[-1]))
                ),
                arrayFilter(
                    b -> length(b) > 0,
                    [
                        arrayFilter(v -> v <= q[1], vals),
                        arrayFilter(v -> v > q[1] AND v <= q[2], vals),
                        arrayFilter(v -> v > q[2] AND v <= q[3], vals),
                        arrayFilter(v -> v > q[3], vals)
                    ]
                )
            ) AS quartiles
        FROM base_metrics
    ),

    table_rows AS (
        SELECT
            expected_result,
            total_occurrences,
            CAST(
                (
                    toString(rule_id),
                    toString(total_occurrences),
                    toString(total_pages),
                    toString(wcag_level),
                    quartiles
                ),
                '${ROW_ITEM_TYPE}'
            ) AS row_item
        FROM quartiles_built
    ),

    -- Linhas ordenadas por ocorrências (desc) dentro de cada categoria
    tables_summary AS (
        SELECT
            arrayMap(
                t -> t.2,
                arrayReverseSort(
                    groupArrayIf(tuple(total_occurrences, row_item), expected_result = 'passed')
                )
            ) AS passed_rows,
            arrayMap(
                t -> t.2,
                arrayReverseSort(
                    groupArrayIf(tuple(total_occurrences, row_item), expected_result = 'failed')
                )
            ) AS failed_rows,
            CAST(
                (arrayMap(i -> toString(i), range(length(passed_rows))), passed_rows),
                '${TABLE_TYPE}'
            ) AS successDetailsTable,
            CAST(
                (arrayMap(i -> toString(i), range(length(failed_rows))), failed_rows),
                '${TABLE_TYPE}'
            ) AS errorsDetailsTable
        FROM table_rows
    ),

    -- Contadores da aplicação
    app_counters AS (
        SELECT
            ${counterRegistry.directory} AS directoriesCount,
            ${counterRegistry.institution} AS entitiesCount
    )

-- Projeção consolidada
SELECT
    c.global_avg_score AS score,
    c.recentPageDate AS recentPageDate,
    c.oldestPageDate AS oldestPageDate,
    ac.directoriesCount AS directoriesCount,
    ac.entitiesCount AS entitiesCount,
    ${websitesExpr} AS websitesCount,
    ${pagesExpr} AS pagesCount,
    if(${websitesExpr} > 0, ${pagesExpr} / ${websitesExpr}, 0) AS avgPagesPerWebsite,

    c.total_pages_evaluated AS total_pages_evaluated,
    c.global_avg_score AS global_avg_score,
    c.total_errors_across_all_pages AS total_errors_across_all_pages,
    c.pagesWithoutErrorsA AS pagesWithoutErrorsA,
    c.pagesWithoutErrorsAA AS pagesWithoutErrorsAA,
    c.pagesWithoutErrorsAAA AS pagesWithoutErrorsAAA,

    sd.scoreDistributionFrequency AS scoreDistributionFrequency,

    tc.topErrors AS topErrors,
    tc.topBestPractices AS topBestPractices,

    ts.successDetailsTable AS successDetailsTable,
    ts.errorsDetailsTable AS errorsDetailsTable
FROM conformance AS c
CROSS JOIN app_counters AS ac
CROSS JOIN score_distribution AS sd
CROSS JOIN top_cards_summary AS tc
CROSS JOIN tables_summary AS ts;
`;

  return { query, queryParams };
};
