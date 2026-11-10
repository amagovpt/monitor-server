-- 1. Garante a existência do registo na tabela de contadores
INSERT INTO entity_counters (entity_type, total_count) 
VALUES ('directories_obs', 0)
ON CONFLICT (entity_type) DO NOTHING;

-- 2. Função com controlo de delta e filtragem de is_in_observatory = true
CREATE OR REPLACE FUNCTION process_directories_obs_delta() 
RETURNS TRIGGER AS $$
DECLARE
    v_entity_name CONSTANT VARCHAR(50) := 'directories_obs';
    v_delta INTEGER := 0;
    v_new_total BIGINT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.is_in_observatory = true ) THEN
            v_delta := 1;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.is_in_observatory = true ) THEN
            v_delta := -1;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Transição de/para is_in_observatory = true
        IF (OLD.is_in_observatory IS DISTINCT FROM NEW.is_in_observatory) THEN
            IF (NEW.is_in_observatory = true ) THEN
                v_delta := 1;
                    ELSIF (OLD.is_in_observatory = true ) THEN
                v_delta := -1;
            END IF;
        END IF;
    END IF;

    -- Só atualiza o contador e notifica se houve variação real no is_in_observatory = true
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
DROP TRIGGER IF EXISTS trg_directories_obs_delta ON directories;

CREATE TRIGGER trg_directories_obs_delta
AFTER INSERT OR UPDATE OF is_in_observatory OR DELETE ON directories
FOR EACH ROW
EXECUTE FUNCTION process_directories_obs_delta();

-- 4. Sync inicial (Backfill)
UPDATE entity_counters 
SET total_count = (
    SELECT count(*) 
    FROM directories 
    WHERE is_in_observatory = true),
last_updated_at = NOW()
WHERE entity_type = 'directories_obs';