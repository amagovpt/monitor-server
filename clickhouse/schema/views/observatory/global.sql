
CREATE OR REPLACE VIEW v_top_3_global_websites AS
WITH temp_pages AS (
    SELECT * 
    FROM latest_page_evaluations_temp 
    where dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
    AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
),
main_pages AS (
    SELECT *
    FROM latest_page_evaluations FINAL
    WHERE 
    dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true AND page_id NOT IN (SELECT page_id FROM temp_pages)
    AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
),
combined_latest AS (
    SELECT * FROM temp_pages
    UNION ALL
    SELECT * FROM main_pages
)
SELECT groupArray(map(
    'index', toUInt64(rank),
    'id', toUInt64(website_id),
    'directoryId', toUInt64(ifNull(meta.4[1], 0)),
    'entity', ifNull(meta.1, ''),
    'name', ifNull(meta.2, ''),
    'score', toFloat64(avg_score),
    'pagesWithoutErrorsA', toUInt64(pagesWithoutErrorsA),
    'pagesWithoutErrorsAA', toUInt64(pagesWithoutErrorsAA),
    'pagesWithoutErrorsAAA', toUInt64(pagesWithoutErrorsAAA),
    'totalErrors', toUInt64(total_errors)
)) AS topWebsites
FROM
(
    SELECT website_id,
    avg(score) AS avg_score,
    dictGet('institution_websites_dict', ('institution_name','website_title','page_count','directories_ids'), website_id) AS meta,
    countIf(combined_latest.a_error_count = 0 AND combined_latest.aa_error_count >  0) AS pagesWithoutErrorsA,
    countIf(combined_latest.aa_error_count = 0 AND combined_latest.a_error_count = 0 AND combined_latest.aaa_error_count > 0) AS pagesWithoutErrorsAA,
    countIf(combined_latest.aaa_error_count = 0 AND combined_latest.aa_error_count = 0 AND combined_latest.a_error_count = 0) AS pagesWithoutErrorsAAA,
    sum(total_error_count) AS total_errors,
    ROW_NUMBER() OVER (ORDER BY  avg_score DESC, meta.3 DESC, pagesWithoutErrorsAAA DESC, pagesWithoutErrorsAA DESC, pagesWithoutErrorsA DESC ) AS rank
    FROM combined_latest
    WHERE dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
    GROUP BY website_id 
    ORDER BY rank ASC
    LIMIT 3
);



---VIEW  global statistics and counters

CREATE OR REPLACE VIEW v_global_stats AS
SELECT 
    avg_score AS score,
    websites_count AS websitesCount,
    directories_count AS directoriesCount,
    institutions_count AS entitiesCount,
    count_pages AS pagesCount,
    recent_evaluation_date AS recentPageDate,
    oldest_evaluation_date AS oldestPageDate
FROM global_statistics;

--- VIEW RULES GLOBAL TOP SUMMARY  (failed and passed rules from evaluations and temporary evaluations)

CREATE OR REPLACE VIEW v_rules_global_top_summary AS
SELECT
    groupArrayIf(
        map(
            'key', rule_id,
            'occurrenceCount', toUInt64(total_occ),
            'pagesCount', toUInt64(total_pages),
            'websitesCount', toUInt64(total_websites)
        ),
        rule_result = 'failed'
    ) AS topErrors,

    groupArrayIf(
        map(
            'key', rule_id,
            'occurrenceCount', toUInt64(total_occ),
            'pagesCount', toUInt64(total_pages),
            'websitesCount', toUInt64(total_websites)
        ),
        rule_result = 'passed'
    ) AS topBestPractices
FROM
(
    SELECT
        rule_id,
        rule_result,
        sum(occurrence_count) AS total_occ,
        groupBitmapMerge(pages_count) AS total_pages,
        groupBitmapMerge(websites_count) AS total_websites
    FROM
    (
        SELECT rule_id, rule_result, occurrence_count, pages_count, websites_count
        FROM global_rules_top_summary
        WHERE rule_result IN ('failed', 'passed')
        ORDER BY occurrence_count DESC
        LIMIT 40

        UNION ALL

        SELECT rule_id, rule_result, occurrence_count, pages_count, websites_count
        FROM temp_rules_top_summary
        WHERE rule_result IN ('failed', 'passed')
        ORDER BY occurrence_count DESC
        LIMIT 40
    )
    GROUP BY rule_id, rule_result
    ORDER BY total_occ DESC
    LIMIT 5 BY rule_result
);



-- VIEW  Declarations and Stamps counters Summary (Conformance Summary)
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
                'apps', map(
                    'conform', 0,
                    'partial', 0,
                    'not_conform', 0
                )
            ),
            'currentYear', map(
                'websites', map(
                    'conform', countIf(dec_status = 'CONFORM' AND is_current_year),
                    'partial', countIf(dec_status = 'PARTIAL' AND is_current_year),
                    'not_conform', countIf(dec_status = 'NON_CONFORM' AND is_current_year)
                ),
                'apps', map(
                    'conform', 0,
                    'partial', 0,
                    'not_conform', 0
                )
            )
        ),
        'badges', map(
            'total', map(
                'websites', map(
                    'gold', countIf(stamp_status = 'GOLD'),
                    'silver', countIf(stamp_status = 'SILVER'),
                    'bronze', countIf(stamp_status = 'BRONZE')
                ),
                'apps', map(
                    'gold', 0,
                    'silver', 0,
                    'bronze', 0
                )
            ),
            'currentYear', map(
                'websites', map(
                    'gold', countIf(stamp_status = 'GOLD' AND is_current_year),
                    'silver', countIf(stamp_status = 'SILVER' AND is_current_year),
                    'bronze', countIf(stamp_status = 'BRONZE' AND is_current_year)
                ),
                'apps', map(
                    'gold', 0,
                    'silver', 0,
                    'bronze', 0
                )
            )
        )
    ) AS result
FROM
(
    SELECT
        m.website_id,
        dictGet('declarations_dict', 'status', m.website_id) AS dec_status,
        dictGet('stamps_dict', 'stamp', m.website_id) AS stamp_status,
        true AS is_current_year
    FROM institution_websites_dict AS m
    WHERE dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
);


--- VIEW Aggregating all the global statistics and summaries into a single view

CREATE OR REPLACE VIEW v_global_summary AS
SELECT
    score,
    websitesCount,
    directoriesCount,
    entitiesCount,
    pagesCount,
    recentPageDate,
    oldestPageDate,

    (SELECT * FROM v_top_3_global_websites) AS topWebsites,
    (SELECT * FROM v_rules_global_top_summary) AS rulesSummary,
    (SELECT * FROM v_conformance_global_summary) AS conformanceSummary

FROM v_global_stats;
