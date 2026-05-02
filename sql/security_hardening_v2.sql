-- ==========================================
-- FORT KNOX: SECURITY HARDENING (V2)
-- ==========================================
-- This script enforces strict tenant isolation and 
-- Least Privilege across all financial tables.

-- 1. SECURE HELPER FUNCTION (Memoized for Performance)
-- Uses Postgres session settings to cache the household_id 
-- so it only queries the app_users table once per request.
CREATE OR REPLACE FUNCTION public.get_my_household() 
RETURNS UUID AS $$
DECLARE
  v_h_id UUID;
BEGIN
  v_h_id := current_setting('app.current_household_id', true)::UUID;
  IF v_h_id IS NULL THEN
    SELECT household_id INTO v_h_id FROM public.app_users WHERE id = auth.uid() LIMIT 1;
    PERFORM set_config('app.current_household_id', v_h_id::TEXT, true);
  END IF;
  RETURN v_h_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. ENABLE & FORCE ROW LEVEL SECURITY
-- 'FORCE' ensures that even the table owner is subject to RLS.
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state FORCE ROW LEVEL SECURITY;

-- 3. EXPENSES POLICY
DROP POLICY IF EXISTS "Household Isolation" ON public.expenses;
CREATE POLICY "Household Isolation" ON public.expenses
  FOR ALL TO authenticated
  USING (household_id = public.get_my_household())
  WITH CHECK (household_id = public.get_my_household());

-- 4. RECEIPT_ITEMS POLICY
DROP POLICY IF EXISTS "Household Isolation" ON public.receipt_items;
CREATE POLICY "Household Isolation" ON public.receipt_items
  FOR ALL TO authenticated
  USING (household_id = public.get_my_household())
  WITH CHECK (household_id = public.get_my_household());

-- 5. APP_STATE POLICY
DROP POLICY IF EXISTS "Household Isolation" ON public.app_state;
CREATE POLICY "Household Isolation" ON public.app_state
  FOR ALL TO authenticated
  USING (id = public.get_my_household())
  WITH CHECK (id = public.get_my_household());

-- 6. APP_USERS POLICY
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own mapping" ON public.app_users;
CREATE POLICY "Users see own mapping" ON public.app_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 7. OPTIONAL: MFA ENFORCED DELETES (AAL2)
-- Uncomment this to require Multi-Factor Auth for any deletions
-- DROP POLICY IF EXISTS "Strict Delete" ON public.expenses;
-- CREATE POLICY "Strict Delete" ON public.expenses
--   FOR DELETE TO authenticated
--   USING (
--     household_id = public.get_my_household() 
--     AND auth.jwt()->>'aal' = 'aal2'
--   );
