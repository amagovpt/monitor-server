export interface EvaluationFilterOptions {
  websiteId?: number;
  pageId?: number;
  directoryId?: number;
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
/**
 * Constrói a CTE de deduplicação com Predicate Pushdown direto na origem.
 * Os filtros são injetados dentro de cada SELECT do UNION ALL para tirar partido
 * do índice esparso ORDER BY (website_id, page_id).
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

  if (options.onlyObservatory) {
    conditions.push(
      `dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true`,
    );
    conditions.push(
      `dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true`,
    );
  }

  if (options.directoryId !== undefined) {
    conditions.push(
      `has(dictGet('institution_websites_dict', 'directories_ids', website_id), {directoryId: UInt32})`,
    );
    queryParams.directoryId = options.directoryId;
  }

  if (options.institutionId !== undefined) {
    conditions.push(`institution_id = {institutionId: UInt32}`);
    queryParams.institutionId = options.institutionId;
  }

  if (options.tagId !== undefined) {
    conditions.push(
      `has(dictGet('institution_websites_dict', 'tags_ids', website_id), {tagId: Int32})`,
    );
    queryParams.tagId = options.tagId;
  }

  const whereClause = conditions.join('\n          AND ');

  const cteSql = `
    combined_raw AS (
        SELECT 
            1 AS src_priority,
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
        FROM accessibility.latest_page_evaluations_temp
        WHERE ${whereClause}

        UNION ALL

        SELECT 
            2 AS src_priority,
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
        FROM accessibility.latest_page_evaluations
        WHERE ${whereClause}
    ),

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
        FROM combined_raw
        ORDER BY src_priority ASC, evaluation_date DESC
        LIMIT 1 BY page_id
    )
  `;
  return { cteSql, queryParams };
};

/**
 * Query analítica unificada. Executa tudo numa única passagem sobre combined_latest.
 */
export const buildGlobalAnalyticsQuery = (options: EvaluationFilterOptions = {}): BuiltQuery => {
  const { cteSql, queryParams } = buildEvaluationsCombinedLatestCTE(options);

  const query = `
WITH
    ${cteSql},

    -- 1. Resumo e Estatísticas Globais das Páginas
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

    -- 2. Histograma de Scores (0 a 9) calculado sem scans extras
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

    -- 3. Explode em memória dos Maps (failed e passed)
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

    -- 4. Top 10 Regras por Categoria com Métricas de Cobertura
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

    -- 5. Top Cards (topErrors e topBestPractices)
    top_cards_summary AS (
        SELECT
            cast(
                groupArrayIf(
                    tuple(rule_id, total_occurrences, pages_count, websites_count),
                    expected_result = 'failed'
                ),
                'Array(Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64))'
            ) AS topErrors,
            cast(
                groupArrayIf(
                    tuple(rule_id, total_occurrences, pages_count, websites_count),
                    expected_result = 'passed'
                ),
                'Array(Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64))'
            ) AS topBestPractices
        FROM top_rules
    ),

    -- 6. Dispersão e Quartis confinados ao Top 10
    base_metrics AS (
        SELECT
            r.expected_result,
            r.rule_id,
            tr.wcag_level,
            tr.total_occurrences,
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
        ORDER BY total_occurrences DESC
    ),

    table_rows AS (
        SELECT
            expected_result,
            cast((
                toString(rule_id),
                toString(total_occurrences),
                toString(total_pages),
                toString(wcag_level),
                arrayMap(
                    q_tuple -> cast((
                        q_tuple.1,
                        q_tuple.2,
                        cast((q_tuple.3.1, q_tuple.3.2), 'Tuple(lower String, upper String)')
                    ), 'Tuple(total String, percentage String, interval Tuple(lower String, upper String))'),
                    quartiles
                )
            ), 'Tuple(key String, occurrenceCount String, pageCount String, level String, quartiles Array(Tuple(total String, percentage String, interval Tuple(lower String, upper String))))') AS row_item
        FROM quartiles_built
    ),

    tables_summary AS (
        SELECT
            cast((
                arrayMap(i -> toString(i), range(length(groupArrayIf(row_item, expected_result = 'passed')))),
                groupArrayIf(row_item, expected_result = 'passed')
            ), 'Tuple(keys Array(String), data Array(Tuple(key String, occurrenceCount String, pageCount String, level String, quartiles Array(Tuple(total String, percentage String, interval Tuple(lower String, upper String))))))') AS successDetailsTable,

            cast((
                arrayMap(i -> toString(i), range(length(groupArrayIf(row_item, expected_result = 'failed')))),
                groupArrayIf(row_item, expected_result = 'failed')
            ), 'Tuple(keys Array(String), data Array(Tuple(key String, occurrenceCount String, pageCount String, level String, quartiles Array(Tuple(total String, percentage String, interval Tuple(lower String, upper String))))))') AS errorsDetailsTable
        FROM table_rows
    ),

    app_counters AS (
        SELECT
            dictGet('dict_app_counters', 'total_count', 'directories') AS directoriesCount,
            dictGet('dict_app_counters', 'total_count', 'institutions') AS entitiesCount
    )

-- Projeção Consolidada
SELECT
    c.global_avg_score AS score,
    c.recentPageDate AS recentPageDate,
    c.oldestPageDate AS oldestPageDate,
    ac.directoriesCount AS directoriesCount,
    ac.entitiesCount AS entitiesCount,
    c.websitesCount AS websitesCount,
    c.total_pages_evaluated AS pagesCount,
    if(c.websitesCount > 0, c.total_pages_evaluated / c.websitesCount, 0) AS avgPagesPerWebsite,

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
