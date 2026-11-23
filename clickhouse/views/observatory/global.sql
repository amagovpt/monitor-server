-- ============================================================================
-- 1. VIEW TOP 3 WEBSITES
-- ============================================================================
CREATE OR REPLACE VIEW accessibility.v_top_3_global_websites AS
SELECT
    groupArray(
        CAST(
            tuple(
                toUInt64(ifNull(index, 0)),
                toUInt64(ifNull(id, 0)),
                toUInt64(ifNull(directoryId, 0)),
                toString(ifNull(entity, '')),
                toString(ifNull(name, '')),
                toFloat64(ifNull(score, 0))
            ),
            'Tuple(index UInt64, id UInt64, directoryId UInt64, entity String, name String, score Float64)'
        )
    ) AS topWebsites
FROM (
    SELECT
        ROW_NUMBER() OVER (
            ORDER BY
                avg_score DESC,
                page_count DESC,
                pagesWithoutErrorsAAA DESC,
                pagesWithoutErrorsAA DESC,
                pagesWithoutErrorsA DESC
        ) AS index,
        website_id AS id,
        toUInt64(if(empty(meta.3), 0, ifNull(meta.3[1], 0))) AS directoryId,
        ifNull(meta.1, '') AS entity,
        ifNull(meta.2, '') AS name,
        avg_score AS score
    FROM (
        SELECT
            toUInt64(ifNull(website_id, 0)) AS website_id,
            toFloat64(ifNull(avg(score), 0)) AS avg_score,
            countIf(ifNull(a_error_count, 0) = 0 AND ifNull(aa_error_count, 0) > 0) AS pagesWithoutErrorsA,
            countIf(ifNull(a_error_count, 0) = 0 AND ifNull(aa_error_count, 0) = 0 AND ifNull(aaa_error_count, 0) > 0) AS pagesWithoutErrorsAA,
            countIf(ifNull(a_error_count, 0) = 0 AND ifNull(aa_error_count, 0) = 0 AND ifNull(aaa_error_count, 0) = 0) AS pagesWithoutErrorsAAA,
            dictGetOrDefault(
                'institution_websites_dict',
                ('institution_name', 'website_title', 'directories_ids'),
                toUInt64(ifNull(website_id, 0)),
                (CAST('' AS String), CAST('' AS String), CAST([] AS Array(UInt64)))
            ) AS meta,
            dictGetUInt32OrDefault(
                'institution_websites_dict',
                'page_count',
                toUInt64(ifNull(website_id, 0)),
                toUInt32(0)
            ) AS page_count
        FROM accessibility.v_latest_pages_evaluations
        WHERE website_id IS NOT NULL
        GROUP BY website_id
        ORDER BY
            avg_score DESC,
            page_count DESC,
            pagesWithoutErrorsAAA DESC,
            pagesWithoutErrorsAA DESC,
            pagesWithoutErrorsA DESC
        LIMIT 3
    )
    ORDER BY index ASC
);

-- ============================================================================
-- 5. VIEW GLOBAL SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW accessibility.v_global_summary AS
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
FROM accessibility.v_global_stats AS s
CROSS JOIN accessibility.v_top_3_global_websites AS w
CROSS JOIN accessibility.v_rules_global_top_summary AS r
CROSS JOIN accessibility.v_conformance_global_summary AS c;