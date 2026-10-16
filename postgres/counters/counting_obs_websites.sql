CREATE OR REPLACE FUNCTION process_website_observatory_delta() 
RETURNS TRIGGER AS $$
DECLARE
    v_metric VARCHAR(50) := 'websites_observatorio';
    v_was_in BOOLEAN;
    v_is_in BOOLEAN;
    v_current_count INTEGER; -- Variável local declarada corretamente
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_in_observatory = true THEN
            UPDATE entity_counters 
            SET total_count = total_count + 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_current_count; -- Captura o valor real

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_current_count
                )::text
            );
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_was_in := (OLD.is_in_observatory = true);
        v_is_in := (NEW.is_in_observatory = true);

        IF NOT v_was_in AND v_is_in THEN
            UPDATE entity_counters 
            SET total_count = total_count + 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_current_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_current_count
                )::text
            );
        ELSIF v_was_in AND NOT v_is_in THEN
            UPDATE entity_counters 
            SET total_count = total_count - 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_current_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_current_count
                )::text
            );
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_in_observatory = true THEN
            UPDATE entity_counters 
            SET total_count = total_count - 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_current_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_current_count
                )::text
            );
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;