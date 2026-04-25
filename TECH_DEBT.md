# Technical Debt Log

## DEBT-001: Data Validation Middleware [COMPLETED]
**Component**: `js/state.js`
**Issue**: Supabase CRUD assumes success; no validation on write.
**Status**: Fixed via `validateRow()` in `state.js`.
**Priority**: HIGH

## DEBT-002: Audit Log for Data Changes [COMPLETED]
**Component**: Database
**Issue**: Can't trace who changed what when.
**Status**: SQL Migration created in `sql/audit_logs.sql`.
**Priority**: MEDIUM

## DEBT-003: God File Pattern
**Component**: `js/ui.js`
**Issue**: File is 57KB and handles rendering, logic, and API calls.
**Risk**: High maintenance cost, difficult to debug, tight coupling.
**Mitigation**: Split into component-based modules (`render.js`, `handlers.js`).
**Priority**: HIGH

## DEBT-004: DRY Violation in Category Management
**Component**: `index.html`, `js/state.js`, `js/ui.js`
**Issue**: Category lists are hardcoded in multiple files.
**Risk**: UI inconsistency when adding/removing categories.
**Mitigation**: Centralize categories in `state.js` and populate UI dynamically.
**Priority**: MEDIUM

## DEBT-005: String-based HTML Template Injection
**Component**: `js/ui.js`
**Issue**: UI is built using string concatenation.
**Risk**: XSS vulnerabilities and difficult layout maintenance.
**Mitigation**: Move to a template-based system or use DocumentFragment.
**Priority**: MEDIUM
