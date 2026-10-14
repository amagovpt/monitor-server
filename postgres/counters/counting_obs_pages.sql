

INSERT INTO entity_counters (entity_type, total_count) 
VALUES ('pages_observatorio', 0)
ON CONFLICT (entity_type) DO NOTHING;



INSERT INTO entity_counters (entity_type, total_count) 
VALUES ('pages_observatorio', 0)
ON CONFLICT (entity_type) DO NOTHING;

CREATE OR REPLACE FUNCTION process_page_observatory_delta() 
RETURNS TRIGGER AS $$
DECLARE
    v_metric VARCHAR(50) := 'pages_observatorio';
    v_was_in BOOLEAN;
    v_is_in BOOLEAN;
    v_new_count INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_in_observatory = true THEN
            UPDATE entity_counters 
            SET total_count = total_count + 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_new_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_new_count
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
            RETURNING total_count INTO v_new_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_new_count
                )::text
            );
        ELSIF v_was_in AND NOT v_is_in THEN
            UPDATE entity_counters 
            SET total_count = total_count - 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_new_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_new_count
                )::text
            );
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_in_observatory = true THEN
            UPDATE entity_counters 
            SET total_count = total_count - 1, last_updated_at = NOW() 
            WHERE entity_type = v_metric
            RETURNING total_count INTO v_new_count;

            PERFORM pg_notify(
                'entity_counts_channel', 
                json_build_object(
                    'entity', v_metric,
                    'count', v_new_count
                )::text
            );
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pages_observatory_delta ON pages;

CREATE TRIGGER trg_pages_observatory_delta
AFTER INSERT OR UPDATE OF is_in_observatory OR DELETE ON pages
FOR EACH ROW EXECUTE FUNCTION process_page_observatory_delta();


UPDATE entity_counters 
SET total_count = (SELECT count(*) FROM pages WHERE is_in_observatory = true),
    last_updated_at = NOW()
WHERE entity_type = 'pages_observatorio';