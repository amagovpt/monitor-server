-- 1. Garante a existência do registo na tabela de contadores
INSERT INTO entity_counters (entity_type, total_count) 
VALUES ('websites_monitor', 0)
ON CONFLICT (entity_type) DO NOTHING;

-- 2. Função com controlo de delta e filtragem de context_id = 2
CREATE OR REPLACE FUNCTION process_website_monitor_delta() 
RETURNS TRIGGER AS $$
DECLARE
    v_entity_name CONSTANT VARCHAR(50) := 'websites_monitor';
    v_delta INTEGER := 0;
    v_new_total BIGINT; -- Declarado explicitamente (BIGINT previne overflow de contadores)
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.context_id = 2) THEN
            v_delta := 1;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.context_id = 2) THEN
            v_delta := -1;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Transição de/para context_id = 2
        IF (OLD.context_id IS DISTINCT FROM NEW.context_id) THEN
            IF (NEW.context_id = 2) THEN
                v_delta := 1;
            ELSIF (OLD.context_id = 2) THEN
                v_delta := -1;
            END IF;
        END IF;
    END IF;

    -- Só atualiza o contador e notifica se houve variação real no context_id = 2
    IF (v_delta <> 0) THEN
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
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
DROP TRIGGER IF EXISTS trg_websites_monitor_delta ON website_contexts;

CREATE TRIGGER trg_websites_monitor_delta
AFTER INSERT OR UPDATE OF context_id OR DELETE ON website_contexts
FOR EACH ROW
EXECUTE FUNCTION process_website_monitor_delta();

-- 4. Sync inicial (Backfill)
UPDATE entity_counters 
SET total_count = (
    SELECT count(*) 
    FROM website_contexts 
    WHERE context_id = 2
),
last_updated_at = NOW()
WHERE entity_type = 'websites_monitor';