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
    COALESCE(ad.directories_ids, ARRAY[]::INTEGER[]) AS directories_ids,
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
LEFT JOIN AggregatedDirectories ad ON ad.website_id = w.id;