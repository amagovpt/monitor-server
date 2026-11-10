/**
 * Queries de um website (apenas observatório).
 *
 * Todas partem de v_latest_pages_evaluations, que já aplica:
 *  - deduplicação (temp vs principal, version, is_deleted)
 *  - página no observatório
 *  - website no observatório
 *  - website com pelo menos um diretório no observatório
 */
const QUARTILE_TYPE =
  'Tuple(total String, percentage String, interval Tuple(lower String, upper String))';
const ROW_ITEM_TYPE = `Tuple(key String, occurrenceCount String, pageCount String, level String, quartiles Array(${QUARTILE_TYPE}))`;
const TABLE_TYPE = `Tuple(keys Array(String), data Array(${ROW_ITEM_TYPE}))`;

export const EVALUATIONS_COMBINED_LATEST_CTE = `
    combined_latest AS (
        SELECT
            website_id,
            page_id,
            evaluation_date,
            score,
            aaa_error_count,
            aa_error_count,
            a_error_count,
            total_error_count,
            failed_rules,
            warning_rules,
            passed_rules
        FROM v_latest_pages_evaluations
        WHERE website_id = {resourceId: UInt32}
    )
`;

/**
 * Explode os Maps failed/passed em linhas (page_id, rule_id, cnt).
 * Substitui a leitura direta de evaluations / evaluations_temp.
 */
const FLATTENED_RULES_CTE = `
    flattened_rules AS (
        SELECT
            'failed' AS rule_result,
            page_id,
            rule_entry.1 AS rule_id,
            rule_entry.2 AS cnt
        FROM combined_latest
        ARRAY JOIN arrayZip(mapKeys(failed_rules), mapValues(failed_rules)) AS rule_entry

        UNION ALL

        SELECT
            'passed' AS rule_result,
            page_id,
            rule_entry.1 AS rule_id,
            rule_entry.2 AS cnt
        FROM combined_latest
        ARRAY JOIN arrayZip(mapKeys(passed_rules), mapValues(passed_rules)) AS rule_entry
    )
`;

export const websiteQueries = {
  summary: `
WITH
    ${EVALUATIONS_COMBINED_LATEST_CTE},
    website_data AS (
        SELECT
            website_id AS id,
            website_id,
            institution_id,
            base_url AS baseUrl,
            page_count AS pageCounts
        FROM institution_websites_dict
        WHERE website_id = {resourceId: UInt32}
          AND is_in_observatory = 1
    )
SELECT
    m.id,
    m.website_id AS websiteId,
    m.baseUrl AS url,
    dictGet('institution_websites_dict', 'institution_name', m.website_id) AS name,
    min(f.evaluation_date) AS oldestPageDate,
    max(f.evaluation_date) AS recentPageDate,
    round(avg(f.score), 1) AS score,
    m.pageCounts AS pageCount,

    countIf(f.a_error_count > 0 OR f.aa_error_count > 0 OR f.aaa_error_count > 0) AS pagesWithErrorsCount,
    countIf(f.a_error_count = 0 AND f.aa_error_count = 0 AND f.aaa_error_count = 0) AS pagesWithoutErrorsCount,

    countIf(f.a_error_count = 0 AND f.aa_error_count > 0) AS pagesWithoutErrorsA,
    countIf(f.a_error_count = 0 AND f.aa_error_count = 0 AND f.aaa_error_count > 0) AS pagesWithoutErrorsAA,
    countIf(f.a_error_count = 0 AND f.aa_error_count = 0 AND f.aaa_error_count = 0) AS pagesWithoutErrorsAAA
FROM combined_latest AS f
CROSS JOIN website_data AS m
GROUP BY
    m.id,
    m.website_id,
    m.institution_id,
    m.baseUrl,
    m.pageCounts;
`,

  plotScore: `
WITH ${EVALUATIONS_COMBINED_LATEST_CTE}
SELECT
    arrayReverseSort(groupArray(score)) AS accessibilityPlotData
FROM combined_latest;
`,

  // 10 baldes: 0..8 = [n, n+1[, 9 = [9, 10]
  scoreDistribution: `
WITH ${EVALUATIONS_COMBINED_LATEST_CTE}
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
WHERE page_id != 0;
`,

  // 9 baldes: 1 = [0-2[, 2 = [2-3[, ..., 8 = [8-9[, 9 = [9-10]
  scoreMetrics: `
WITH ${EVALUATIONS_COMBINED_LATEST_CTE}
SELECT
    arrayReverseSort(groupArray(score)) AS accessibilityPlotData,
    [
        countIf(score < 2),
        countIf(score >= 2 AND score < 3),
        countIf(score >= 3 AND score < 4),
        countIf(score >= 4 AND score < 5),
        countIf(score >= 5 AND score < 6),
        countIf(score >= 6 AND score < 7),
        countIf(score >= 7 AND score < 8),
        countIf(score >= 8 AND score < 9),
        countIf(score >= 9)
    ] AS scoreDistributionFrequency
FROM combined_latest
WHERE page_id != 0;
`,

  metrics: `
WITH
    ${EVALUATIONS_COMBINED_LATEST_CTE},
    ${FLATTENED_RULES_CTE},

    -- Agregação por regra e resultado + enriquecimento com o dicionário
    rules_match AS (
        SELECT
            rule_result,
            toString(rule_id) AS rule_key,
            uniqExact(page_id) AS page_count,
            sum(cnt) AS ocorrences,
            toString(dictGet('rules_dict', 'target_element', rule_id)) AS target_element,
            toString(dictGet('rules_dict', 'test_method', rule_id)) AS test_method
        FROM flattened_rules
        GROUP BY rule_result, rule_id
    )

SELECT
    -- Top 10 erros (ordenados por ocorrências, desc)
    arrayMap(
        t -> map(
            'key', t.2,
            'pagesCount', toString(t.3),
            'occurrenceCount', toString(t.1)
        ),
        arraySlice(
            arrayReverseSort(
                groupArrayIf(tuple(ocorrences, rule_key, page_count), rule_result = 'failed')
            ),
            1, 10
        )
    ) AS errorsDistribution,

    -- Top 10 boas práticas
    arrayMap(
        t -> map(
            'key', t.2,
            'pagesCount', toString(t.3),
            'occurrenceCount', toString(t.1)
        ),
        arraySlice(
            arrayReverseSort(
                groupArrayIf(tuple(ocorrences, rule_key, page_count), rule_result = 'passed')
            ),
            1, 10
        )
    ) AS bestPracticesDistribution,

    -- Métricas por regra (indexadas por rule_id)
    mapFromArrays(
        groupArrayIf(rule_key, rule_result = 'passed'),
        groupArrayIf(
            map(
                'pageCount', toString(page_count),
                'occurrenceCount', toString(ocorrences),
                'element', target_element,
                'testName', test_method,
                'result', rule_result
            ),
            rule_result = 'passed'
        )
    ) AS successMetrics,

    mapFromArrays(
        groupArrayIf(rule_key, rule_result = 'failed'),
        groupArrayIf(
            map(
                'pageCount', toString(page_count),
                'occurrenceCount', toString(ocorrences),
                'element', target_element,
                'testName', test_method,
                'result', rule_result
            ),
            rule_result = 'failed'
        )
    ) AS errorMetrics
FROM rules_match;
`,

  rulesLatestQuartiles: `
WITH
    ${EVALUATIONS_COMBINED_LATEST_CTE},
    ${FLATTENED_RULES_CTE},

    -- Métricas base e quartis exatos por regra
    base_metrics AS (
        SELECT
            rule_result,
            toString(rule_id) AS rule_key,
            toString(dictGet('rules_dict', 'wcag_level', rule_id)) AS wcag_level,
            count() AS total_pages,
            sum(cnt) AS total_occurrences,
            arraySort(groupArray(cnt)) AS vals,
            quantilesExact(0.25, 0.50, 0.75, 1.0)(cnt) AS q
        FROM flattened_rules
        GROUP BY rule_result, rule_id
    ),

    -- Baldes por quartil (descarta baldes vazios)
    quartiles_built AS (
        SELECT
            rule_result,
            rule_key,
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
            rule_result,
            total_occurrences,
            CAST(
                (
                    rule_key,
                    toString(total_occurrences),
                    toString(total_pages),
                    wcag_level,
                    quartiles
                ),
                '${ROW_ITEM_TYPE}'
            ) AS row_item
        FROM quartiles_built
    )

SELECT
    arrayMap(
        t -> t.2,
        arrayReverseSort(groupArrayIf(tuple(total_occurrences, row_item), rule_result = 'passed'))
    ) AS passed_rows,
    arrayMap(
        t -> t.2,
        arrayReverseSort(groupArrayIf(tuple(total_occurrences, row_item), rule_result = 'failed'))
    ) AS failed_rows,
    CAST(
        (arrayMap(i -> toString(i), range(length(passed_rows))), passed_rows),
        '${TABLE_TYPE}'
    ) AS successDetailsTable,
    CAST(
        (arrayMap(i -> toString(i), range(length(failed_rows))), failed_rows),
        '${TABLE_TYPE}'
    ) AS errorsDetailsTable
FROM table_rows;
`,
} as const;
