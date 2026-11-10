CREATE OR REPLACE VIEW v_ranked_directories AS
SELECT 
    directory_id AS id,
    ROW_NUMBER() OVER (ORDER BY score_avg DESC) AS rank,
    score_avg AS score,
    name,
    stamps_count as stamps,
    websites_count as websites,
    declarations_count as declarations,
    a_conform_count AS A,
    aa_conform_count AS AA,
    aaa_conform_count AS AAA

 from ranked_directories ORDER BY score_avg DESC;

CREATE OR REPLACE VIEW v_directories_global_stats AS
SELECT 
    avg_score AS score,
    directories_count AS directoriesCount,
    websites_count AS websitesCount,
    page_count AS pagesCount,
    institutions_count AS entitiesCount,
    recent_evaluation_date AS recentPageDate,
    oldest_evaluation_date AS oldestPageDate
FROM global_directories_statistics;



CREATE OR REPLACE VIEW v_directories_global_summary AS
WITH global_stats AS (
    SELECT 
        score,
        directoriesCount,
        websitesCount,
        pagesCount,
        entitiesCount,
        recentPageDate,
        oldestPageDate
    FROM v_directories_global_stats
),
ranked_dirs AS (
    SELECT 
        groupArray(map(
            'id', toUInt64(id),
            'rank', toUInt64(rank),
            'name', toString(name),
            'declarations', toUInt64(declarations),
            'stamps', toUInt64(stamps),
            'score',  toFloat64(score),
            'websites', toUInt64(websites),
            'A', toUInt64(A),
            'AA', toUInt64(AA),
            'AAA', toUInt64(AAA)
        )) AS top_directories_json
    FROM v_ranked_directories
)
SELECT 
    g.score,
    g.directoriesCount,
    g.websitesCount,
    g.pagesCount,
    g.entitiesCount,
    g.recentPageDate,
    g.oldestPageDate,
    r.top_directories_json AS topDirectories
FROM global_stats g
CROSS JOIN ranked_dirs r;