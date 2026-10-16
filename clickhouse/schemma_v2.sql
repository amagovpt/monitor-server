--- Definitive Evaluations Source Of Truth Table

DROP TABLE IF EXISTS evaluations;
CREATE TABLE evaluations (
    evaluation_id UInt32,
    directories_ids Array(UInt32),
    institution_id UInt32,
    website_id UInt32,
    page_id UInt32,
    evaluation_date DateTime,
    score Decimal32(2),
    rule_id LowCardinality(String), 
    count UInt32,
    rule_result LowCardinality(String),
) ENGINE = MergeTree()
PARTITION BY toYear(evaluation_date)
ORDER BY (institution_id, evaluation_date, website_id, rule_id);

--- Table for latest evaluations per page, used for dashboards and statistics
DROP VIEW IF EXISTS accessibility.mv_latest_page_evaluations;
DROP TABLE IF EXISTS accessibility.latest_page_evaluations;

CREATE TABLE accessibility.latest_page_evaluations (
    institution_id UInt32,
    directories_ids Array(UInt32),
    website_id UInt32,
    page_id UInt32,
    evaluation_id UInt32,
    evaluation_date DateTime,
    score Float32,
    aaa_error_count UInt32,
    aa_error_count UInt32,
    a_error_count UInt32,
    total_error_count UInt32,
    failed_rules Map(LowCardinality(String), UInt32),
    warning_rules Map(LowCardinality(String), UInt32),
    passed_rules Map(LowCardinality(String), UInt32),
    version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
) ENGINE = ReplacingMergeTree(version)
ORDER BY (website_id, page_id)
SETTINGS index_granularity = 8192;


DROP VIEW IF EXISTS accessibility.mv_latest_page_evaluations;

CREATE MATERIALIZED VIEW accessibility.mv_latest_page_evaluations
TO accessibility.latest_page_evaluations 
AS 
SELECT
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score,
    
    -- Contadores WCAG por nível
    countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'AAA' AND rule_result = 'failed') AS aaa_error_count,
    countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'AA' AND rule_result = 'failed') AS aa_error_count,
    countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'A' AND rule_result = 'failed') AS a_error_count,
    sumIf(count, rule_result = 'failed') AS total_error_count,

    -- Mapas de Regras (rule_id -> soma dos counts)
    CAST(
        sumMap(
            if(rule_result = 'failed', [rule_id], CAST([], 'Array(LowCardinality(String))')),
            if(rule_result = 'failed', [count], CAST([], 'Array(UInt32)'))
        ),
        'Map(LowCardinality(String), UInt32)'
    ) AS failed_rules,

    CAST(
        sumMap(
            if(rule_result = 'warning', [rule_id], CAST([], 'Array(LowCardinality(String))')),
            if(rule_result = 'warning', [count], CAST([], 'Array(UInt32)'))
        ),
        'Map(LowCardinality(String), UInt32)'
    ) AS warning_rules,

    CAST(
        sumMap(
            if(rule_result = 'passed', [rule_id], CAST([], 'Array(LowCardinality(String))')),
            if(rule_result = 'passed', [count], CAST([], 'Array(UInt32)'))
        ),
        'Map(LowCardinality(String), UInt32)'
    ) AS passed_rules,

    toUnixTimestamp64Milli(now64(3)) AS version
FROM accessibility.evaluations
GROUP BY
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score;

--- Evaluations Temp Table
-- Contains evaluations of current quarter that are not definitive yet
-- IMPORTAT- Insertion should have version of type  toUnixTimestamp64Milli(now64(3)) 
DROP TABLE IF EXISTS evaluations_temp;
CREATE TABLE evaluations_temp (
    evaluation_id UInt32,
    directories_ids Array(UInt32),
    institution_id UInt32,
    website_id UInt32,
    page_id UInt32,
    evaluation_date DateTime,
    score Decimal32(2),
    rule_id LowCardinality(String), 
    count UInt32,
    rule_result LowCardinality(String),
    updated_at DateTime DEFAULT now(),
    version UInt32 DEFAULT 1,
    is_deleted UInt8 DEFAULT 0,
    is_migrated UInt8 DEFAULT 0
) ENGINE = ReplacingMergeTree(version, is_deleted)
ORDER BY (website_id, page_id, rule_id);

DROP TABLE IF EXISTS latest_page_evaluations_temp;
CREATE TABLE latest_page_evaluations_temp (
    institution_id UInt32,
    directories_ids Array(UInt32),
    website_id UInt32,
    page_id UInt32,
    evaluation_id UInt32,
    evaluation_date DateTime,
    score Float32,
    aaa_error_count UInt32,
    aa_error_count UInt32,
    a_error_count UInt32,
    total_error_count UInt32,
    failed_rules Map(LowCardinality(String), UInt32),
    warning_rules Map(LowCardinality(String), UInt32),
    passed_rules Map(LowCardinality(String), UInt32),
    version UInt32 DEFAULT 1
) ENGINE = MergeTree()
ORDER BY ( website_id, page_id);



DROP VIEW IF EXISTS mv_latest_page_evaluations_temp;
CREATE MATERIALIZED VIEW mv_latest_page_evaluations_temp
REFRESH EVERY 30 MINUTE
TO latest_page_evaluations_temp AS
SELECT
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score,
    
    -- Contadores WCAG por nível
    countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'AAA' AND rule_result = 'failed') AS aaa_error_count,
    countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'AA' AND rule_result = 'failed') AS aa_error_count,
    countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'A' AND rule_result = 'failed') AS a_error_count,
    sumIf(count, rule_result = 'failed') AS total_error_count,

    -- Mapas de Regras (rule_id -> soma dos counts)
    CAST(
        sumMap(
            if(rule_result = 'failed', [rule_id], CAST([], 'Array(LowCardinality(String))')),
            if(rule_result = 'failed', [count], CAST([], 'Array(UInt32)'))
        ),
        'Map(LowCardinality(String), UInt32)'
    ) AS failed_rules,

    CAST(
        sumMap(
            if(rule_result = 'warning', [rule_id], CAST([], 'Array(LowCardinality(String))')),
            if(rule_result = 'warning', [count], CAST([], 'Array(UInt32)'))
        ),
        'Map(LowCardinality(String), UInt32)'
    ) AS warning_rules,

    CAST(
        sumMap(
            if(rule_result = 'passed', [rule_id], CAST([], 'Array(LowCardinality(String))')),
            if(rule_result = 'passed', [count], CAST([], 'Array(UInt32)'))
        ),
        'Map(LowCardinality(String), UInt32)'
    ) AS passed_rules,

    toUnixTimestamp64Milli(now64(3)) AS version
FROM accessibility.evaluations_temp
GROUP BY
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score;


--- GLOBAL TABLES
DROP TABLE IF EXISTS global_statistics;
CREATE TABLE global_statistics (
    min_score Float32,
    max_score Float32,
    avg_score Decimal32(2),
    directories_count UInt32,
    institutions_count UInt32,
    websites_count UInt32,
    evaluations_count UInt32,
    count_pages UInt32,
    oldest_evaluation_date DateTime,
    recent_evaluation_date DateTime,
    pagesWithoutAAAErrors_count UInt32,
    pagesWithoutAAErrors_count UInt32,
    pagesWithoutAErrors_count UInt32,
    total_errors_sum UInt64
) ENGINE = MergeTree();


DROP VIEW IF EXISTS mv_global_statistics;
CREATE MATERIALIZED VIEW mv_global_statistics
REFRESH EVERY 20 MINUTE 
TO global_statistics
AS 
WITH 
    temp_pages AS (
    SELECT * 
    FROM latest_page_evaluations_temp 
    where dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
),
main_pages AS (
    SELECT *
    FROM latest_page_evaluations FINAL
    WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true AND page_id NOT IN (SELECT page_id FROM temp_pages)
    
),
union_all_pages AS (
    SELECT *
    FROM temp_pages
    UNION ALL
    SELECT *
    FROM main_pages
),

deduplicated_global AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY website_id, page_id 
            ORDER BY evaluation_date DESC, evaluation_id DESC
        ) AS rn
    FROM union_all_pages
)
SELECT 
    min(score) AS min_score,
    max(score) AS max_score,
    avg(CAST(score, 'Decimal64(4)')) AS avg_score,
    count(page_id) AS count_pages,
    min(evaluation_date) AS oldest_evaluation_date,
    max(evaluation_date) AS recent_evaluation_date,
    uniqArray(directories_ids) AS directories_count,
    uniq(institution_id) AS institutions_count,
    uniq(website_id) AS websites_count,
    uniq(evaluation_id) AS evaluations_count,
    sum(aaa_error_count = 0) AS pagesWithoutAAAErrors_count,
    sum(aa_error_count = 0) AS pagesWithoutAAErrors_count,
    sum(a_error_count = 0) AS pagesWithoutAErrors_count,
    sum(total_error_count) AS total_errors_sum
FROM deduplicated_global
WHERE rn = 1;


DROP TABLE IF EXISTS global_rules_time_series;
CREATE TABLE global_rules_time_series
(
    quarter_start Date,
    rule_id LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64),
    pages_count AggregateFunction(groupBitmap, UInt32),
    websites_count AggregateFunction(groupBitmap, UInt32)
) 
ENGINE = AggregatingMergeTree()
ORDER BY (rule_id, rule_result, quarter_start)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS global_rules_time_series_mv;
CREATE MATERIALIZED VIEW global_rules_time_series_mv 
TO global_rules_time_series AS
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY quarter_start, rule_id, rule_result;

DROP TABLE IF EXISTS global_rules_top_summary;
CREATE TABLE global_rules_top_summary 
(
    rule_id LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64),
    pages_count AggregateFunction(groupBitmap, UInt32),
    websites_count AggregateFunction(groupBitmap, UInt32)
) 
ENGINE = AggregatingMergeTree()
ORDER BY (rule_result, rule_id)
SETTINGS index_granularity = 4096;

DROP VIEW IF EXISTS global_rules_top_summary_mv;
CREATE MATERIALIZED VIEW global_rules_top_summary_mv 
TO global_rules_top_summary AS
SELECT 
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY rule_id, rule_result;

---- DIRECTORIES

--- Global Directories Statistics and Rules Summary Tables
DROP TABLE IF EXISTS global_directories_statistics;
CREATE TABLE global_directories_statistics (
    min_score  Float32,
    max_score Float32,
    avg_score Decimal32(2),
    directories_count UInt32,
    institutions_count UInt32,
    websites_count UInt32,
    page_count UInt32,
    oldest_evaluation_date DateTime,
    recent_evaluation_date DateTime
) ENGINE = MergeTree();

DROP VIEW IF EXISTS mv_global_directories_statistics;
CREATE MATERIALIZED VIEW mv_global_directories_statistics
REFRESH EVERY 30 MINUTE
TO global_directories_statistics AS
WITH temp_pages AS (
    SELECT * 
    FROM latest_page_evaluations_temp 
    where dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
),
main_pages AS (
    SELECT *
    FROM latest_page_evaluations FINAL
    WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true AND page_id NOT IN (SELECT page_id FROM temp_pages)
    
),
union_all_pages AS (
    SELECT *
    FROM temp_pages
    UNION ALL
    SELECT *
    FROM main_pages
),
combined_latest AS (
    SELECT * FROM union_all_pages
    WHERE directories_ids IS NOT NULL AND length(directories_ids) > 0
)
SELECT
    min(score) AS min_score,
    max(score) AS max_score,
    avg(CAST(score, 'Decimal64(4)')) AS avg_score,
    uniqArray(directories_ids) AS directories_count,
    uniq(institution_id) AS institutions_count,
    uniq(website_id) AS websites_count,
    uniq(page_id) AS page_count,
    min(evaluation_date) AS oldest_evaluation_date,
    max(evaluation_date) AS recent_evaluation_date
FROM combined_latest;


DROP TABLE IF EXISTS ranked_directories;
CREATE TABLE ranked_directories (
    directory_id UInt32,
    name LowCardinality(String),
    score_avg Float32,
    institutions_count UInt32,
    websites_count UInt32,
    page_count UInt32,
    stamps_count UInt32,
    declarations_count UInt32,
    oldest_evaluation_date DateTime,
    recent_evaluation_date DateTime,
    a_conform_count UInt32,
    aa_conform_count UInt32,
    aaa_conform_count UInt32,
    total_bronze_stamps UInt32,
    total_silver_stamps UInt32,
    total_gold_stamps UInt32,
    total_nonconform_declarations UInt32,
    total_partiallyconform_declarations UInt32,
    total_conform_declarations UInt32
) ENGINE = MergeTree() 
ORDER BY (directory_id)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS mv_ranked_directories;
CREATE MATERIALIZED VIEW mv_ranked_directories
REFRESH EVERY 30 MINUTE
TO ranked_directories AS
WITH temp_pages AS (
    SELECT * 
    FROM latest_page_evaluations_temp 
    where dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
),
main_pages AS (
    SELECT *
    FROM latest_page_evaluations FINAL
    WHERE dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true AND page_id NOT IN (SELECT page_id FROM temp_pages)
    
),
union_all_pages AS (
    SELECT *
    FROM temp_pages
    UNION ALL
    SELECT *
    FROM main_pages
),
combined_latest AS (
     SELECT *
FROM union_all_pages
WHERE length(directories_ids) > 0
  AND arrayExists(
      x -> dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', x, false) = true,
      directories_ids
  )
),
directory_metrics AS (
    SELECT
        dir_id AS directory_id,
        dictGetOrDefault('directories_metadata_dict', ('name', 'website_count', 'total_stamps', 'total_declarations','total_bronze_stamps',
		'total_silver_stamps','total_gold_stamps','total_nonconform_declarations','total_partiallyconform_declarations','total_conform_declarations'), dir_id, ('', 0, 0, 0, 0, 0, 0, 0, 0, 0)) AS meta,
        avg(score) AS score_avg,
        uniq(institution_id) AS institutions_count,
        count(page_id) AS page_count,
        min(evaluation_date) AS oldest_evaluation_date,
        max(evaluation_date) AS recent_evaluation_date,
        countIf(aaa_error_count = 0) AS aaa_conform_count,
        countIf(aa_error_count = 0) AS aa_conform_count,
        countIf(a_error_count = 0) AS a_conform_count
    FROM combined_latest
    ARRAY JOIN directories_ids AS dir_id
    WHERE dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', dir_id, false) = true
    GROUP BY dir_id
)
SELECT
    directory_id,
    meta.1 AS name,
    score_avg,
    institutions_count,
    meta.2 AS websites_count,
    page_count,
    meta.3 AS stamps_count,
    meta.4 AS declarations_count,
    oldest_evaluation_date,
    recent_evaluation_date,
    aaa_conform_count,
    aa_conform_count,
    a_conform_count,
	meta.5 AS total_bronze_stamps,
	meta.6 AS  total_silver_stamps,
	meta.7 AS total_gold_stamps,
	meta.8 AS total_nonconform_declarations,
	meta.9 AS total_partiallyconform_declarations,
	meta.10 AS total_conform_declarations
FROM directory_metrics
ORDER BY score_avg DESC, directory_id ASC;

--
DROP TABLE IF EXISTS directory_snapshots_statistics_time_series;
CREATE TABLE directory_snapshots_statistics_time_series (
    quarter_start Date,
    directory_id UInt32,
    min_score SimpleAggregateFunction(min, Float32),
    max_score SimpleAggregateFunction(max, Float32),
    avg_score AggregateFunction(avg, Decimal32(2)),
    count_evals AggregateFunction(uniq, UInt32)
) ENGINE = AggregatingMergeTree()
ORDER BY (directory_id, quarter_start)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS directory_snapshots_statistics_mv;

CREATE MATERIALIZED VIEW directory_snapshots_statistics_mv 
TO directory_snapshots_statistics_time_series AS
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    arrayJoin(directories_ids) AS directory_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, directory_id;

DROP TABLE IF EXISTS directory_snapshot_rules_time_series;
CREATE TABLE directory_snapshot_rules_time_series (
    quarter_start Date,
    directory_id UInt32,
    rule_id LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64),
    pages_count AggregateFunction(groupBitmap, UInt32),
    websites_count AggregateFunction(groupBitmap, UInt32)
) ENGINE = AggregatingMergeTree()
ORDER BY (directory_id, quarter_start, rule_id, rule_result)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS directory_snapshot_rules_time_series_mv;

CREATE MATERIALIZED VIEW directory_snapshot_rules_time_series_mv 
TO directory_snapshot_rules_time_series AS
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    arrayJoin(directories_ids) AS directory_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY quarter_start, directory_id, rule_id, rule_result;


-- =====================================================================
-- INSTITUIÇÕES (INSTITUTIONS)
-- =====================================================================

DROP TABLE IF EXISTS institution_snapshots_statistics;
CREATE TABLE institution_snapshots_statistics (
    quarter_start Date,
    institution_id UInt32,
    min_score SimpleAggregateFunction(min, Float32),
    max_score SimpleAggregateFunction(max, Float32),
    avg_score AggregateFunction(avg, Decimal32(2)),
    count_evals AggregateFunction(uniq, UInt32)
) ENGINE = AggregatingMergeTree()
ORDER BY (institution_id, quarter_start)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS institution_snapshots_statistics_mv;
CREATE MATERIALIZED VIEW institution_snapshots_statistics_mv 
TO institution_snapshots_statistics AS 
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    institution_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, institution_id;


DROP TABLE IF EXISTS institution_snapshot_rules;
CREATE TABLE institution_snapshot_rules (
    quarter_start Date,
    institution_id UInt32,
    rule_id LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64),
    pages_count AggregateFunction(groupBitmap, UInt32),
    websites_count AggregateFunction(groupBitmap, UInt32)
) ENGINE = AggregatingMergeTree()
ORDER BY (institution_id, quarter_start, rule_id, rule_result)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS institution_snapshot_rules_mv;
CREATE MATERIALIZED VIEW institution_snapshot_rules_mv 
TO institution_snapshot_rules AS 
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    institution_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY quarter_start, institution_id, rule_id, rule_result;


-- =====================================================================
-- WEBSITES
-- =====================================================================

DROP TABLE IF EXISTS website_snapshots_statistics;
CREATE TABLE website_snapshots_statistics (
    quarter_start Date,
    website_id UInt32,
    min_score SimpleAggregateFunction(min, Float32),
    max_score SimpleAggregateFunction(max, Float32),
    avg_score AggregateFunction(avg, Decimal32(2)),
    count_evals AggregateFunction(uniq, UInt32)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYear(quarter_start)
ORDER BY (website_id, quarter_start)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS website_snapshots_statistics_mv;
CREATE MATERIALIZED VIEW website_snapshots_statistics_mv 
TO website_snapshots_statistics AS 
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, website_id;



DROP TABLE IF EXISTS website_snapshot_rules;
CREATE TABLE website_snapshot_rules (
    quarter_start Date,
    website_id UInt32,
    rule_id LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64),
    pages_count AggregateFunction(groupBitmap, UInt32)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYear(quarter_start)
ORDER BY (website_id, quarter_start, rule_id, rule_result)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS website_snapshot_rules_mv;

CREATE MATERIALIZED VIEW website_snapshot_rules_mv 
TO website_snapshot_rules AS 
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count
FROM evaluations
GROUP BY quarter_start, website_id, rule_id, rule_result;


-- =====================================================================
-- PÁGINAS (PAGES)
-- =====================================================================

DROP TABLE IF EXISTS page_snapshots_statistics;

CREATE TABLE page_snapshots_statistics (
    quarter_start Date,
    website_id UInt32,
    page_id UInt32,
    min_score SimpleAggregateFunction(min, Float32),
    max_score SimpleAggregateFunction(max, Float32),
    avg_score AggregateFunction(avg, Decimal32(2)),
    count_evals AggregateFunction(uniq, UInt32)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYear(quarter_start)
ORDER BY (website_id, page_id, quarter_start)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS page_snapshots_statistics_mv;

CREATE MATERIALIZED VIEW page_snapshots_statistics_mv 
TO page_snapshots_statistics AS 
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    page_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, website_id, page_id;

DROP TABLE IF EXISTS page_snapshot_rules;
CREATE TABLE page_snapshot_rules (
    quarter_start Date,
    website_id UInt32,
    page_id UInt32,
    rule_id LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYear(quarter_start)
ORDER BY (website_id, page_id, quarter_start, rule_id, rule_result)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS page_snapshot_rules_mv;
CREATE MATERIALIZED VIEW page_snapshot_rules_mv 
TO page_snapshot_rules AS 
SELECT 
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    page_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count
FROM evaluations
GROUP BY quarter_start, website_id, page_id, rule_id, rule_result;



--- TEMP EVALUATIONS AGGREGATE TABLES
DROP TABLE IF EXISTS temp_rules_top_summary;
CREATE TABLE temp_rules_top_summary
(
    rule_id  LowCardinality(String),
    rule_result LowCardinality(String),
    occurrence_count SimpleAggregateFunction(sum, UInt64),
    pages_count AggregateFunction(groupBitmap, UInt32),
    websites_count AggregateFunction(groupBitmap, UInt32)
)
ENGINE = AggregatingMergeTree
ORDER BY (rule_result, rule_id)
SETTINGS index_granularity = 4096;

DROP VIEW IF EXISTS mv_refresh_temp_rules;
CREATE MATERIALIZED VIEW mv_refresh_temp_rules 
REFRESH EVERY 60 MINUTE TO temp_rules_top_summary
AS 
SELECT 
    rule_id,
    rule_result,
    count() AS occurrence_count,
    groupBitmapState(toUInt32(page_id)) AS pages_count,
    groupBitmapState(toUInt32(website_id)) AS websites_count
FROM evaluations_temp
WHERE (is_deleted = 0) 
  AND (is_migrated = 0) 
  AND (rule_result IN ('failed', 'passed'))
GROUP BY 
    rule_id,
    rule_result;


