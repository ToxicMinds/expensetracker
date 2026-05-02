# Synculariti - AGENTS.md (Master Source of Truth)

This document is the definitive guide for AI assistants and developers. It consolidates architecture, design principles, and operational rules for the ET Expense platform.

---

## 1. Project Overview
**ET Expense** is a minimalist, high-performance financial management platform. This repository is a **Pure Next.js 14** project (V2). All legacy V1 components and obsolete SQL migrations have been purged.
*   **Mission**: Multi-User Determinism. Every household member sees the same data, insights, and state regardless of device.
*   **Core Stack**: Next.js 14 (App Router), TypeScript, Supabase (Postgres), Neo4j (Graph), Groq AI (Llama 3.3).

---

## 2. Architecture Standards (The "Must-Follow" Rules)

### 2.1 Atomic Transactions (ACID)
All mutations (Saves, Deletes, Updates) MUST be atomic.
*   **Rule**: Use the `save_receipt_v2` RPC for all receipt saves.
*   **Performance**: Bulk insert (O(1)) via `unnest` pattern. 
*   **Integrity**: Mathematical validation (Sum check) is enforced at the database level.
*   **Resilience**: 3-stage exponential backoff (1s -> 2s -> 4s) on all mutation hooks.

### 2.2 Intelligence Strategy (Cloud-TTL)
AI Insights (Groq) are shared across the household to minimize cost and latency.
*   **TTL**: 24 hours (Cloud-backed).
*   **Determinism**: Cache is only invalidated if the `dataHash` (totals/count) changes.
*   **UX**: Insights load instantly for all family members once generated.
*   **Unified Categories**: Groq always receives the household's master category list from `v2/src/lib/constants.ts` and the database state.

### 2.3 PWA Standards (2026)
*   **Identity**: Minimalist header. No logo text on mobile; personal circular avatar only.
*   **Safe Areas**: Adheres to modern mobile safe-area insets and orientation locking.

---

## 3. Principles Audit (Architecture Compliance)

### 3.1 Standards Enforced
1.  **DRY (Don't Repeat Yourself)**:
    *   **Status**: **ENFORCED**.
    *   **Solution**: Categories and Icons are centralized in `v2/src/lib/constants.ts` and managed via the `HouseholdContext`.
    *   **Rule**: NEVER hardcode categories in components. Always pull from `household.categories`.
2.  **Single Responsibility (SOLID)**:
    *   **Status**: **ENFORCED**.
    *   **Solution**: Fetch logic (`useTransactions`) and mutation logic (`useSync`) are strictly isolated.
    *   **Rule**: Keep read-only state and write-only transactions in separate hooks.
3.  **Least Privilege (Security)**:
    *   **Status**: **HARDENED**. RLS is enforced on all tables via `security_hardening_v2.sql`.
    *   **Vault Header Pattern**: All API routes use server-side session resolution. No sensitive IDs are passed in frontend code.

---

## 4. Tenant Separation Logic (Cross-Device Security)
To ensure absolute isolation between households:
1.  **JWT Claims**: Every request to Supabase must include the user's JWT.
2.  **Server-Side Resolution**: The database uses `auth.uid()` to look up the `household_id` in `app_users`.
3.  **Memoized Resolution**: Uses `get_my_household()` server-side helper to isolate rows by `household_id`.

---

## 5. Operational File Map
*   **`/v2/src/app`**: Core routing and Page layouts.
*   **`/v2/src/hooks`**: Specialized logic (`useTransactions`, `useSync`, `useHousehold`).
*   **`/v2/src/components`**: UI layer (Bento cards, Scanners).
*   **`/v2/src/lib`**: Financial calculations, constants, and server utilities.
*   **`/sql`**: Hardened security policies and RPC functions.
