import { ResourceExportQuery } from './type';

export const SELECT_LATEST_PAGES_EVALUATIONS_OBS = `
        SELECT * FROM v_latest_pages_evaluations_real_time_obs
`;

export const SELECT_LATEST_PAGES_EVALUATIONS_ALL = `
        SELECT * FROM v_latest_pages_evaluations_real_time_all
`;

export const EXPORT_QUERIES: ResourceExportQuery = {
  globalAMS: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_OBS}
  `,

  globalObservatory: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
  `,

  globalDirectory: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
    WHERE directory_id = {resourceId:String}
    ORDER BY evaluation_date DESC
  `,
  globalWebsite: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
    WHERE website_id = {resourceId:String}
    ORDER BY evaluation_date DESC
  `,

  globalEntity: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
    WHERE dictGetOrDefault('institution_websites_dict', 'institution_id', website_id, 0) = {resourceId: UInt32}
  `,

  globalTag: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
    WHERE has(dictGetOrDefault('institution_websites_dict', 'tags_ids', website_id, CAST([], 'Array(Int32)')), {resourceId: Int32})
  `,

  latestPageEvaluation: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
    WHERE page_id = {resourceId:String}
    ORDER BY evaluation_date DESC
  `,
  //TODO: Make a view for all pages evaluations as well
  allPagesEvaluations: `
    ${SELECT_LATEST_PAGES_EVALUATIONS_ALL}
    WHERE page_id = {resourceId:String}
    ORDER BY evaluation_date DESC
  `,
};
