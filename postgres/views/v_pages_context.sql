DROP VIEW v_pages_context;
CREATE VIEW v_pages_context
AS 
SELECT 
  p.id AS id,
  ac.context_id AS is_in_ams,
  mc.context_id AS is_in_mymonitor,
  p.is_in_observatory as is_in_observatory,
  p.deleted_at as is_deleted,
  p.archived_at as is_archived
FROM pages p
LEFT JOIN page_contexts_ams ac 
  ON ac.page_id = p.id
LEFT JOIN page_contexts_monitor mc 
  ON mc.page_id = p.id;