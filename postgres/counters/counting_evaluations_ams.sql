-- 1. Garante a existência do registo na tabela de contadores
INSERT INTO entity_counters (entity_type, total_count) 
VALUES ('evaluations_staged', 0)
ON CONFLICT (entity_type) DO NOTHING;

-- 2. Função com controlo de delta e filtragem de status = 'STAGED'
CREATE OR REPLACE FUNCTION process_evaluations_staged_delta() 
RETURNS TRIGGER AS $$
DECLARE
    v_entity_name CONSTANT VARCHAR(50) := 'evaluations_staged';
    v_delta INTEGER := 0;
    v_new_total BIGINT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status = 'STAGED'::evaluations_publish_status_enum) THEN
            v_delta := 1;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'STAGED'::evaluations_publish_status_enum) THEN
            v_delta := -1;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Transição de/para status = 'STAGED'
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            IF (NEW.status = 'STAGED'::evaluations_publish_status_enum) THEN
                v_delta := 1;
            ELSIF (OLD.status = 'STAGED'::evaluations_publish_status_enum) THEN
                v_delta := -1;
            END IF;
        END IF;
    END IF;

    -- Só atualiza o contador e notifica se houve variação real no status = 'STAGED'
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
DROP TRIGGER IF EXISTS trg_evaluations_staged_delta ON evaluations;

CREATE TRIGGER trg_evaluations_staged_delta
AFTER INSERT OR UPDATE OF status OR DELETE ON evaluations
FOR EACH ROW
EXECUTE FUNCTION process_evaluations_staged_delta();

-- 4. Sync inicial (Backfill)
UPDATE entity_counters 
SET total_count = (
    SELECT count(*) 
    FROM evaluations 
    WHERE status = 'STAGED'::evaluations_publish_status_enum
),
last_updated_at = NOW()
WHERE entity_type = 'evaluations_staged';