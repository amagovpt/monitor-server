DROP TABLE IF EXISTS entity_counters;
CREATE TABLE entity_counters (
    entity_type VARCHAR(50) PRIMARY KEY,
    total_count BIGINT NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO entity_counters (entity_type, total_count) VALUES
    ('directories', 0),
    ('evaluations', 0),
    ('pages', 0),
    ('crawler_websites', 0),
    ('users', 0),
    ('websites', 0),
    ('tags', 0),
    ('teams', 0),
    ('institutions', 0),
    ('page_contexts_ams', 0),
    ('page_contexts_monitor', 0),
    ('evaluation_contexts_ams', 0),
    ('evaluation_contexts_monitor', 0),
    ('crawler_websites_contexts_ams', 0),
    ('crawler_websites_contexts_monitor', 0)
ON CONFLICT (entity_type) DO NOTHING;

-- Função simplificada com RETURNING atómico
CREATE OR REPLACE FUNCTION process_entity_delta() 
RETURNS TRIGGER AS $$
DECLARE
    v_entity_name CONSTANT VARCHAR(50) := TG_TABLE_NAME;
    v_delta       INTEGER;
    v_new_total   BIGINT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_delta := 1;
    ELSIF (TG_OP = 'DELETE') THEN
        v_delta := -1;
    ELSE
        RETURN NULL;
    END IF;

    UPDATE entity_counters 
    SET total_count = total_count + v_delta, 
        last_updated_at = NOW() 
    WHERE entity_type = v_entity_name
    RETURNING total_count INTO v_new_total;

    PERFORM pg_notify(
        'entity_counts_channel', 
        json_build_object(
            'entity', v_entity_name,
            'count', v_new_total                                                                                                                                                                                        
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Registo dinâmico dos triggers
DO $$ 
DECLARE
    tname TEXT;
    target_tables TEXT[] := ARRAY[
        'directories', 'evaluations', 'pages', 
        'crawler_websites', 'users', 'websites', 
        'tags', 'teams', 'institutions',
        'page_contexts_ams', 'page_contexts_monitor',
        'evaluation_contexts_ams', 'evaluation_contexts_monitor',
        'crawler_websites_contexts_ams', 'crawler_websites_contexts_monitor'
    ];
BEGIN
    FOREACH tname IN ARRAY target_tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_delta ON %I;', tname, tname);
        EXECUTE format('
            CREATE TRIGGER trg_%I_delta
            AFTER INSERT OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION process_entity_delta();', 
            tname, tname
        );
    END LOOP;
END $$;

-- Recálculo inicial dos contadores
UPDATE entity_counters ec
SET total_count = sub.cnt, 
    last_updated_at = NOW()
FROM (
    SELECT 'directories' AS entity, count(*) AS cnt FROM directories
    UNION ALL SELECT 'evaluations', count(*) FROM evaluations
    UNION ALL SELECT 'pages', count(*) FROM pages
    UNION ALL SELECT 'crawler_websites', count(*) FROM crawler_websites
    UNION ALL SELECT 'users', count(*) FROM users
    UNION ALL SELECT 'websites', count(*) FROM websites
    UNION ALL SELECT 'tags', count(*) FROM tags
    UNION ALL SELECT 'teams', count(*) FROM teams
    UNION ALL SELECT 'institutions', count(*) FROM institutions
    UNION ALL SELECT 'page_contexts_ams', count(*) FROM page_contexts_ams
    UNION ALL SELECT 'page_contexts_monitor', count(*) FROM page_contexts_monitor
    UNION ALL SELECT 'evaluation_contexts_ams', count(*) FROM evaluation_contexts_ams
    UNION ALL SELECT 'evaluation_contexts_monitor', count(*) FROM evaluation_contexts_monitor
    UNION ALL SELECT 'crawler_websites_contexts_ams', count(*) FROM crawler_websites_contexts_ams
    UNION ALL SELECT 'crawler_websites_contexts_monitor', count(*) FROM crawler_websites_contexts_monitor
) sub
WHERE ec.entity_type = sub.entity;