export const EVALUATIONS_COMBINED_LATEST_CTE = `
    temp_pages AS (
        SELECT * 
        FROM latest_page_evaluations_temp 
        WHERE has(directories_ids, {resourceId: UInt32})
        AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
        AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
        AND dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true
    ),
    main_pages AS (
        SELECT * 
        FROM latest_page_evaluations FINAL
        WHERE has(directories_ids, {resourceId: UInt32})
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
          AND page_id NOT IN (SELECT page_id FROM temp_pages)
          AND dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true

    ),
    combined_latest AS (
        SELECT * FROM temp_pages
        UNION ALL
        SELECT * FROM main_pages
    )
`;

export const DIRECTORY_WEBSITE_STATISTICS_QUERY = `
WITH
    ${EVALUATIONS_COMBINED_LATEST_CTE}

SELECT 
    dictGet('directories_metadata_dict', 'name', {resourceId: UInt32}) AS name,
    uniqExact(website_id) AS websitesCount,
    uniqExact(page_id) AS pagesCount,
    uniqExact(institution_id) AS entitiesCount,
    round(avg(score), 1) AS score,
    max(evaluation_date) AS recentPageDate,
    min(evaluation_date) AS oldestPageDate
FROM combined_latest
WHERE dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true

;
`;

export const DIRECTORY_WEBSITE_RANKING_QUERY = `
WITH 
    ${EVALUATIONS_COMBINED_LATEST_CTE},
website_metrics AS (
    SELECT
        website_id,
        dictGet('institution_websites_dict', ('institution_name','website_title', 'stamp', 'declaration_status','page_count'), website_id) AS meta,
        avg(score) AS score_avg,
        uniqExact(page_id) AS nPages,
        min(evaluation_date) AS oldest_evaluation_date,
        max(evaluation_date) AS recent_evaluation_date,
        countIf(a_error_count = 0 AND aa_error_count > 0) AS a_conform_count,
        countIf(a_error_count = 0 AND aa_error_count = 0 AND aaa_error_count > 0) AS aa_conform_count,
        countIf(a_error_count = 0 AND aa_error_count = 0 AND aaa_error_count = 0) AS aaa_conform_count
    FROM combined_latest
    WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
      AND has(directories_ids, {resourceId: UInt32})
    GROUP BY website_id
    )
SELECT
    website_id as id,
    ROW_NUMBER() OVER (
        ORDER BY 
            score DESC,
            COALESCE(meta.5, 0) DESC,
            aaa_conform_count DESC,
            aa_conform_count DESC,
            a_conform_count DESC
    ) AS rank,
    meta.2 AS name,
    dictGet('institution_websites_dict', 'institution_name', website_id) AS entity,
    multiIf(
        meta.4 = 'CONFORM', 3,
        meta.4 = 'PARTIALLY_CONFORM', 2,
        meta.4 = 'NON_CONFORM', 1,
        NULL
    ) AS declaration,
    multiIf(
        meta.3 = 'GOLD', 3,
        meta.3 = 'SILVER', 2,
        meta.3 = 'BRONZE', 1,
        NULL
    ) AS stamp,
    round(score_avg, 1) as score,
    nPages,
    a_conform_count AS A,
    aa_conform_count AS AA,
    aaa_conform_count AS AAA

FROM website_metrics
WHERE dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', {resourceId: UInt32}, false) = true

ORDER BY rank ASC`;
