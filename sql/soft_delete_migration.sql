-- sql/soft_delete_migration.sql
-- Implements soft delete for expenses (DEBT-013)

-- 1. Add is_deleted column
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_expenses_is_deleted ON expenses(is_deleted) WHERE is_deleted = false;

-- 3. Update Audit Log trigger (optional, just ensuring it still tracks UPDATEs, which it already does)
-- The audit_log_trigger already fires on UPDATE. A soft delete is an UPDATE, so it will be captured.
