-- ============================================================================
-- 1. VIEW TOP 3 WEBSITES 
-- ============================================================================
CREATE OR REPLACE VIEW v_top_3_global_websites AS
WITH top_3_data AS (
    SELECT
        toUInt64(website_id) AS website_id,
        toFloat64(avg(score)) AS avg_score,
        countIf(a_error_count = 0) AS pagesWithoutErrorsA,
        countIf(a_error_count = 0 AND aa_error_count = 0) AS pagesWithoutErrorsAA,
        countIf(a_error_count = 0 AND aa_error_count = 0 AND aaa_error_count = 0) AS pagesWithoutErrorsAAA,
        sum(toUInt64(total_error_count)) AS total_errors,
        dictGetOrDefault(
            'institution_websites_dict',
            ('institution_name', 'website_title', 'directories_ids'),
            toUInt64(website_id),
            (CAST('' AS String), CAST('' AS String), CAST([] AS Array(UInt64)))
        ) AS meta
    FROM accessibility.v_latest_pages_evaluations
    GROUP BY website_id
    ORDER BY
        avg_score DESC,
        dictGetUInt64OrDefault('institution_websites_dict', 'page_count', toUInt64(website_id), toUInt64(0)) DESC,
        pagesWithoutErrorsAAA DESC,
        pagesWithoutErrorsAA DESC,
        pagesWithoutErrorsA DESC
    LIMIT 3
)
SELECT
    arrayMap(
        (row, idx) -> tuple(
            toUInt64(idx) AS index,
            toUInt64(row.1) AS id,
            toUInt64(row.2) AS directoryId,
            toString(row.3) AS entity,
            toString(row.4) AS name,
            toFloat64(row.5) AS score,
            toUInt64(row.6) AS pagesWithoutErrorsA,
            toUInt64(row.7) AS pagesWithoutErrorsAA,
            toUInt64(row.8) AS pagesWithoutErrorsAAA,
            toUInt64(row.9) AS totalErrors
        ),
        groupArray(
            tuple(
                website_id,
                toUInt64(if(empty(meta.3), 0, meta.3[1])),
                toString(assumeNotNull(ifNull(meta.1, ''))),
                toString(assumeNotNull(ifNull(meta.2, ''))),
                avg_score,
                pagesWithoutErrorsA,
                pagesWithoutErrorsAA,
                pagesWithoutErrorsAAA,
                total_errors
            )
        ),
        arrayEnumerate(groupArray(website_id))
    ) AS topWebsites
FROM top_3_data;

-- ============================================================================
-- 2. VIEW GLOBAL STATS
-- ============================================================================
CREATE OR REPLACE VIEW v_global_stats AS
SELECT 
    avg_score AS score,
    websites_count AS websitesCount,
    directories_count AS directoriesCount,
    institutions_count AS entitiesCount,
    count_pages AS pagesCount,
    recent_evaluation_date AS recentPageDate,
    oldest_evaluation_date AS oldestPageDate
FROM accessibility.global_statistics;

-- ============================================================================
-- 3. VIEW RULES GLOBAL TOP SUMMARY 
-- ============================================================================
CREATE OR REPLACE VIEW v_rules_global_top_summary AS
SELECT
    groupArrayIf(
        CAST(
            tuple(rule_id, occurrence_count, pages_count, websites_count),
            'Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64)'
        ),
        rule_result = 'failed'
    ) AS topErrors,

    groupArrayIf(
        CAST(
            tuple(rule_id, occurrence_count, pages_count, websites_count),
            'Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64)'
        ),
        rule_result = 'passed'
    ) AS topBestPractices
FROM
(
    SELECT
        rule_id,
        rule_result,
        occurrence_count,
        pages_count,
        websites_count
    FROM accessibility.global_rules_top_summary
    WHERE rule_result IN ('failed', 'passed')
      AND occurrence_count > 0
    ORDER BY occurrence_count DESC
    LIMIT 5 BY rule_result
);

-- ============================================================================
-- 4. VIEW CONFORMANCE GLOBAL SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW v_conformance_global_summary AS
SELECT
    map(
        'declarations', map(
            'total', map(
                'websites', map(
                    'conform', countIf(dec_status = 'CONFORM'),
                    'partial', countIf(dec_status = 'PARTIAL'),
                    'not_conform', countIf(dec_status = 'NON_CONFORM')
                ),
                'apps', map('conform', 0, 'partial', 0, 'not_conform', 0)
            ),
            'currentYear', map(
                'websites', map(
                    'conform', countIf(dec_status = 'CONFORM' AND is_current_year),
                    'partial', countIf(dec_status = 'PARTIAL' AND is_current_year),
                    'not_conform', countIf(dec_status = 'NON_CONFORM' AND is_current_year)
                ),
                'apps', map('conform', 0, 'partial', 0, 'not_conform', 0)
            )
        ),
        'badges', map(
            'total', map(
                'websites', map(
                    'gold', countIf(stamp_status = 'GOLD'),
                    'silver', countIf(stamp_status = 'SILVER'),
                    'bronze', countIf(stamp_status = 'BRONZE')
                ),
                'apps', map('gold', 0, 'silver', 0, 'bronze', 0)
            ),
            'currentYear', map(
                'websites', map(
                    'gold', countIf(stamp_status = 'GOLD' AND is_current_year),
                    'silver', countIf(stamp_status = 'SILVER' AND is_current_year),
                    'bronze', countIf(stamp_status = 'BRONZE' AND is_current_year)
                ),
                'apps', map('gold', 0, 'silver', 0, 'bronze', 0)
            )
        )
    ) AS conformanceSummary
FROM
(
    SELECT
        m.website_id,
        dictGetOrDefault('declarations_dict', 'status', m.website_id, '') AS dec_status,
        dictGetOrDefault('stamps_dict', 'stamp', m.website_id, '') AS stamp_status,
        true AS is_current_year
    FROM institution_websites_dict AS m
    WHERE m.is_in_observatory = true
);

-- ============================================================================
-- 5. VIEW GLOBAL SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW v_global_summary AS
SELECT
    s.score AS score,
    s.websitesCount AS websitesCount,
    s.directoriesCount AS directoriesCount,
    s.entitiesCount AS entitiesCount,
    s.pagesCount AS pagesCount,
    s.recentPageDate AS recentPageDate,
    s.oldestPageDate AS oldestPageDate,
    w.topWebsites AS topWebsites,
    r.topErrors AS topErrors,
    r.topBestPractices AS topBestPractices,
    c.conformanceSummary AS conformanceSummary
FROM v_global_stats AS s
CROSS JOIN v_top_3_global_websites AS w
CROSS JOIN v_rules_global_top_summary AS r
CROSS JOIN v_conformance_global_summary AS c;