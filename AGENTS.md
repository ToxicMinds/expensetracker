# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
**ET Expense** is a minimalist household expense tracking application with multi-user support, budgeting, intelligent categorization, and receipt scanning (eKasa/Slovak fiscal receipts). It uses Supabase for authentication and data persistence, with AI-powered receipt parsing via Groq API.

## Common Development Commands

### Run Tests
```bash
npm test
```
Runs Jest tests for the financial calculation layer (`tests/finance.test.js`). Tests are unit-level with no browser, DOM, or network dependencies. Use for validating pure computation logic.

## Architecture & Key Components

### Frontend Stack
- **Vanilla JavaScript** (no framework; string-based HTML templates)
- **Supabase JS SDK** for auth and real-time subscriptions
- **Chart.js** for data visualization
- **jsqr.min.js** for QR code scanning receipts
- **PWA manifest** for standalone app installation

### Core Modules

#### `js/state.js` (Foundation)
- **Purpose**: Centralized state, credentials, translations, and boot logic
- **Key globals**: `HOUSEHOLD_ID`, `HOUSEHOLD_PIN`, `SESSION_JWT`, `NAMES` (user mappings), `BUDGETS`, `CATS` (categories)
- **I18n**: Two-language dictionary (`en`, `sk`) — always add translations when adding UI text
- **Bootstrap**: `sysBootSupabase()` initializes Supabase client from `/api/env`
- **Data Validators**: `validateRow()` ensures writes don't corrupt the database

#### `js/app.js` (Orchestration)
- **Purpose**: Application initialization and coordination
- **Flow**: Auth check → Household loading → Expense fetch → Real-time subscriptions
- **Auth Handling**: Uses Supabase sessions with PIN (family passcode) and Google OAuth fallback
- **Key Functions**: `init()` (main bootstrap), `setupRealtime()` (Postgres change subscriptions)
- **Security**: Inactivity lockout (10 min) with session expiration and auth state change listeners

#### `js/ui.js` (Large "God File" — TECH_DEBT-003)
- **Size**: ~54KB; handles all DOM rendering, event handlers, and form logic
- **Main Functions**:
  - `renderAll()` — master render orchestration
  - `renderCards()` — expense list display
  - `applyNamesUI()` — dynamic user toggle buttons
  - `openForm()`, `submitForm()` — expense CRUD
  - Monthly ritual/insights system
  - Quick-entry suggestions based on vendor frequency
- **Tech Debt**: String concatenation for HTML generation (XSS risk); should refactor into component modules
- **Workaround**: Use `esc()` utility for escaping user input; avoid direct innerHTML with user data

#### `js/finance.js` (Pure Calculations)
- **Purpose**: Stateless financial computations (totals, forecasts, budgets, per-user spend)
- **Key Exports**: `calcTotals()`, `calcForecast()`, `calcPerUserSpend()`, `calcNetSavings()`, `calcBudgetStatus()`
- **Design**: No side effects; takes data in, returns results. Tested extensively via Jest.
- **Legacy Support**: Handles expenses with or without `who_id` (falls back to name matching)

#### `js/api.js` (External Integration)
- **eKasa Proxy**: `getEkasaData()` — parses Slovak fiscal receipts via `/api/ekasa-proxy`
- **Groq AI**: `categoriseWithGroq()`, `categoriseRawJSON()` — parses receipt items and auto-assigns categories
- **Smart Rules**: `applySmartRules()` — keyword-based pre-categorization (before AI)
- **Memory**: `MEMORY` object persists user-corrected mappings across sessions to train the AI

#### `js/auth.js` (Authentication Layer)
- **PIN Login**: PIN-based access for family households (no email required)
- **Google OAuth**: Alternative login via Google, auto-creates household if missing
- **Household Linking**: Maps users to households via `app_users` table
- **Legacy Support**: Auto-heals missing household mappings for legacy PIN users

### Database Schema (Supabase)

#### Core Tables
- **expenses** (household_id, who_id, category, amount, date, description, invoice_id, recurring_id)
- **invoices** (Additive; invoices.id FK to expenses.invoice_id)
- **households** (id, handle, access_pin)
- **app_users** (id, household_id — maps Supabase auth.users to households)
- **recurring_bills** (household_id, description, amount, frequency)

#### Audit & Config
- **audit_logs** (user_id, table_name, action, row_data, timestamp) — tracks all expense changes
- **financial_plan** (household_id, monthly_income, savings_target, notes)

See `sql/` directory for migration history and table definitions.

### Data Flow

1. **Authentication** (`app.js`): Session check → Household lookup → User mapping
2. **Data Load** (Parallel): App state from `localStorage` + cloud sync, expenses fetch, recurring bills fetch
3. **Real-time Sync** (Supabase): Changes to `expenses` table trigger `renderAll()` via Postgres change subscriptions
4. **Receipt Flow**: QR scan → eKasa API → Groq categorization → Preview modal → Submit to `expenses` table
5. **Budget Enforcement**: `finance.js` calculations inform warning colors in UI

## Important Technical Decisions

### TECH_DEBT-001: Data Validation (COMPLETED)
- **Problem**: Supabase CRUD was assumed to succeed without validation
- **Solution**: Added `validateRow()` in `state.js` to catch data inconsistencies before writes
- **Lesson**: Always validate row shape and constraints before insert/update

### TECH_DEBT-003: UI God File (IN PROGRESS)
- **Problem**: `ui.js` is 54KB with mixed concerns (render, handlers, API calls, logic)
- **Status**: Identify refactoring opportunities before making large changes
- **Workaround**: When adding features, try to isolate logic in separate files (`logic-*.js`), then call from `ui.js`

### TECH_DEBT-004: Category DRY Violation
- **Problem**: Categories hardcoded in multiple places (index.html, state.js, ui.js)
- **Current**: `CATS` array lives in `state.js` and is used everywhere
- **Note**: If refactoring, ensure all category operations go through `state.js` to avoid inconsistencies

### TECH_DEBT-005: HTML Template Injection Risk
- **Problem**: UI built via string concatenation
- **Mitigation**: Use `esc()` utility (HTML escaping) for all user-facing strings
- **Never**: Directly set innerHTML with user input; always escape or use `createTextNode()`

### Data Preservation Strategy
See `DATA_PRESERVATION.md` for migration safety. Key principle: **additive migrations only** (new columns/tables); never delete or backfill existing data without rollback plan.

## Language Support & Internationalization

- **Supported**: English (`en`), Slovak (`sk`)
- **Location**: Translation dictionary in `state.js` (`DICT` object)
- **Adding UI**: Always add translations for new UI strings to both `DICT.en` and `DICT.sk`
- **Function**: `t(key)` returns translated string or falls back to key itself
- **Storage**: User language preference in `localStorage.getItem('sf_lang')`

## Testing Strategy

- **Unit Tests**: `tests/finance.test.js` — Jest tests for pure calculation functions
- **No E2E Framework**: No Cypress/Playwright; rely on manual testing in browser and API mocking
- **Test Focus**: Financial calculations (totals, forecasts, budget status, per-user spend)
- **Running**: `npm test` (runs Jest with `--detectOpenHandles` to catch async issues)

## Deployment

- **Host**: Vercel (see `vercel.json` for rewrites)
- **Build**: Static site; no build step required
- **API Endpoints**: Proxied via Vercel rewrites:
  - `/api/env` — Returns Supabase credentials
  - `/api/groq` — Groq API proxy (categorization)
  - `/api/enablebanking` — Enable Banking OAuth callback
  - `/ekasa-proxy/*` — Rewrites to Slovak eKasa API
- **PWA**: Manifest at `manifest.json`; installable as standalone app

## File Organization

```
/
├── index.html              (UI scaffold)
├── manifest.json          (PWA config)
├── js/
│   ├── app.js            (Bootstrap & auth orchestration)
│   ├── state.js          (Globals, boot, i18n)
│   ├── ui.js             (Render & event handlers — LARGE FILE)
│   ├── api.js            (eKasa, Groq, external APIs)
│   ├── auth.js           (PIN & OAuth login)
│   ├── finance.js        (Pure calculations)
│   ├── logic-recurring.js (Recurring bills logic)
│   ├── rules.js          (Smart rules engine)
│   ├── utils.js          (Utility functions: esc, fmt, etc.)
├── tests/
│   └── finance.test.js    (Jest unit tests)
├── sql/
│   ├── audit_logs.sql    (Audit log setup)
│   ├── normalization_migration.sql
│   ├── prod_migration.sql
│   └── ...other migrations
├── css/style.css         (All styles)
└── DATA_PRESERVATION.md  (Migration safety notes)
```

## Key Gotchas

1. **Who ID vs Who Name**: Expenses may have `who_id` (u1, u2...) or just `who` (name string). Financial functions handle both via legacy matching.
2. **Recurring Bills**: Expenses with `recurring_id` are excluded from daily forecast rate (they're fixed costs).
3. **Category Assumptions**: Savings and Adjustment categories are excluded from "spent" totals but counted separately.
4. **Real-time Subscriptions**: If editing while subscribed, changes will trigger a full render; use `busy` flag to prevent race conditions.
5. **Supabase JWT**: Stored in `SESSION_JWT` global; used for authenticated API calls. Expires with session.
6. **Household PIN**: Stored in plaintext in `households.access_pin`; currently no hashing (security debt).

## Before Making Changes

- **Adding features**: Check `TECH_DEBT.md` and `DATA_PRESERVATION.md` for context
- **Modifying schema**: Test migrations locally; provide rollback plan
- **Large refactors**: Consider splitting `ui.js` into logical modules (`render.js`, `handlers.js`)
- **New translations**: Update both `DICT.en` and `DICT.sk`
- **API calls**: Use the proxy pattern in `api.js`; document rate limits and error handling
