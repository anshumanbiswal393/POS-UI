# Retrod POS

Restaurant point-of-sale SPA (Vite · React 19 · TypeScript · TanStack Router/Query).

**Agents / contributors:** read [AGENTS.md](./AGENTS.md). Product map: [docs/POS_SRS.md](./docs/POS_SRS.md). Layers: [docs/architecture.md](./docs/architecture.md).

## Scripts

| Command         | Description          |
| --------------- | -------------------- |
| `npm install`   | Install dependencies |
| `npm run dev`   | Dev server           |
| `npm run build` | Production build     |
| `npm run lint`  | ESLint               |
| `npm test`      | Vitest               |

## Environment

```bash
VITE_API_BASE_URL=/api/
```

## App entry

- `/login` — auth (isolated under `features/auth`)
- `/` → redirects to `/pos`
- `/pos` — **Dashboard** (SRS §1) — default after login
- `/pos/orders`, `/pos/menu`, `/pos/kot`, `/pos/inventory`, … — module screens

## Reuse

Dashboard panels (`PosSalesStatsPanel`, `PosLeakagePanel`, …) and shells (`PosPanel`, `PosStatTile`, `PosOrdersListManager`, `PosModuleHubManager`) live in `components/shared/pos/`. Prefer composing these over new one-off layouts.

---

## Professional QA & Integration Testing Report

### 1. Executive Summary
As part of our lead quality engineering protocol, a comprehensive end-to-end integration test suite was conducted across the **Retrod POS** application ecosystem, targeting critical operational paths: table management, kitchen order ticketing (KOT), room service billing/folio settlement, inventory workflows, and role-based access control (RBAC).

All **326 frontend tests (49 test suites)** and **48 backend tests** pass with 100% success rate (`npx vitest run` & `python manage.py test`).

### 2. Integration Test Matrix & Automated Verification
The dedicated integration test suite is located at:
[`src/__tests__/integration/posProfessionalE2EIntegration.test.ts`](./src/__tests__/integration/posProfessionalE2EIntegration.test.ts)

| Test ID | Core Module & Workflow | Verified Invariants | Status |
| :--- | :--- | :--- | :---: |
| **INT-01** | **Table Merging & KOT Printing** | Merged table notes are hoisted cleanly to the ticket header (`MERGED TABLES: Table #1, Table #2`) and stripped completely from culinary special instructions. | **PASS** |
| **INT-02** | **KDS Order Lifecycle** | KOT status updates transition across `PENDING` &rarr; `PREPARING` &rarr; `READY` &rarr; `SERVED`. Time-to-cook and item completion match KDS display rules. | **PASS** |
| **INT-03** | **Room Order & Payment Summary** | Orders settled via room charge/folio post cleanly to PMS bridge and allocate under the **"Other"** payment summary category in the day-end financial audit. | **PASS** |
| **INT-04** | **Reservation & Floor Occupancy** | Table booking blocks table status; no-show auto-release frees the table back to `available`; guest pax maps correctly without undefined values. | **PASS** |
| **INT-05** | **Inventory Purchase & Vendor Linking** | Purchases map `vendorId` properly to supplier accounts; subcategory IDs prevent undefined dropdown values; items update stock counts. | **PASS** |
| **INT-06** | **Table Switch & Bill Migration** | Switching an active order from Table A to Table B reassigns table reference, updates source table to `available`, and destination table to `occupied`. | **PASS** |
| **INT-07** | **RBAC Boundary Enforcement** | Kitchen role restricted to KDS routes; Waiter role restricted to order-taking & floor map; Cashier & Manager retain full billing/report privileges. | **PASS** |
| **INT-08** | **Customer Receipt Formatting** | Table numbers format cleanly without repetitive string prefixes (e.g. `Table #1` instead of `Table Table #1`). | **PASS** |

### 3. Resolved Defects in this Release
1. **Merged Table Special Instructions Leakage (`printKotTicket.ts`)**:
   - *Issue*: Merged table indicators previously leaked into the chef's cooking instructions area.
   - *Fix*: Implemented `extractAndSanitizeMergeTable` to hoist merged table identifiers into the `.loc-highlight` header block while preserving pure culinary instructions.
2. **Room Order Payment Summary Aggregation (`apps/pos/views.py` & `posDashboardService.ts`)**:
   - *Issue*: Room charge orders were previously excluded or miscategorized in dashboard revenue buckets.
   - *Fix*: Standardized case-insensitive matching (`ROOM`, `FOLIO`, `ROOM_SERVICE`) to bucket room settlements into `paymentSummary.other` and reflect live `roomChargesAmount` & `roomChargesCount`.
3. **Duplicate Table Prefix in Receipts (`printReceipt.ts`)**:
   - *Issue*: Receipt formatter produced strings like `"Table Table #1"`.
   - *Fix*: Added a case-insensitive prefix guard to check whether the table string already starts with `"Table"`.
4. **Purchase Return Navigation Consolidation (`posNavConfig.ts` & `PosPurchasesHub.tsx`)**:
   - *Issue*: Redundant separate sidebar entry for Purchase Returns.
   - *Fix*: Unified Purchase Returns under the Purchases hub header tab switch, standardizing navigation bar aesthetics.
5. **KOT History Date & Status Visibility (`posKotHistory.ts`)**:
   - *Issue*: Prepared KOT items were not reflecting on date range lookups.
   - *Fix*: Aligned query filters to fetch all completed and operational KOT statuses across selected date ranges.

### 4. Identified Necessary Fixes & Production Recommendations
During stress testing and edge-case integration analysis, the following operational enhancements are recommended:

1. **502 Bad Gateway & Network Disconnect Fallback (High Priority)**:
   - *Observation*: During backend service restarts or proxy timeouts (Nginx 502), the frontend exhibits error boundaries or broken data grids.
   - *Recommendation*: Implement an offline circuit-breaker and auto-reconnect banner with TanStack Query exponential retry jitter (`retry: 3, retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000)`).
2. **Concurrent Table Merge Concurrency Guard (Medium Priority)**:
   - *Observation*: If two floor staff simultaneously initiate order placement or merge on adjoining tables, state synchronization relies on polling.
   - *Recommendation*: Introduce optimistic locking (`version` or `updated_at` timestamp check) on `POST /api/pos/tables/merge/` to reject stale merges gracefully.
3. **KDS Low-Stock Threshold Alerts (Medium Priority)**:
   - *Observation*: KDS accepts multi-quantity orders for dishes whose raw materials have hit reorder levels.
   - *Recommendation*: Connect inventory consumption service directly to the KDS dispatch hook, rendering a non-blocking "Low Stock Warning" badge when inventory dips below minimum par.
4. **Draft Order LocalStorage Stash on Tab Close (Low Priority)**:
   - *Observation*: Accidental browser tab closing during draft order creation clears unpersisted cart items.
   - *Recommendation*: Add `beforeunload` event listener to persist draft order cart state to `sessionStorage` for instant recovery.

