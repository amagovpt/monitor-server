--- Definitive Evaluations Source Of Truth Table

 -- directories_ids  and institution_id represent the directories and institution associated with the evaluation
 -- when the evaluation was performed, it may change over time, thats why every check for directories and institution associated to websites
 -- should be performe on the dictionaries of institutions and websites and directories dictionary
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
    version UInt64 DEFAULT toUnixTimestamp64Milli(toDateTime64(evaluation_date, 3)),
    is_deleted UInt8 DEFAULT 0
) ENGINE = ReplacingMergeTree(version)
ORDER BY (website_id, page_id)
SETTINGS index_granularity = 4096;


DROP VIEW IF EXISTS accessibility.mv_latest_page_evaluations;

CREATE MATERIALIZED VIEW accessibility.mv_latest_page_evaluations
TO accessibility.latest_page_evaluations
AS 
SELECT
    website_id,
    argMax(page_id, evaluation_date) AS page_id,
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
    toUInt64(toUnixTimestamp64Milli(toDateTime64(evaluation_date, 3))) AS version,
    toUInt8(0) AS is_deleted
FROM accessibility.evaluations
GROUP BY
    website_id,
    evaluation_id,
    evaluation_date,
    score;

--- Evaluations Temp Table

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
    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    is_deleted UInt8 DEFAULT 0,
    is_migrated UInt8 DEFAULT 0
) ENGINE = ReplacingMergeTree(version, is_deleted)
ORDER BY (website_id, page_id, evaluation_id, rule_id);


DROP TABLE IF EXISTS latest_page_evaluations_temp;
CREATE TABLE latest_page_evaluations_temp (
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
) ENGINE = MergeTree()
ORDER BY ( website_id, page_id);


---- Fazer uma VIEW sem ser materialiada para as queries do AMS
DROP VIEW IF EXISTS mv_latest_page_evaluations_temp;
CREATE MATERIALIZED VIEW mv_latest_page_evaluations_temp
REFRESH EVERY 2 MINUTE
TO latest_page_evaluations_temp AS
SELECT
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
    ) AS passed_rules
FROM accessibility.evaluations_temp
GROUP BY
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score;

---- LATEST PAGES EVALUATIONS VIEW (OBSERVATORY ONLY)
CREATE OR REPLACE VIEW v_latest_pages_evaluations AS

WITH
    eligible_websites AS (
    SELECT website_id
    FROM (
        SELECT DISTINCT website_id FROM accessibility.latest_page_evaluations
        UNION DISTINCT
        SELECT DISTINCT website_id FROM accessibility.latest_page_evaluations_temp
    )
    WHERE dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
      AND arrayExists(
            x -> dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', x, false) = true,
            dictGetOrDefault('institution_websites_dict', 'directories_ids', website_id, [])
          )
),

    temp_pages AS (
        SELECT
            website_id, page_id, evaluation_id, evaluation_date, score,
            aaa_error_count, aa_error_count, a_error_count, total_error_count,
            failed_rules, warning_rules, passed_rules
        FROM accessibility.latest_page_evaluations_temp
        WHERE website_id IN eligible_websites
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
    ),

    main_pages AS (
        SELECT
            website_id, page_id,
            argMax(evaluation_id,     version) AS evaluation_id,
            argMax(evaluation_date,   version) AS evaluation_date,
            argMax(score,             version) AS score,
            argMax(aaa_error_count,   version) AS aaa_error_count,
            argMax(aa_error_count,    version) AS aa_error_count,
            argMax(a_error_count,     version) AS a_error_count,
            argMax(total_error_count, version) AS total_error_count,
            argMax(failed_rules,      version) AS failed_rules,
            argMax(warning_rules,     version) AS warning_rules,
            argMax(passed_rules,      version) AS passed_rules
        FROM accessibility.latest_page_evaluations
        WHERE website_id IN eligible_websites
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
          AND page_id NOT IN (SELECT page_id FROM temp_pages)
        GROUP BY website_id, page_id
        HAVING argMax(is_deleted, version) = 0
        )

SELECT * FROM temp_pages
UNION ALL
SELECT * FROM main_pages;


---- LATEST PAGES EVALUATIONS VIEW ALL
CREATE OR REPLACE VIEW accessibility.v_latest_pages_evaluations_all AS
WITH
    temp_pages AS (
        SELECT
            website_id, page_id, evaluation_id, evaluation_date, score,
            aaa_error_count, aa_error_count, a_error_count, total_error_count,
            failed_rules, warning_rules, passed_rules
        FROM accessibility.latest_page_evaluations_temp
        WHERE  dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true

    ),
    main_pages AS (
        SELECT
            website_id, page_id,
            argMax(evaluation_id,     version) AS evaluation_id,
            argMax(evaluation_date,   version) AS evaluation_date,
            argMax(score,             version) AS score,
            argMax(aaa_error_count,   version) AS aaa_error_count,
            argMax(aa_error_count,    version) AS aa_error_count,
            argMax(a_error_count,     version) AS a_error_count,
            argMax(total_error_count, version) AS total_error_count,
            argMax(failed_rules,      version) AS failed_rules,
            argMax(warning_rules,     version) AS warning_rules,
            argMax(passed_rules,      version) AS passed_rules
        FROM accessibility.latest_page_evaluations
        WHERE (website_id, page_id) NOT IN (SELECT website_id, page_id FROM temp_pages)
          AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
        GROUP BY website_id, page_id
        HAVING argMax(is_deleted, version) = 0
    )
SELECT * FROM temp_pages
UNION ALL
SELECT * FROM main_pages;


-- =====================================================================
-- 1) GLOBAL STATISTICS
-- =====================================================================
DROP VIEW IF EXISTS mv_global_statistics;
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
) ENGINE = MergeTree
ORDER BY tuple();

DROP VIEW IF EXISTS mv_global_statistics;
CREATE MATERIALIZED VIEW mv_global_statistics
REFRESH EVERY 2 MINUTE
TO global_statistics
AS
SELECT
    min(score)                                         AS min_score,
    max(score)                                         AS max_score,
    avg(CAST(score, 'Decimal64(4)'))                   AS avg_score,
    dictGet('dict_app_counters', 'total_count', tuple('directories_obs'))        AS directories_count,
    dictGet('dict_app_counters', 'total_count', tuple('institutions'))           AS institutions_count,
    dictGet('dict_app_counters', 'total_count', tuple('websites_observatorio'))  AS websites_count,
    uniq(evaluation_id)                                                          AS evaluations_count,
    dictGet('dict_app_counters', 'total_count', tuple('pages_observatorio'))     AS count_pages,
    min(evaluation_date)                               AS oldest_evaluation_date,
    max(evaluation_date)                               AS recent_evaluation_date,
    countIf(aaa_error_count = 0)                       AS pagesWithoutAAAErrors_count,
    countIf(aa_error_count = 0)                        AS pagesWithoutAAErrors_count,
    countIf(a_error_count = 0)                         AS pagesWithoutAErrors_count,
    sum(total_error_count)                             AS total_errors_sum
FROM accessibility.v_latest_pages_evaluations;


-- =====================================================================
-- 2) GLOBAL RULES TOP SUMMARY
-- =====================================================================
DROP VIEW IF EXISTS global_rules_top_summary_mv;
DROP TABLE IF EXISTS global_rules_top_summary;
CREATE TABLE global_rules_top_summary
(
    rule_id          LowCardinality(String),
    rule_result      LowCardinality(String),
    occurrence_count UInt64,
    pages_count      UInt64,
    websites_count   UInt64
)
ENGINE = MergeTree
ORDER BY (rule_result, rule_id);

DROP VIEW IF EXISTS global_rules_top_summary_mv;
CREATE MATERIALIZED VIEW global_rules_top_summary_mv
REFRESH EVERY 5 MINUTE
TO global_rules_top_summary
AS
WITH latest_pages AS (
    SELECT 
        website_id, 
        page_id, 
        failed_rules, 
        warning_rules, 
        passed_rules
    FROM accessibility.v_latest_pages_evaluations
)
SELECT
    CAST(rule_id, 'LowCardinality(String)') AS rule_id,
    CAST(rule_result, 'LowCardinality(String)') AS rule_result,
    sum(toUInt64(count)) AS occurrence_count,
    uniqExact(website_id, page_id) AS pages_count,
    uniqExact(website_id) AS websites_count
FROM (
    SELECT website_id, page_id, rule_id, count, 'failed' AS rule_result
    FROM latest_pages
    ARRAY JOIN mapKeys(failed_rules) AS rule_id, mapValues(failed_rules) AS count

    UNION ALL

    SELECT website_id, page_id, rule_id, count, 'warning' AS rule_result
    FROM latest_pages
    ARRAY JOIN mapKeys(warning_rules) AS rule_id, mapValues(warning_rules) AS count

    UNION ALL

    SELECT website_id, page_id, rule_id, count, 'passed' AS rule_result
    FROM latest_pages
    ARRAY JOIN mapKeys(passed_rules) AS rule_id, mapValues(passed_rules) AS count
)
GROUP BY rule_id, rule_result;



CREATE VIEW v_global_evaluations AS
SELECT 
    evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    rule_result
FROM evaluations

UNION ALL

SELECT 
    evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    rule_result
FROM evaluations_temp
WHERE is_deleted = 0 AND is_migrated = 0;


-- =====================================================================
-- 3) DIRECTORIES: estatísticas globais
-- =====================================================================
DROP VIEW IF EXISTS mv_global_directories_statistics;
DROP TABLE IF EXISTS global_directories_statistics;
CREATE TABLE global_directories_statistics (
    min_score Float32,
    max_score Float32,
    avg_score Decimal32(2),
    directories_count UInt32,
    institutions_count UInt32,
    websites_count UInt32,
    page_count UInt32,
    oldest_evaluation_date DateTime,
    recent_evaluation_date DateTime
) ENGINE = MergeTree
ORDER BY tuple();

DROP VIEW IF EXISTS mv_global_directories_statistics;
CREATE MATERIALIZED VIEW mv_global_directories_statistics
REFRESH EVERY 2 MINUTE
TO global_directories_statistics
AS
SELECT
    min(score)                       AS min_score,
    max(score)                       AS max_score,
    avg(CAST(score, 'Decimal64(4)')) AS avg_score,
    dictGet('dict_app_counters', 'total_count', tuple('directories_obs'))        AS directories_count,
    dictGet('dict_app_counters', 'total_count', tuple('institutions'))           AS institutions_count,
    dictGet('dict_app_counters', 'total_count', tuple('websites_observatorio'))  AS websites_count,
    dictGet('dict_app_counters', 'total_count', tuple('pages_observatorio'))     AS page_count,
    min(evaluation_date)             AS oldest_evaluation_date,
    max(evaluation_date)             AS recent_evaluation_date
FROM accessibility.v_latest_pages_evaluations
WHERE notEmpty(dictGetOrDefault('institution_websites_dict', 'directories_ids', website_id, []));
 
 

-- =====================================================================
-- 4) RANKED DIRECTORIES
-- =====================================================================
DROP VIEW IF EXISTS mv_ranked_directories;
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
    a_conform_count UInt32,      -- nº de WEBSITES (escalão A)
    aa_conform_count UInt32,     -- nº de WEBSITES (escalão AA)
    aaa_conform_count UInt32,    -- nº de WEBSITES (escalão AAA)
    total_bronze_stamps UInt32,
    total_silver_stamps UInt32,
    total_gold_stamps UInt32,
    total_nonconform_declarations UInt32,
    total_partiallyconform_declarations UInt32,
    total_conform_declarations UInt32
) ENGINE = MergeTree
ORDER BY (directory_id)
SETTINGS index_granularity = 4096;

DROP  VIEW IF EXISTS mv_ranked_directories;
CREATE MATERIALIZED VIEW mv_ranked_directories
REFRESH EVERY 2 MINUTE
TO ranked_directories
AS
WITH
    website_stats AS (
        SELECT
            website_id,
            sum(score)                    AS score_sum,
            count()                       AS page_count,
            min(evaluation_date)          AS oldest_evaluation_date,
            max(evaluation_date)          AS recent_evaluation_date,
            countIf(a_error_count   > 0)  AS pages_with_a_errors,
            countIf(aa_error_count  > 0)  AS pages_with_aa_errors,
            countIf(aaa_error_count > 0)  AS pages_with_aaa_errors
        FROM accessibility.v_latest_pages_evaluations
        GROUP BY website_id
    ),

    directory_websites AS (
        SELECT id AS directory_id, arrayJoin(website_ids) AS website_id
        FROM directories_metadata_dict
        WHERE is_in_observatory = true
    ),

    directory_metrics AS (
        SELECT
            dw.directory_id AS directory_id,
            dictGetOrDefault('directories_metadata_dict',
                ('name', 'website_count', 'total_stamps', 'total_declarations',
                 'total_bronze_stamps', 'total_silver_stamps', 'total_gold_stamps',
                 'total_nonconform_declarations', 'total_partiallyconform_declarations',
                 'total_conform_declarations'),
                dw.directory_id, ('', 0, 0, 0, 0, 0, 0, 0, 0, 0)) AS meta,
            sum(ws.score_sum) / sum(ws.page_count)                AS score_avg,
            uniqExact(dictGetOrDefault('institution_websites_dict', 'institution_id',
                                       toUInt64(dw.website_id), 0)) AS institutions_count,
            sum(ws.page_count)                                    AS page_count,
            min(ws.oldest_evaluation_date)                        AS oldest_evaluation_date,
            max(ws.recent_evaluation_date)                        AS recent_evaluation_date,
            countIf(ws.pages_with_a_errors = 0 AND ws.pages_with_aa_errors > 0)   AS a_conform_count,
            countIf(ws.pages_with_a_errors = 0 AND ws.pages_with_aa_errors = 0
                    AND ws.pages_with_aaa_errors > 0)                             AS aa_conform_count,
            countIf(ws.pages_with_a_errors = 0 AND ws.pages_with_aa_errors = 0
                    AND ws.pages_with_aaa_errors = 0)                             AS aaa_conform_count
        FROM directory_websites AS dw
        INNER JOIN website_stats AS ws ON ws.website_id = dw.website_id
        GROUP BY dw.directory_id
    )
SELECT
    directory_id,
    meta.1  AS name,
    score_avg,
    institutions_count,
    meta.2  AS websites_count,
    page_count,
    meta.3  AS stamps_count,
    meta.4  AS declarations_count,
    oldest_evaluation_date,
    recent_evaluation_date,
    a_conform_count,
    aa_conform_count,
    aaa_conform_count,
    meta.5  AS total_bronze_stamps,
    meta.6  AS total_silver_stamps,
    meta.7  AS total_gold_stamps,
    meta.8  AS total_nonconform_declarations,
    meta.9  AS total_partiallyconform_declarations,
    meta.10 AS total_conform_declarations
FROM directory_metrics;



----------------- REAL TIME QUERIES --- Slower, to use with caching and in AMS only


DROP VIEW IF EXISTS mv_latest_page_evaluations_temp_real_time;
CREATE OR REPLACE VIEW accessibility.mv_latest_page_evaluations_temp_real_time AS
WITH per_evaluation AS (
    SELECT
        website_id,
        page_id,
        evaluation_id,
        evaluation_date,
        toFloat32(score) AS score,
        toUInt32(countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'AAA' AND rule_result = 'failed')) AS aaa_error_count,
        toUInt32(countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'AA' AND rule_result = 'failed')) AS aa_error_count,
        toUInt32(countIf(dictGet('rules_dict', 'wcag_level', rule_id) = 'A' AND rule_result = 'failed')) AS a_error_count,
        toUInt32(sumIf(count, rule_result = 'failed')) AS total_error_count,
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
        ) AS passed_rules
    FROM accessibility.evaluations_temp
    WHERE is_deleted = 0 AND is_migrated = 0
    AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
    AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
    AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
    GROUP BY
        website_id,
        page_id,
        evaluation_id,
        evaluation_date,
        score
)
SELECT
    pe.website_id AS website_id,
    pe.page_id AS page_id,
    argMax(pe.evaluation_id,     (pe.evaluation_date, pe.evaluation_id)) AS evaluation_id,
    max(pe.evaluation_date)                                              AS evaluation_date,
    toFloat32(argMax(pe.score,   (pe.evaluation_date, pe.evaluation_id))) AS score,
    argMax(pe.aaa_error_count,   (pe.evaluation_date, pe.evaluation_id)) AS aaa_error_count,
    argMax(pe.aa_error_count,    (pe.evaluation_date, pe.evaluation_id)) AS aa_error_count,
    argMax(pe.a_error_count,     (pe.evaluation_date, pe.evaluation_id)) AS a_error_count,
    argMax(pe.total_error_count, (pe.evaluation_date, pe.evaluation_id)) AS total_error_count,
    argMax(pe.failed_rules,      (pe.evaluation_date, pe.evaluation_id)) AS failed_rules,
    argMax(pe.warning_rules,     (pe.evaluation_date, pe.evaluation_id)) AS warning_rules,
    argMax(pe.passed_rules,      (pe.evaluation_date, pe.evaluation_id)) AS passed_rules
FROM per_evaluation AS pe
WHERE 
     dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
    AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
    AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
GROUP BY pe.website_id, pe.page_id;



CREATE OR REPLACE VIEW accessibility.v_latest_pages_evaluations_real_time_obs AS
WITH
    eligible_websites AS (
        SELECT website_id
        FROM (
            SELECT DISTINCT website_id FROM accessibility.latest_page_evaluations
            UNION DISTINCT
            SELECT DISTINCT website_id FROM accessibility.mv_latest_page_evaluations_temp_real_time
        )
        WHERE dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
          AND arrayExists(
                x -> dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', x, false) = true,
                dictGetOrDefault('institution_websites_dict', 'directories_ids', website_id, [])
              )
    ),
    temp_pages AS (
        SELECT
            website_id,
            page_id,
            evaluation_id,
            evaluation_date,
            toFloat32(score) AS score,
            toUInt32(aaa_error_count) AS aaa_error_count,
            toUInt32(aa_error_count) AS aa_error_count,
            toUInt32(a_error_count) AS a_error_count,
            toUInt32(total_error_count) AS total_error_count,
            failed_rules,
            warning_rules,
            passed_rules
        FROM accessibility.mv_latest_page_evaluations_temp_real_time
        WHERE website_id IN eligible_websites
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
    ),
    main_pages AS (
        SELECT
            website_id,
            page_id,
            argMax(evaluation_id,     version) AS evaluation_id,
            argMax(evaluation_date,   version) AS evaluation_date,
            toFloat32(argMax(score,   version)) AS score,
            toUInt32(argMax(aaa_error_count,   version)) AS aaa_error_count,
            toUInt32(argMax(aa_error_count,    version)) AS aa_error_count,
            toUInt32(argMax(a_error_count,     version)) AS a_error_count,
            toUInt32(argMax(total_error_count, version)) AS total_error_count,
            argMax(failed_rules,      version) AS failed_rules,
            argMax(warning_rules,     version) AS warning_rules,
            argMax(passed_rules,      version) AS passed_rules
        FROM accessibility.latest_page_evaluations
        WHERE website_id IN eligible_websites
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND (website_id, page_id) NOT IN (SELECT website_id, page_id FROM temp_pages)
          AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
        GROUP BY website_id, page_id
        HAVING argMax(is_deleted, version) = 0
    )
SELECT * FROM temp_pages
UNION ALL
SELECT * FROM main_pages;






CREATE OR REPLACE VIEW accessibility.v_latest_pages_evaluations_real_time_all AS

WITH
    eligible_websites AS (
    SELECT website_id
    FROM (
        SELECT DISTINCT website_id FROM accessibility.latest_page_evaluations
        UNION DISTINCT
        SELECT DISTINCT website_id FROM accessibility.mv_latest_page_evaluations_temp_real_time
    )
),

    temp_pages AS (
        SELECT
            website_id, page_id, evaluation_id, evaluation_date, score,
            aaa_error_count, aa_error_count, a_error_count, total_error_count,
            failed_rules, warning_rules, passed_rules
        FROM accessibility.mv_latest_page_evaluations_temp_real_time
        WHERE website_id IN eligible_websites
          ),

    main_pages AS (
        SELECT
            website_id, page_id,
            argMax(evaluation_id,     version) AS evaluation_id,
            argMax(evaluation_date,   version) AS evaluation_date,
            argMax(score,             version) AS score,
            argMax(aaa_error_count,   version) AS aaa_error_count,
            argMax(aa_error_count,    version) AS aa_error_count,
            argMax(a_error_count,     version) AS a_error_count,
            argMax(total_error_count, version) AS total_error_count,
            argMax(failed_rules,      version) AS failed_rules,
            argMax(warning_rules,     version) AS warning_rules,
            argMax(passed_rules,      version) AS passed_rules
        FROM accessibility.latest_page_evaluations
        WHERE website_id IN eligible_websites
          AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
          AND dictGetOrDefault('pages_context_dict', 'is_archived', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_deleted', page_id, false) = false
          AND dictGetOrDefault('pages_context_dict', 'is_in_ams', page_id, false) = true
          AND page_id NOT IN (SELECT page_id FROM temp_pages)
        GROUP BY website_id, page_id
        HAVING argMax(is_deleted, version) = 0
        )

SELECT * FROM temp_pages
UNION ALL
SELECT * FROM main_pages;



DROP VIEW IF EXISTS mv_global_directories_statistics_real_time;
CREATE MATERIALIZED VIEW mv_global_directories_statistics_real_time
AS
SELECT
    min(CAST(score, 'Decimal64(4)')) AS min_score,
    max(CAST(score, 'Decimal64(4)')) AS max_score,
    avg(CAST(score, 'Decimal64(4)')) AS avg_score,
    dictGet('dict_app_counters', 'total_count', tuple('directories_obs'))       AS directories_count,
    dictGet('dict_app_counters', 'total_count', tuple('institutions'))          AS institutions_count,
    dictGet('dict_app_counters', 'total_count', tuple('websites_observatorio')) AS websites_count,
    dictGet('dict_app_counters', 'total_count', tuple('pages_observatorio'))    AS page_count,
    min(evaluation_date)             AS oldest_evaluation_date,
    max(evaluation_date)             AS recent_evaluation_date,
    countIf(aaa_error_count = 0)                       AS pagesWithoutAAAErrors_count,
    countIf(aa_error_count = 0)                        AS pagesWithoutAAErrors_count,
    countIf(a_error_count = 0)                         AS pagesWithoutAErrors_count,
    sum(total_error_count)                             AS total_errors_sum
FROM accessibility.v_latest_pages_evaluations_real_time_all
WHERE notEmpty(dictGetOrDefault('institution_websites_dict', 'directories_ids', website_id, []));



DROP VIEW IF EXISTS mv_global_statistics_real_time;
CREATE MATERIALIZED VIEW mv_global_statistics_real_time
AS
SELECT
    min(CAST(score, 'Decimal64(4)')) AS min_score,
    max(CAST(score, 'Decimal64(4)')) AS max_score,
    avg(CAST(score, 'Decimal64(4)')) AS avg_score,
    dictGet('dict_app_counters', 'total_count', tuple('directories_obs'))        AS directories_count,
    dictGet('dict_app_counters', 'total_count', tuple('institutions'))           AS institutions_count,
    dictGet('dict_app_counters', 'total_count', tuple('websites_observatorio'))  AS websites_count,
    uniq(evaluation_id)                                                          AS evaluations_count,
    dictGet('dict_app_counters', 'total_count', tuple('pages_observatorio'))     AS count_pages,
    min(evaluation_date)                               AS oldest_evaluation_date,
    max(evaluation_date)                               AS recent_evaluation_date,
    countIf(aaa_error_count = 0)                       AS pagesWithoutAAAErrors_count,
    countIf(aa_error_count = 0)                        AS pagesWithoutAAErrors_count,
    countIf(a_error_count = 0)                         AS pagesWithoutAErrors_count,
    sum(total_error_count)                             AS total_errors_sum
    
FROM accessibility.v_latest_pages_evaluations_real_time_all
