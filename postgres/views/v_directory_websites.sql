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