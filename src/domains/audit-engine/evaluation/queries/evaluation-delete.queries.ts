export const EVALUATION_DELETE_QUERY = `
INSERT INTO accessibility.evaluations_temp (
    evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    is_deleted
)
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
    1 AS is_deleted
FROM accessibility.evaluations_temp FINAL
PREWHERE is_deleted = 0 AND is_migrated = 0
WHERE evaluation_id = {evaluationId:UInt32}; `;

export const EVALUATION_DELETE_ROLLBACK_QUERY = `
DELETE FROM accessibility.evaluations_temp
WHERE evaluation_id = {evaluationId:UInt32}; `;
