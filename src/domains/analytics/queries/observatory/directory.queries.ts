export const EVALUATIONS_COMBINED_LATEST_CTE = `
    combined_latest AS (
        SELECT * FROM v_latest_pages_evaluations
        WHERE has(dictGet('directories_metadata_dict', 'website_ids', {resourceId: UInt64}), website_id)
    )
`;
export const DIRECTORY_WEBSITE_STATISTICS_QUERY = `
WITH
    ${EVALUATIONS_COMBINED_LATEST_CTE},
    website_ids AS (
        SELECT arrayJoin(dictGetOrDefault('directories_metadata_dict', 'website_ids', {resourceId: UInt32}, [])) AS website_id
    ),
    website_data AS (
        SELECT
            w.website_id,
            dictGet('institution_websites_dict', 'institution_id', w.website_id) AS institution_id,
            dictGet('institution_websites_dict', 'page_count', w.website_id) AS pageCounts
        FROM website_ids AS w
        WHERE dictGet('institution_websites_dict', 'is_in_observatory', w.website_id) = 1
    ),
    counters AS (
        SELECT 
            COALESCE(countIf(institution_id IS NOT NULL), 0) AS entitiesCount,
            COALESCE(countIf(pageCounts > 0), 0) AS pagesCount,
            count(1) AS websitesCount
        FROM website_data
    )
SELECT 
    dictGetOrDefault('directories_metadata_dict', 'name', {resourceId: UInt32}, '') AS name,
    c.entitiesCount,
    c.websitesCount,
    c.pagesCount,
    round(avg(e.score), 1) AS score,
    max(e.evaluation_date) AS recentPageDate,
    min(e.evaluation_date) AS oldestPageDate
FROM combined_latest AS e
CROSS JOIN counters AS c
GROUP BY
    name,
    c.entitiesCount,
    c.websitesCount,
    c.pagesCount
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
      AND has(dictGet('directories_metadata_dict', 'website_ids', {resourceId: UInt32}), website_id)
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
