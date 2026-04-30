# ET Expense v2 - System Architecture & Production Guide

This document outlines the architecture, technology stack, data flow, and production-grade features of the **ET Expense v2** SaaS platform. It serves as the single source of truth for understanding how the system operates in a multi-tenant, cloud-native environment.

## 1. System Architecture
The application follows a modern serverless architecture utilizing Next.js (App Router) on the frontend, Vercel Serverless Functions for API endpoints, and a dual-database strategy (Supabase PostgreSQL + Neo4j Graph).

```mermaid
graph TD
    Client[Next.js Client (React)] -->|State Sync & Realtime| Supabase[Supabase PostgreSQL]
    Client -->|API Routes| VercelAPI[Vercel Serverless API]
    VercelAPI -->|eKasa Proxy| EKasa[Slovak eKasa API]
    VercelAPI -->|Categorization| Groq[Groq AI (Llama 3)]
    VercelAPI -->|Insights & Analytics| Neo4j[Neo4j Aura Graph DB]
```

### 1.1 Dual-Database Strategy
- **Supabase (PostgreSQL):** The primary source of truth. Handles authentication, row-level security (RLS), real-time subscriptions, and stores all transactional data (`expenses`, `invoices`, `receipt_items`).
- **Neo4j (Graph):** A specialized analytical database. It maps relationships between `Transactions`, `Merchants`, and `Brands`. It powers the "Deep Analytics" and feeds structural context to the AI Insight engine.

### 1.2 Multi-Tenancy & Isolation
The system is a fully multi-tenant SaaS. Data isolation is strictly enforced at the database level:
1. Every user belongs to a `household` via the `app_users` mapping table.
2. Every table (`expenses`, `invoices`, `app_state`, `recurring_expenses`, `audit_logs`) has a mandatory `household_id` column.
3. Supabase Row Level Security (RLS) policies strictly prevent users from selecting, inserting, updating, or deleting records outside their assigned `household_id`.
4. Neo4j queries are parameterized to filter nodes by `household_id`, ensuring cross-tenant data leakage is structurally impossible.

---

## 2. Technology Stack
- **Frontend Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Vanilla CSS Modules with custom CSS variables (No Tailwind)
- **Data Visualization:** Chart.js via `react-chartjs-2`
- **QR Scanning:** `html5-qrcode`
- **Primary Database:** Supabase (PostgreSQL) + Supabase JS SDK
- **Analytical Database:** Neo4j Aura (Neo4j JavaScript Driver)
- **Generative AI:** Groq API (`llama-3.3-70b-versatile`)
- **Hosting / CI/CD:** Vercel

---

## 3. Production Readiness & Resilience

To operate reliably in the "free tier" zone without sacrificing stability, the system employs several resilience patterns.

### 3.1 Network Retries & Exponential Backoff
External APIs (Slovak eKasa API and Groq AI) can occasionally timeout or hit rate limits. The application uses a custom `fetchWithRetry` utility located in `lib/utils.ts`. 
- **Mechanism:** If an external call fails with a `5xx` error, the system waits (500ms, 1000ms, 2000ms...) and retries up to 3 times before bubbling the error to the UI.

### 3.2 AI Caching (Cross-Device Determinism)
Calling the Groq API on every page load is slow and wastes tokens.
- **Mechanism:** The AI Insight is cached directly in the `app_state` JSONB column in Supabase alongside the `expenseHash` (which represents the total number of expenses). 
- **Result:** When a user opens the app on their phone or laptop, the UI reads the insight instantly from the Supabase state object. The Groq API is *only* called if the number of expenses changes.

### 3.3 Health Checks
The system exposes a public health endpoint at `GET /api/health`.
- This endpoint pings both Supabase and Neo4j.
- It returns `200 OK` if both databases are reachable, or `503 Degraded` with explicit error messages if a connection drops.
- **Usage:** You can hook this endpoint up to free monitoring tools like UptimeRobot to receive SMS/Email alerts if the database goes down.

### 3.4 Audit Logging & Monitoring
Instead of paying for expensive third-party logging tools (Datadog/Sentry), the system utilizes a custom, free-tier logging strategy:
- **Financial Auditing:** Supabase PostgreSQL triggers automatically write every `INSERT`, `UPDATE`, and `DELETE` operation on expenses to the `audit_logs` table, storing the old and new JSON payloads.
- **System Monitoring:** The frontend utilizes a `systemLog` utility (`lib/utils.ts`) that catches critical application errors (e.g., eKasa scan failures, AI timeouts) and writes them directly into the `audit_logs` table under the `system` namespace for easy review.

---

## 4. End-to-End Workflows

### 4.1 The Receipt Scanning Flow
1. **Scan:** The user points the camera at a fiscal QR code.
2. **Extract:** The app extracts the 32-character eKasa ID from the string.
3. **Fetch:** A request is sent through the Next.js Vercel rewrite (`/ekasa-proxy`) to the official Slovak government API (retried automatically on failure).
4. **Parse & AI:** The raw JSON is sent to `/api/groq`. The Llama 3 model strips the garbage data, extracts the store name, parses the line items, and assigns a normalized category to each item.
5. **Review:** The user reviews the parsed items in the UI.
6. **Save:** Upon confirmation, the parent total is saved to the `expenses` table, and the individual line items are saved to the `receipt_items` table.
7. **Graph Sync:** The system triggers an asynchronous Neo4j update to map the new Merchant and Transaction nodes.

### 4.2 How to Roll Out V2
Currently, users are seeing V1. To transition your user base to V2 without downtime:
1. Since the V2 codebase lives inside the `/v2` directory of your repository, you must update your Vercel project settings.
2. Go to **Vercel Dashboard > Project > Settings > General**.
3. Change the **Root Directory** from `/` to `v2`.
4. Trigger a new deployment. Vercel will build the Next.js app, and the URL will instantly serve the V2 interface to all users. 
*(Note: Because V2 uses the exact same Supabase database and authentication flow as V1, users will not be logged out and no data migration scripts are necessary).*
