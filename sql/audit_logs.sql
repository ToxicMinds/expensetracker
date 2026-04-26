-- ==========================================
-- DEBT-002: AUDIT LOGGING SYSTEM
-- ==========================================
-- This script creates an automated auditing system
-- that tracks every change to expenses and invoices.

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL, -- Changed from UUID to TEXT to support legacy/slug IDs
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    household_id UUID REFERENCES public.households(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their household logs" ON public.audit_logs
    FOR SELECT USING (household_id IN (SELECT household_id FROM public.app_users WHERE id = auth.uid()));

-- 3. Create the audit trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_household_id UUID;
BEGIN
    -- Attempt to find the household_id from the record itself or the user's mapping
    IF (TG_OP = 'DELETE') THEN
        current_household_id := OLD.household_id;
    ELSE
        current_household_id := NEW.household_id;
    END IF;

    -- If still null, try to lookup from app_users
    IF (current_household_id IS NULL) THEN
        SELECT household_id INTO current_household_id FROM public.app_users WHERE id = auth.uid();
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by,
        household_id
    ) VALUES (
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        auth.uid(),
        current_household_id
    );
    
    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply triggers to tables
DROP TRIGGER IF EXISTS tr_audit_expenses ON public.expenses;
CREATE TRIGGER tr_audit_expenses
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS tr_audit_invoices ON public.invoices;
CREATE TRIGGER tr_audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

COMMENT ON TABLE public.audit_logs IS 'Tracks all modifications to financial data for security and debugging.';
