# Technical Debt Log

## DEBT-001: Data Validation Middleware [COMPLETED]
**Component**: `js/state.js`
**Status**: Fixed via `validateRow()`.

## DEBT-002: Audit Log for Data Changes [COMPLETED]
**Component**: Database
**Status**: Fixed via `sql/audit_logs.sql` and UUID-to-Text patch.

## DEBT-003: God File Pattern
**Component**: `js/ui.js`
**Issue**: File is 60KB and handles everything.
**Status**: IN PROGRESS (Starting Surgical Split: `ui-scanner.js`, `ui-charts.js`).
**Priority**: CRITICAL

## DEBT-004: DRY Violation in Category Management [COMPLETED]
**Component**: `index.html`, `js/state.js`, `js/ui.js`
**Status**: Fixed via `ensureCategory()` and `datalist` implementation.

## DEBT-005: String-based HTML Template Injection
**Component**: `js/ui.js`
**Issue**: UI is built using string concatenation.
**Status**: IN PROGRESS (Moving to Template Literals during modularization).
**Priority**: MEDIUM
