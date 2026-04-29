-- ============================================================
-- Dynamic v1 who_id Backfill Migration
-- Purpose: Automatically populate who_id for legacy expenses 
--          by reading the `app_state` config JSON.
-- Safely maps users like Nikhil -> u1 only for their household.
-- ============================================================

DO $$
DECLARE
    r RECORD;
    member_id TEXT;
    member_name TEXT;
    matched_count INT := 0;
BEGIN
    -- Iterate through every household in app_state
    FOR r IN SELECT id AS household_id, config->'names' AS names FROM app_state WHERE config->'names' IS NOT NULL
    LOOP
        -- Iterate through the key-value pairs in the JSON 'names' object
        -- e.g. "u1": "Nikhil", "u2": "Zuzana"
        FOR member_id, member_name IN SELECT * FROM jsonb_each_text(r.names)
        LOOP
            -- Update expenses for this specific household where the legacy string matches
            UPDATE expenses
            SET who_id = member_id
            WHERE household_id = r.household_id
              AND who_id IS NULL
              AND who ILIKE member_name
              AND is_deleted = false;
              
            -- Log the update for debugging
            GET DIAGNOSTICS matched_count = ROW_COUNT;
            IF matched_count > 0 THEN
                RAISE NOTICE 'Household %: Mapped % legacy records for % -> %', r.household_id, matched_count, member_name, member_id;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully.';
END $$;
