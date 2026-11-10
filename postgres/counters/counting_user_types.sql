-- 1. Assegurar os registos em entity_counters
INSERT INTO entity_counters (entity_type, total_count) 
VALUES 
    ('users_ams', 0),
    ('users_monitor', 0),
    ('gov_users', 0),
    ('non_gov_users', 0),
    ('deleted_users', 0)
ON CONFLICT (entity_type) DO NOTHING;

-- 2. Função unificada de delta com suporte a Soft Delete
CREATE OR REPLACE FUNCTION process_user_deltas() 
RETURNS TRIGGER AS $$
DECLARE
    v_ams_delta         INTEGER := 0;
    v_monitor_delta     INTEGER := 0;
    v_gov_delta         INTEGER := 0;
    v_non_gov_delta     INTEGER := 0;
    v_deleted_delta     INTEGER := 0;
    
    v_old_is_active     BOOLEAN := false;
    v_new_is_active     BOOLEAN := false;
    v_old_is_gov        BOOLEAN := false;
    v_new_is_gov        BOOLEAN := false;
BEGIN
    -- Avaliação do estado anterior (se UPDATE ou DELETE)
    IF (TG_OP IN ('UPDATE', 'DELETE')) THEN
        v_old_is_active := (OLD.deleted_at IS NULL);
        v_old_is_gov    := (OLD.cc_number IS NOT NULL AND BTRIM(OLD.cc_number) <> '');
    END IF;

    -- Avaliação do novo estado (se INSERT ou UPDATE)
    IF (TG_OP IN ('INSERT', 'UPDATE')) THEN
        v_new_is_active := (NEW.deleted_at IS NULL);
        v_new_is_gov    := (NEW.cc_number IS NOT NULL AND BTRIM(NEW.cc_number) <> '');
    END IF;

    ----------------------------------------------------------------------
    -- 1. INSERT
    ----------------------------------------------------------------------
    IF (TG_OP = 'INSERT') THEN
        IF (v_new_is_active) THEN
            -- Ativo: alimenta papéis e gov status
            IF (NEW.role_id = 1) THEN v_ams_delta := 1;
            ELSIF (NEW.role_id = 2) THEN v_monitor_delta := 1; END IF;

            IF (v_new_is_gov) THEN v_gov_delta := 1;
            ELSE v_non_gov_delta := 1; END IF;
        ELSE
            -- Inserido já como soft deleted
            v_deleted_delta := 1;
        END IF;

    ----------------------------------------------------------------------
    -- 2. DELETE FÍSICO (HARD DELETE)
    ----------------------------------------------------------------------
    ELSIF (TG_OP = 'DELETE') THEN
        IF (v_old_is_active) THEN
            IF (OLD.role_id = 1) THEN v_ams_delta := -1;
            ELSIF (OLD.role_id = 2) THEN v_monitor_delta := -1; END IF;

            IF (v_old_is_gov) THEN v_gov_delta := -1;
            ELSE v_non_gov_delta := -1; END IF;
        ELSE
            -- Era um registo que estava soft deleted
            v_deleted_delta := -1;
        END IF;

    ----------------------------------------------------------------------
    -- 3. UPDATE (Soft Delete, Restore, Alteração de Role/CC)
    ----------------------------------------------------------------------
    ELSIF (TG_OP = 'UPDATE') THEN
        
        -- Caso A: Transição de Ativo -> Soft Deleted
        IF (v_old_is_active AND NOT v_new_is_active) THEN
            v_deleted_delta := 1;
            
            -- Remove dos contadores ativos
            IF (OLD.role_id = 1) THEN v_ams_delta := -1;
            ELSIF (OLD.role_id = 2) THEN v_monitor_delta := -1; END IF;

            IF (v_old_is_gov) THEN v_gov_delta := -1;
            ELSE v_non_gov_delta := -1; END IF;

        -- Caso B: Transição de Soft Deleted -> Restaurado (Ativo)
        ELSIF (NOT v_old_is_active AND v_new_is_active) THEN
            v_deleted_delta := -1;
            
            -- Devolve aos contadores ativos
            IF (NEW.role_id = 1) THEN v_ams_delta := 1;
            ELSIF (NEW.role_id = 2) THEN v_monitor_delta := 1; END IF;

            IF (v_new_is_gov) THEN v_gov_delta := 1;
            ELSE v_non_gov_delta := 1; END IF;

        -- Caso C: Permaneceu Ativo (avaliar mudanças de role_id ou cc_number)
        ELSIF (v_old_is_active AND v_new_is_active) THEN
            
            -- Role ID
            IF (OLD.role_id IS DISTINCT FROM NEW.role_id) THEN
                IF (OLD.role_id = 1) THEN v_ams_delta := v_ams_delta - 1;
                ELSIF (OLD.role_id = 2) THEN v_monitor_delta := v_monitor_delta - 1; END IF;

                IF (NEW.role_id = 1) THEN v_ams_delta := v_ams_delta + 1;
                ELSIF (NEW.role_id = 2) THEN v_monitor_delta := v_monitor_delta + 1; END IF;
            END IF;

            -- CC Number
            IF (v_old_is_gov <> v_new_is_gov) THEN
                IF (v_new_is_gov) THEN
                    v_gov_delta := 1;
                    v_non_gov_delta := -1;
                ELSE
                    v_gov_delta := -1;
                    v_non_gov_delta := 1;
                END IF;
            END IF;

        -- Caso D: Permaneceu Soft Deleted (não afeta contadores ativos)
        END IF;

    END IF;

    ----------------------------------------------------------------------
    -- APLICAÇÃO DOS DELTAS
    ----------------------------------------------------------------------
    IF (v_ams_delta <> 0) THEN
        UPDATE entity_counters 
        SET total_count = total_count + v_ams_delta, last_updated_at = NOW() 
        WHERE entity_type = 'users_ams';
        PERFORM pg_notify('entity_counts_channel', 'users_ams');
    END IF;

    IF (v_monitor_delta <> 0) THEN
        UPDATE entity_counters 
        SET total_count = total_count + v_monitor_delta, last_updated_at = NOW() 
        WHERE entity_type = 'users_monitor';
        PERFORM pg_notify('entity_counts_channel', 'users_monitor');
    END IF;

    IF (v_gov_delta <> 0) THEN
        UPDATE entity_counters 
        SET total_count = total_count + v_gov_delta, last_updated_at = NOW() 
        WHERE entity_type = 'gov_users';
        PERFORM pg_notify('entity_counts_channel', 'gov_users');
    END IF;

    IF (v_non_gov_delta <> 0) THEN
        UPDATE entity_counters 
        SET total_count = total_count + v_non_gov_delta, last_updated_at = NOW() 
        WHERE entity_type = 'non_gov_users';
        PERFORM pg_notify('entity_counts_channel', 'non_gov_users');
    END IF;

    IF (v_deleted_delta <> 0) THEN
        UPDATE entity_counters 
        SET total_count = total_count + v_deleted_delta, last_updated_at = NOW() 
        WHERE entity_type = 'deleted_users';
        PERFORM pg_notify('entity_counts_channel', 'deleted_users');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger na tabela users (escutando também deleted_at)
DROP TRIGGER IF EXISTS trg_users_entity_deltas ON users;

CREATE TRIGGER trg_users_entity_deltas
AFTER INSERT OR UPDATE OF role_id, cc_number, deleted_at OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION process_user_deltas();

-- 4. Recalibração inicial com filtro de soft delete
UPDATE entity_counters 
SET total_count = (SELECT count(*) FROM users WHERE role_id = 1 AND deleted_at IS NULL),
    last_updated_at = NOW()
WHERE entity_type = 'users_ams';

UPDATE entity_counters 
SET total_count = (SELECT count(*) FROM users WHERE role_id = 2 AND deleted_at IS NULL),
    last_updated_at = NOW()
WHERE entity_type = 'users_monitor';

UPDATE entity_counters 
SET total_count = (SELECT count(*) FROM users WHERE cc_number IS NOT NULL AND BTRIM(cc_number) <> '' AND deleted_at IS NULL),
    last_updated_at = NOW()
WHERE entity_type = 'gov_users';

UPDATE entity_counters 
SET total_count = (SELECT count(*) FROM users WHERE (cc_number IS NULL OR BTRIM(cc_number) = '') AND deleted_at IS NULL),
    last_updated_at = NOW()
WHERE entity_type = 'non_gov_users';

UPDATE entity_counters 
SET total_count = (SELECT count(*) FROM users WHERE deleted_at IS NOT NULL),
    last_updated_at = NOW()
WHERE entity_type = 'deleted_users';