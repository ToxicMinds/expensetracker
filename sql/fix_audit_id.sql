-- FIX: Resolve UUID type mismatch in audit_logs
-- This allows the audit system to track our text-based expense IDs.

ALTER TABLE public.audit_logs 
  ALTER COLUMN record_id TYPE TEXT USING record_id::TEXT;

COMMENT ON COLUMN public.audit_logs.record_id IS 'Stored as text to support both UUIDs and legacy ex_ slugs';
