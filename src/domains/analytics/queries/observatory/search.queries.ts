export const SEARCH_WEBSITES_QUERY = `
    WITH
          filtered_websites AS
          (
              SELECT
                  website_id,
                  website_title,
                  directory_id,
                  declaration_status,
                  stamp
              FROM institution_websites_dict
              ARRAY JOIN directories_ids AS directory_id
              WHERE (is_in_observatory = true) 
                AND (
                    (positionCaseInsensitive(website_title, {token:String}) > 0) 
                    OR (positionCaseInsensitive(base_url, {token:String}) > 0)
                )
          ),
          temp_pages AS
          (
              SELECT
                  website_id,
                  page_id,
                  score
              FROM latest_page_evaluations_temp
              WHERE (website_id IN (
                  SELECT website_id
                  FROM filtered_websites
              )) AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true
                AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
          ),
          main_pages AS
          (
              SELECT
                  website_id,
                  page_id,
                  score
              FROM latest_page_evaluations
              FINAL
              WHERE (website_id IN (
                  SELECT website_id
                  FROM filtered_websites
              )) AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', page_id, false) = true 
               AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', website_id, false) = true
               AND (page_id NOT IN (
                  SELECT page_id
                  FROM temp_pages
              ))
          ), 
          combined_latest AS
          (
              SELECT *
              FROM temp_pages
              UNION ALL
              SELECT *
              FROM main_pages
          )
      SELECT
          fw.directory_id AS directoryId,
          dictGet('directories_metadata_dict', 'name', toUInt64(fw.directory_id)) AS directoryName,
          fw.website_id AS id,
          fw.website_title AS name,
          multiIf(
              fw.declaration_status = 'CONFORM', 3, 
              fw.declaration_status = 'PARTIALLY_CONFORM', 2, 
              fw.declaration_status = 'NON_CONFORM', 1, 
              NULL
          ) AS declaration,
          multiIf(
              fw.stamp = 'GOLD', 3, 
              fw.stamp = 'SILVER', 2, 
              fw.stamp = 'BRONZE', 1, 
              NULL
          ) AS stamp,
           toFloat32(avg(cl.score)) AS score,
           toUInt32(uniqExact(cl.page_id)) AS nPages
      FROM filtered_websites AS fw
      INNER JOIN combined_latest AS cl ON cl.website_id = fw.website_id
      WHERE dictGetOrDefault('directories_metadata_dict', 'is_in_observatory', toUInt64(fw.directory_id), false) = true
      AND dictGetOrDefault('pages_context_dict', 'is_in_observatory', cl.page_id, false) = true
      AND dictGetOrDefault('institution_websites_dict', 'is_in_observatory', cl.website_id, false) = true
      GROUP BY
          fw.directory_id,
          fw.website_id,
          fw.website_title,
          fw.declaration_status,
          fw.stamp
      ORDER BY
          score DESC,
          nPages DESC
      LIMIT 200;
`;
