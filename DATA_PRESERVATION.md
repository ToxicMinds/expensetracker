# Data Preservation Strategy

## Pre-Refactor Baseline (Current State)
- **Backup Date**: 2026-04-26
- **Expense Count**: 118
- **Household Count**: 4 (Nikhil, Jur, Tom + 1)
- **User Count**: 5
- **Status**: Live Production (Data integrity is critical)

## Recent Infrastructure Changes
1. **Audit Logs Fix**: Changed `record_id` to `TEXT` to support manual expense slugs.
2. **Onboarding Security**: Implemented `create_new_household` RPC to solve RLS chicken-and-egg issues.
3. **Dynamic Categories**: Centralized category management via `ensureCategory()` in `state.js`.
4. **Auth Self-Healing**: Automated mapping for legacy PIN users.

## Planned Refactor: "Operation Modular"
- **Goal**: Split the 60KB `ui.js` God File into logical components.
- **Risk**: Regression in UI rendering causing data to "disappear" from view.
- **Safety Steps**:
  1. No changes to SQL schema during this phase.
  2. Maintain `validateRow()` checks on all writes.
  3. Verify `expense_count` remains 118 (or higher) after each step.
  4. Perform manual cross-browser testing for "All Members" view.

## Post-Migration Validation Checklist
- [ ] Expense count >= 118
- [ ] New users (Jur/Tom) can still log in and see their data
- [ ] Zuzana can still log in via PIN
- [ ] Scanner still processes receipts and shows review modal
- [ ] Manual entry still registers new categories dynamically
- [ ] "All Members" filter stays active after editing (Fix verified)

## Rollback Plan
If UI regression occurs:
1. Revert `js/` files to previous Git commit.
2. Clear browser cache.
3. No database restoration needed (Logic-only refactor).
