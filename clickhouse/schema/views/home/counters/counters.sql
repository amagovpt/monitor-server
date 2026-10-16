CREATE OR REPLACE VIEW v_app_counters AS
WITH 
    counters AS (
        SELECT
            sumIf(total_count, entity_type = 'directories')           AS d_directories,
            sumIf(total_count, entity_type = 'tags')                  AS d_tags,
            sumIf(total_count, entity_type = 'institutions')          AS d_institutions,
            sumIf(total_count, entity_type = 'websites')              AS d_websites,
            sumIf(total_count, entity_type = 'page_contexts_ams')     AS d_pages_ams,
            sumIf(total_count, entity_type = 'users_ams')             AS d_users_ams,
            sumIf(total_count, entity_type = 'evaluation_contexts_ams')  AS d_evaluations_ams,
            sumIf(total_count, entity_type = 'evaluation_contexts_monitor')  AS d_evaluations_mon,
            sumIf(total_count, entity_type = 'crawler_websites_contexts_ams')  AS d_crawler_websites_ams,
            sumIf(total_count, entity_type = 'crawler_websites_contexts_monitor')  AS d_crawler_websites_mon,

            sumIf(total_count, entity_type = 'websites_observatorio') AS d_websites_obs,
            sumIf(total_count, entity_type = 'pages_observatorio')    AS d_pages_obs,
            sumIf(total_count, entity_type = 'users_monitor')         AS d_users_mon,
            sumIf(total_count, entity_type = 'teams')                 AS d_teams,
            sumIf(total_count, entity_type = 'websites_monitor')      AS d_websites_mon,
            sumIf(total_count, entity_type = 'page_contexts_monitor') AS d_pages_mon,

            sumIf(total_count, entity_type = 'deleted_users')  AS d_deleted_users,
            sumIf(total_count, entity_type = 'users')  AS d_users,
            sumIf(total_count, entity_type = 'gov_users')  AS d_gov_users,
            sumIf(total_count, entity_type = 'non_gov_users')  AS d_non_gov_users,
            sumIf(total_count, entity_type = 'pages')     AS d_total_pages,
            sumIf(total_count, entity_type = 'evaluations')  AS d_total_evaluations,
            
            sumIf(total_count, entity_type = 'crawler_websites')  AS d_total_crawler_websites,
            sumIf(total_count, entity_type = 'evaluations_published')  AS d_total_evaluations_published,
            sumIf(total_count, entity_type = 'evaluations_staged')  AS d_total_evaluations_staged


        FROM dict_app_counters
    )
SELECT
    -- AMS
    CAST(
        tuple(
            d_directories,
            d_tags,
            d_institutions,
            d_websites,
            d_pages_ams,
            d_users_ams,
            d_evaluations_ams
        ),
        'Tuple(directories UInt64, tags UInt64, entities UInt64, websites UInt64, pages UInt64, users UInt64, evaluations UInt64)'
    ) AS ams,

    -- OBSERVATORY
    CAST(
        tuple(
            d_directories,
            d_tags,
            d_institutions,
            d_websites_obs,
            d_pages_obs,
            d_total_evaluations_published
        ),
        'Tuple(directories UInt64, tags UInt64, entities UInt64, websites UInt64, pages UInt64, evaluations UInt64)'
    ) AS observatory,

    -- MYMONITOR
    CAST(
        tuple(
            d_users_mon,
            d_teams,
            d_websites_mon,
            d_evaluations_mon,
            d_pages_mon
        ),
        'Tuple(users UInt64, teams UInt64, websites UInt64, evaluations UInt64, pages UInt64)'
    ) AS mymonitor,

    -- Other Overall Totals
        CAST(
        tuple(
            d_users,
            d_gov_users,
            d_non_gov_users,
            d_teams,
            d_total_evaluations,
            d_total_evaluations_published,
            d_total_evaluations_staged,
            d_total_pages
        ),
        'Tuple(users UInt64, gov_users UInt64, non_gov_users UInt64, teams UInt64, evaluations UInt64, evaluations_published UInt64, evaluations_staged UInt64, pages UInt64)'
    ) AS total


FROM counters
FORMAT JSONEachRow;