-- sql/hash_pins_migration.sql
-- Implements secure bcrypt hashing for household PINs (DEBT-006)

-- 1. Enable pgcrypto extension for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Hash existing plaintext PINs
-- A bcrypt hash starts with $2a$ (or similar). This prevents double-hashing.
UPDATE households 
SET access_pin = crypt(access_pin, gen_salt('bf')) 
WHERE access_pin NOT LIKE '$2a$%';

-- 3. Update the RPC to check hashes instead of plaintext
CREATE OR REPLACE FUNCTION public.check_household_pin(h_id UUID, input_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    actual_pin TEXT;
BEGIN
    SELECT access_pin INTO actual_pin FROM households WHERE id = h_id;
    -- crypt(input, stored_hash) returns the stored_hash if it matches
    RETURN (crypt(input_pin, actual_pin) = actual_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger function to auto-hash any newly inserted or updated plaintext PINs
CREATE OR REPLACE FUNCTION public.hash_household_pin()
RETURNS trigger AS $$
BEGIN
    -- If the new PIN doesn't look like a bcrypt hash, hash it
    IF NEW.access_pin NOT LIKE '$2a$%' THEN
        NEW.access_pin := crypt(NEW.access_pin, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach the trigger to the households table
DROP TRIGGER IF EXISTS trg_hash_household_pin ON public.households;
CREATE TRIGGER trg_hash_household_pin
    BEFORE INSERT OR UPDATE OF access_pin
    ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.hash_household_pin();
