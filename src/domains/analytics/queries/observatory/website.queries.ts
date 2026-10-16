export const EVALUATIONS_COMBINED_LATEST_CTE = `
    temp_pages AS (
        SELECT * 
        FROM latest_page_evaluations_temp 
        WHERE website_id = {resourceId: UInt32} 
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
    ),
    main_pages AS (
        SELECT * 
        FROM latest_page_evaluations FINAL
        WHERE website_id = {resourceId: UInt32} 
          AND page_id NOT IN (SELECT page_id FROM temp_pages) 
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
    ),
    combined_latest AS (
        SELECT * FROM temp_pages
        UNION ALL
        SELECT * FROM main_pages
    )
`;

export const websiteQueries = {
  summary: `
WITH
   ${EVALUATIONS_COMBINED_LATEST_CTE},
    website_meta AS (
        SELECT
            {resourceId: UInt32} AS id,
            dictGet(
                'institution_websites_dict', 
                ('website_title', 'base_url', 'institution_name'), 
                {resourceId: UInt32}
            ) AS meta
    )
SELECT
    m.id,
    m.meta.1 AS name,
    m.meta.2 AS url,
    m.meta.3 AS institutionName,
    min(f.evaluation_date) AS oldestPageDate,
    max(f.evaluation_date) AS recentPageDate,
    round(avg(f.score), 1) AS score,
    uniqExact(f.page_id) AS pageCount,

    countIf(f.a_error_count > 0 OR f.aa_error_count > 0 OR f.aaa_error_count > 0) AS pagesWithErrorsCount,
    countIf(f.a_error_count = 0 AND f.aa_error_count = 0 AND f.aaa_error_count = 0) AS pagesWithoutErrorsCount,
    
    countIf(f.a_error_count = 0 AND f.aa_error_count > 0) AS pagesWithoutErrorsA,
    countIf(f.a_error_count = 0 AND f.aa_error_count = 0 AND f.aaa_error_count > 0) AS pagesWithoutErrorsAA,
    countIf(f.a_error_count = 0 AND f.aa_error_count = 0 AND f.aaa_error_count = 0) AS pagesWithoutErrorsAAA
FROM combined_latest AS f
LEFT JOIN website_meta AS m ON f.website_id = m.id
GROUP BY
    m.id,
    m.meta;
`,
  plotScore: `
WITH ${EVALUATIONS_COMBINED_LATEST_CTE}
SELECT
    groupArray(score) AS accessibilityPlotData
FROM (
    SELECT score
    FROM combined_latest
    ORDER BY score DESC
);
`,
  scoreDistribution: `
WITH 
${EVALUATIONS_COMBINED_LATEST_CTE}, 
   buckets AS (
        SELECT arrayJoin([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) AS bucket
    )
    SELECT 
        groupArray(frequency) AS scoreDistributionFrequency
    FROM (
        SELECT 
            b.bucket,
            countIf(f.page_id != 0 AND least(toUInt8(floor(f.score)), 9) = b.bucket) AS frequency
        FROM buckets AS b
        LEFT JOIN combined_latest AS f ON least(toUInt8(floor(f.score)), 9) = b.bucket
        GROUP BY b.bucket
        ORDER BY b.bucket ASC
);
`,
  scoreMetrics: `
    WITH 
    ${EVALUATIONS_COMBINED_LATEST_CTE},
    plot_data AS (
        SELECT 
            groupArray(score) AS accessibilityPlotData
        FROM (
            SELECT score
            FROM combined_latest
            WHERE page_id != 0
            ORDER BY score DESC
        )
    ),
    buckets AS (
        -- Exatamente 9 baldes: 1 = [1-2[, 2 = [2-3[, ..., 8 = [8-9[, 9 = [9-10]
        SELECT arrayJoin([1, 2, 3, 4, 5, 6, 7, 8, 9]) AS bucket
    ),
    distribution_data AS (
        SELECT 
            groupArray(frequency) AS scoreDistributionFrequency
        FROM (
            SELECT 
                b.bucket,
                countIf(
                    f.page_id != 0 
                    AND b.bucket = multiIf(
                        f.score >= 9.0, 9,
                        f.score < 1.0, 1,
                        toUInt8(floor(f.score))
                    )
                ) AS frequency
            FROM buckets AS b
            LEFT JOIN combined_latest AS f ON 
                b.bucket = multiIf(
                    f.score >= 9.0, 9,
                    f.score < 1.0, 1,
                    toUInt8(floor(f.score))
                )
            GROUP BY b.bucket
            ORDER BY b.bucket ASC
        )
    )
SELECT 
    p.accessibilityPlotData,
    d.scoreDistributionFrequency
FROM plot_data AS p
CROSS JOIN distribution_data AS d;
`,
  metrics: `
WITH 
    -- 1. Unificação das fontes
    raw_evaluations AS (
        SELECT
            page_id,
            rule_id,
            count,
            evaluation_date,
            1 AS is_temp
        FROM evaluations_temp
        WHERE website_id = {resourceId: UInt32}
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true

        UNION ALL

        SELECT
            page_id,
            rule_id,
            count,
            evaluation_date,
            0 AS is_temp
        FROM evaluations
        PREWHERE website_id = {resourceId: UInt32}
        WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true
    ),

    -- 2. Último snapshot de cada regra por página
    latest_page_rules AS (
        SELECT
            page_id,
            rule_id,
            argMax(count, (is_temp, evaluation_date)) AS latest_count
        FROM raw_evaluations
        WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true
        GROUP BY page_id, rule_id
    ),

    -- 3. Agregação por regra + Enriquecimento com o Dicionário
    rules_match AS (
        SELECT
            rule_id,
            uniqExact(page_id) AS page_count,
            sum(latest_count) AS ocorrences,
            dictGet('rules_dict', 'wcag_level', rule_id) AS wcag_level,
            dictGet('rules_dict', 'target_element', rule_id) AS target_element,
            dictGet('rules_dict', 'test_method', rule_id) AS test_method,
            dictGet('rules_dict', 'expected_result', rule_id) AS expected_result
        FROM latest_page_rules
        GROUP BY rule_id
        ORDER BY ocorrences DESC
    )

-- 4. Agregação final 
SELECT 
    -- Erros (failed)
    groupArrayIf(10)(
        map(
            'key', rule_id,
            'pagesCount', toString(page_count),
            'occurrenceCount', toString(ocorrences)
        ),
        expected_result = 'failed'
    ) AS errorsDistribution,

    -- Boas Práticas (passed)
    groupArrayIf(10)(
        map(
            'key', rule_id,
            'pagesCount', toString(page_count),
            'occurrenceCount', toString(ocorrences)
        ),
        expected_result = 'passed'
    ) AS bestPracticesDistribution,

    -- Métricas de Sucesso em Mapa indexado por rule_id
    mapFromArrays(
        groupArrayIf(rule_id, expected_result = 'passed'),
        groupArrayIf(
            map(
                'pageCount', toString(page_count),
                'occurrenceCount', toString(ocorrences),
                'element', target_element,
                'testName', test_method,
                'result', expected_result
            ),
            expected_result = 'passed'
        )
    ) AS successMetrics,
     mapFromArrays(
        groupArrayIf(rule_id, expected_result = 'failed'),
        groupArrayIf(
            map(
                'pageCount', toString(page_count),
                'occurrenceCount', toString(ocorrences),
                'element', target_element,
                'testName', test_method,
                'result', expected_result
            ),
            expected_result = 'failed'
        )
    ) AS errorMetrics
FROM rules_match;


`,
  rulesLatestQuartiles: `
 WITH
    -- 1. Unificação das tabelas de avaliações com prioridade para a evaluations_temp
    raw_evaluations AS (
        SELECT
            page_id,
            rule_id,
            count,
            evaluation_date,
            1 AS is_temp
        FROM evaluations_temp
        WHERE (website_id = {resourceId: UInt32}) AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true

        UNION ALL

        SELECT
            page_id,
            rule_id,
            count,
            evaluation_date,
            0 AS is_temp
        FROM evaluations
        PREWHERE website_id = {resourceId: UInt32}
        WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true
    ),

    -- 2. Snapshot mais recente por (page_id, rule_id)

    latest_pages_snapshot AS (
        SELECT
            page_id,
            rule_id,
            argMax(count, (is_temp, evaluation_date)) AS latest_count
        FROM raw_evaluations
        WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
        GROUP BY page_id, rule_id
    ),

    -- 3. Métricas base e cálculo de quartis exatos por regra
    base_metrics AS (
        SELECT
            rule_id,
            dictGet('rules_dict', 'wcag_level', rule_id) AS wcag_level,
            dictGet('rules_dict', 'expected_result', rule_id) AS expected_result,
            length(groupArray(latest_count)) AS total_pages,
            sum(latest_count) AS total_occurrences,
            arraySort(groupArray(latest_count)) AS vals,
            quantilesExact(0.25, 0.50, 0.75, 1.0)(latest_count) AS q
        FROM latest_pages_snapshot
        GROUP BY rule_id
    ),

    -- 4. Separação em baldes e descarte de baldes vazios
    quartiles_built AS (
        SELECT
            rule_id,
            wcag_level,
            expected_result,
            total_pages,
            total_occurrences,
            arrayMap(
                b -> map(
                    'total', toString(length(b)),
                    'percentage', toString(round((length(b) / total_pages) * 100)),
                    'interval', map(
                        'lower', toString(b[1]),
                        'upper', toString(b[-1])
                    )
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

    -- 5. Mapeamento de cada linha individual
    table_rows AS (
        SELECT
            expected_result,
            map(
                'key', rule_id,
                'occurrenceCount', toString(total_occurrences),
                'pageCount', toString(total_pages),
                'level', wcag_level,
                'quartiles', quartiles
            ) AS row_item
        FROM quartiles_built
    )

-- 6. Agrupamento final segregado por passed (success) e failed (errors)
SELECT
    -- Tabela de Boas Práticas (Passed)
    map(
        'keys', arrayMap(i -> toString(i), range(length(groupArrayIf(row_item, expected_result = 'passed')))),
        'data', groupArrayIf(row_item, expected_result = 'passed')
    ) AS successDetailsTable,

    -- Tabela de Erros (Failed)
    map(
        'keys', arrayMap(i -> toString(i), range(length(groupArrayIf(row_item, expected_result = 'failed')))),
        'data', groupArrayIf(row_item, expected_result = 'failed')
    ) AS errorsDetailsTable
FROM table_rows;
`,
} as const;
