
DROP VIEW IF EXISTS v_directory_websites;
CREATE OR REPLACE VIEW v_directory_websites AS

WITH website_stamp_counts AS (
    SELECT
        website_id,
        COUNT(id) FILTER (WHERE stamp = 'GOLD')   AS gold_stamps,
        COUNT(id) FILTER (WHERE stamp = 'SILVER') AS silver_stamps,
        COUNT(id) FILTER (WHERE stamp = 'BRONZE') AS bronze_stamps,
        COUNT(id)                                  AS stamp_count
    FROM website_stamps
    GROUP BY website_id
),
 
website_declarations_counts AS (
    SELECT
        website_id,
        COUNT(id) FILTER (WHERE status = 'CONFORM')           AS conform_declarations,
        COUNT(id) FILTER (WHERE status = 'PARTIALLY_CONFORM') AS partially_conform_declarations,
        COUNT(id) FILTER (WHERE status = 'NON_CONFORM')       AS non_conform_declarations,
        COUNT(id)                                              AS declarations_count
    FROM website_declarations
    GROUP BY website_id
),
 
directory_tag_totals AS (
    SELECT
        directory_id,
        COUNT(DISTINCT tag_id) AS total_tags
    FROM directory_tags
    GROUP BY directory_id
),
 

directory_websites AS (
    SELECT
        dt.directory_id,
        tw.website_id
    FROM directory_tags dt
    INNER JOIN directories d          ON d.id = dt.directory_id
    INNER JOIN directory_tag_totals t ON t.directory_id = dt.directory_id
    INNER JOIN website_tags tw       ON tw.tag_id = dt.tag_id
    GROUP BY dt.directory_id, tw.website_id, d.tag_matching_strategy, t.total_tags
    HAVING
        -- UNION: basta ter pelo menos uma das tags do diretório
        d.tag_matching_strategy = 'UNION'
        -- INTERSECTION: tem de ter todas as tags do diretório
        OR COUNT(DISTINCT tw.tag_id) = t.total_tags
)
 
SELECT
    d.id,
    d.name,
    d.tag_matching_strategy,
    d.is_in_observatory,
    COALESCE(
        ARRAY_AGG(dw.website_id) FILTER (WHERE dw.website_id IS NOT NULL),
        ARRAY[]::integer[]
    ) AS website_ids,
    CARDINALITY(
        COALESCE(
            ARRAY_AGG(dw.website_id) FILTER (WHERE dw.website_id IS NOT NULL),
            ARRAY[]::integer[]
        )
    ) AS website_count,
    SUM(COALESCE(wsc.stamp_count, 0))                    AS total_stamps,
    SUM(COALESCE(wsc.gold_stamps, 0))                    AS total_gold_stamps,
    SUM(COALESCE(wsc.silver_stamps, 0))                  AS total_silver_stamps,
    SUM(COALESCE(wsc.bronze_stamps, 0))                  AS total_bronze_stamps,
    SUM(COALESCE(wdc.declarations_count, 0))             AS total_declarations,
    SUM(COALESCE(wdc.conform_declarations, 0))           AS total_conform_declarations,
    SUM(COALESCE(wdc.partially_conform_declarations, 0)) AS total_partiallyconform_declarations,
    SUM(COALESCE(wdc.non_conform_declarations, 0))       AS total_nonconform_declarations
FROM directories d
LEFT JOIN directory_websites dw           ON dw.directory_id = d.id
LEFT JOIN website_stamp_counts wsc        ON wsc.website_id = dw.website_id
LEFT JOIN website_declarations_counts wdc ON wdc.website_id = dw.website_id
GROUP BY d.id, d.name, d.tag_matching_strategy, d.is_in_observatory;




DROP VIEW IF EXISTS v_institution_websites;
CREATE OR REPLACE VIEW v_institution_websites AS

SELECT 
    i.id AS institution_id,
    i.long_name AS institution_name,
    w.id AS website_id,
    w.title AS website_title,
    w.base_url,
    ws.stamp,                 
    wd.status AS declaration_status,
    w.is_in_observatory AS is_in_observatory
FROM websites w
LEFT JOIN institutions i ON i.id = w.institution_id
LEFT JOIN website_stamps ws ON ws.website_id = w.id
LEFT JOIN website_declarations wd ON wd.website_id = w.id;




DROP VIEW IF EXISTS v_websites_metadata;
CREATE OR REPLACE VIEW v_websites_metadata AS
SELECT 
    w.id AS website_id,
    w.title AS website_title,
    w.base_url,
    i.id AS institution_id,
    i.long_name AS institution_name,
    COALESCE(dir.directories_ids, ARRAY[]::INTEGER[]) AS directories_ids,
    COALESCE(tag.tags_ids, ARRAY[]::INTEGER[]) AS tags_ids,
    ws.stamp,                 
    wd.status AS declaration_status,
    w.is_in_observatory AS is_in_observatory,
    COALESCE(pg.page_count, 0) AS page_count
FROM websites w
LEFT JOIN institutions i 
    ON i.id = w.institution_id
LEFT JOIN website_stamps ws 
    ON ws.website_id = w.id
LEFT JOIN website_declarations wd 
    ON wd.website_id = w.id
LEFT JOIN (
    SELECT website_id, COUNT(*) AS page_count
    FROM pages
    GROUP BY website_id
) pg ON pg.website_id = w.id

LEFT JOIN LATERAL (
    SELECT ARRAY_AGG(DISTINCT wt.tag_id) AS tags_ids
    FROM website_tags wt
    WHERE wt.website_id = w.id
) tag ON TRUE
LEFT JOIN LATERAL (
    SELECT ARRAY_AGG(DISTINCT dt.directory_id) AS directories_ids
    FROM website_tags wt
    JOIN directory_tags dt ON dt.tag_id = wt.tag_id
    WHERE wt.website_id = w.id
      AND dt.directory_id IS NOT NULL
) dir ON TRUE;
























CREATE OR REPLACE VIEW v_institution_websites AS
WITH DirectoryRequirements AS (
    SELECT 
        d.id AS directory_id,
        d.tag_matching_strategy,
        COUNT(dt.tag_id) AS required_tags_count
    FROM directories d
    JOIN directory_tags dt ON dt.directory_id = d.id
    GROUP BY d.id, d.tag_matching_strategy
),
WebsiteDirectoryMatches AS (
    SELECT 
        wt.website_id,
        dr.directory_id
    FROM website_tags wt
    JOIN directory_tags dt ON dt.tag_id = wt.tag_id
    JOIN DirectoryRequirements dr ON dr.directory_id = dt.directory_id
    GROUP BY wt.website_id, dr.directory_id, dr.tag_matching_strategy, dr.required_tags_count
    HAVING 
        (dr.tag_matching_strategy = 'UNION')
        OR 
        (dr.tag_matching_strategy = 'INTERSECTION' AND COUNT(DISTINCT wt.tag_id) = dr.required_tags_count)
),
AggregatedDirectories AS (

    SELECT 
        website_id,
        ARRAY_AGG(directory_id) AS directories_ids
    FROM WebsiteDirectoryMatches
    GROUP BY website_id
)
SELECT 
    w.id AS website_id,
    w.title AS website_title,
    w.base_url,
    i.id AS institution_id,
    i.long_name AS institution_name,
    i.id AS institution_id,
    COALESCE(ad.directories_ids, ARRAY[]::INTEGER[]) AS directories_ids
FROM websites w
LEFT JOIN AggregatedDirectories ad ON ad.website_id = w.id
LEFT JOIN website_stamps ws ON ws.website_id = w.id
LEFT JOIN website_declarations wd ON wd.website_id = w.id
LEFT JOIN institutions i ON i.id = w.institution_id
LEFT JOIN website_contexts wc ON wc.website_id = w.id AND wc.context_id = 3;




CREATE OR REPLACE VIEW v_app_counters AS
SELECT 
    entity_type,
    total_count
FROM entity_counters;