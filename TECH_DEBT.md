# Technical Debt Log

## DEBT-001: Data Validation Middleware [COMPLETED]
**Component**: `js/state.js`
**Status**: Fixed via `validateRow()`.

## DEBT-002: Audit Log for Data Changes [COMPLETED]
**Component**: Database
**Status**: Fixed via `sql/audit_logs.sql` and UUID-to-Text patch.

## DEBT-003: God File Pattern [COMPLETED]
**Component**: `js/ui.js`
**Issue**: File was 60KB and handled everything.
**Status**: Fixed. Split into `ui-scanner.js`, `ui-charts.js`, `ui-settings.js`, `ui-recurring.js`, and `ui-analyzer.js`.
**Priority**: CRITICAL

## DEBT-004: DRY Violation in Category Management [COMPLETED]
**Component**: `index.html`, `js/state.js`, `js/ui.js`
**Status**: Fixed via `ensureCategory()` and `datalist` implementation.

## DEBT-005: String-based HTML Template Injection [COMPLETED]
**Component**: All `ui-*.js` files
**Issue**: UI was built using string concatenation.
**Status**: Fixed in all newly extracted modules by using Template Literals and the `esc()` utility.
**Priority**: MEDIUM

## DEBT-006: Plaintext Passwords
**Component**: `households.access_pin` (Database)
**Issue**: Household PINs are stored in plaintext.
**Status**: OPEN
**Priority**: HIGH

## DEBT-007: Missing Schema Constraints
**Component**: Database (`expenses`, `households`)
**Issue**: Categories are TEXT, not foreign keys. No unique constraints on `household`+`handle`.
**Status**: OPEN
**Priority**: HIGH

## DEBT-008: State Sync Fragmentation
**Component**: Architecture (`localStorage`, `app_state`, globals)
**Issue**: App state is fragmented across local storage, Supabase, and runtime globals.
**Status**: OPEN
**Priority**: MEDIUM

## DEBT-009: Missing TypeScript / JSDoc
**Component**: Entire Codebase
**Issue**: No type hints; dynamic globals (`NAMES`, `BUDGETS`) are implicit.
**Status**: OPEN
**Priority**: LOW

## DEBT-010: No Feature Flags / Versioning
**Component**: Deployment / Ops
**Issue**: All features are always-on. Hard to roll out breaking changes.
**Status**: OPEN
**Priority**: LOW

## DEBT-011: Supabase RLS Complexity
**Component**: Database Security
**Issue**: RLS policies are complex and spread across multiple migrations.
**Status**: OPEN
**Priority**: MEDIUM

## DEBT-012: Testing Gap
**Component**: QA
**Issue**: Only `finance.js` is unit-tested. UI and API are not tested, creating high regression risk.
**Status**: OPEN
**Priority**: HIGH

## DEBT-013: Data Mutability & No Soft Delete
**Component**: Database (`expenses`)
**Issue**: Expenses are permanently deleted (hard delete). Amounts can be changed post-creation.
**Status**: OPEN
**Priority**: CRITICAL
