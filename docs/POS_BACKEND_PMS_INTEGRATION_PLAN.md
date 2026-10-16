# Retrod POS Backend — Part-wise Build Plan inside PMS

**Document type:** Backend start plan (before coding the next POS APIs)  
**Audience:** Retrod engineering (POS UI + PMS backend)  
**Date:** 2026-10-16  
**Goal:** Build POS APIs inside the existing PMS Django project **without breaking PMS**, and enable **Room Service → Room Charge → Guest Folio** end-to-end.

**Architecture rule:** Follow the **same backend code architecture as PMS feature apps** (`models.py` → `serializers.py` → `services.py` → `views.py` → `urls.py` → `tests.py` / `migrations/`), e.g. `apps/features/front_office/`. Thin views, logic in services, `BaseModel`, tenant/RBAC reuse.

**Word copy:** `POS/docs/Retrod_POS_Backend_PMS_Integration_Plan.docx` (also under `apps/POS/`).

---

## 1. Where POS backend lives (already decided)

POS backend is **not** a separate Django project. It is a Django app inside the PMS backend monolith:

| Item | Path / value |
|------|----------------|
| PMS backend root | `PMS/backend/retrod-one-backend/` |
| POS Django app | `apps/POS/` (`name = 'apps.POS'`, `label = 'pos'`) |
| Registered in | `retrod_pms/settings.py` → `INSTALLED_APPS` → `'apps.POS'` |
| URL mount | `retrod_pms/urls.py` → `path('api/pos/', include('apps.POS.urls'))` |
| POS UI (frontend) | `POS/` (Vite/React) — talks to `/api/pos/...` (+ selected PMS APIs) |

**Current POS backend seed (already present):**

- Models: `Outlet`, `FloorSection`, `RestaurantTable`, `POSRegister`, `DeviceMapping`
- CRUD APIs under `/api/pos/outlets|sections|tables|registers|devices`

**PMS owners POS must call (do not re-implement):**

- Reservations / in-house stays → `apps.features.reservations`
- Rooms / inventory units → `apps.features.inventory`
- Guest folio + postings → `apps.features.front_office` (`GuestFolio`, `FolioTransaction`)
- Invoices / tax masters (later) → `apps.features.billing`
- Auth / tenant / RBAC → `apps.core.accounts`, `apps.core.tenants`, `apps.core.rbac`

---

## 2. Non-negotiable rules (avoid PMS conflicts & errors)

### 2.1 Ownership boundaries

| Domain | Owner app | POS may… | POS must not… |
|--------|-----------|----------|----------------|
| Tenant / Property / Auth / RBAC | `core.*` | Reuse middleware, permissions, headers (`X-Tenant-ID`, `X-Property-ID`) | Duplicate user/tenant tables |
| Rooms & housekeeping status | `features.inventory` + `housekeeping` | **Read** occupied rooms / unit status | Change room HK status from POS without PMS service |
| Reservations & check-in | `features.reservations` + `front_office` | **Read** in-house stays (`CHECKED_IN`) | Invent a second “stay” model |
| Guest folio balance | `features.front_office` | Call a **folio posting service** | Recalculate / overwrite `GuestFolio.balance` ad-hoc |
| Menu, tables, KOT, POS orders | `apps.POS` | Own all F&B operational data | Put menu/KOT tables into `front_office` or `reservations` |
| Night audit / cashier shifts | `front_office` | Emit POS day-close totals later | Bypass night-audit rules |

### 2.2 Safe Django practices inside the shared project

1. **App label is `pos`** — keep `apps.POS` package name; never rename casually (breaks migrations).
2. **All new POS tables stay under `apps/POS/`** (or subpackages like `apps/POS/menu/`, but same Django app or clearly namespaced labels). Prefer **one app + modular Python packages** first to avoid migration chaos.
3. **Never edit historical PMS migrations.** Only add new POS migrations (`python manage.py makemigrations pos`).
4. **ForeignKeys to PMS are one-way:** POS → Reservation / InventoryUnit / GuestFolio. Do **not** add FK from `GuestFolio` back into POS models unless absolutely required.
5. **Shared BaseModel only** (`apps.core.common.models.BaseModel`) — soft delete, timestamps, tenant patterns stay consistent.
6. **URL namespace isolation:** everything POS under `/api/pos/...`. Folio post may also expose a thin bridge under `/api/pos/integrations/folio/...` that internally calls front_office services — avoid inventing a second public folio API that competes with `/api/front-office/`.
7. **Permissions:** add POS permission codes in RBAC seed (`pos:outlet:view`, `pos:order:create`, `pos:folio:post`, …). Do not hardcode `AllowAny` for production paths.
8. **Transactions:** any Room Charge that posts to folio + settles POS order must run in **`transaction.atomic()`** with an **idempotency key**.
9. **Do not change PMS model field names** used by night audit / checkout while POS is integrating. Extend via new fields or JSON meta if needed.
10. **Tests gate merge:** each POS part ships with API tests that also assert PMS folio totals when Room Charge is involved.

### 2.3 What “conflict” looks like (and how we prevent it)

| Risk | Prevention |
|------|------------|
| Double charge on folio | Idempotency key = `pos_order_id` + `payment_attempt`; unique constraint on bridge table |
| Wrong guest folio | Resolve folio only from `reservation` where status = `CHECKED_IN` + open `GuestFolio` |
| Broken checkout | Folio posts use same `FolioTransaction` types PMS already understands (`CHARGE` + charge_code e.g. `POS_FNB` / `ROOM_SERVICE`) |
| Migration clashes | Only touch `pos` migrations; rebase if PMS main moved |
| Auth drift | Reuse JWT + tenant middleware already used by PMS APIs |
| Circular imports | POS views → `apps.POS.services.folio_bridge` → front_office **services**, not views |

---

## 3. Target architecture (modular monolith)

```
                    ┌─────────────────────────────┐
                    │         POS UI (React)      │
                    │  /pos/billing, room service │
                    └──────────────┬──────────────┘
                                   │  /api/pos/*
                    ┌──────────────▼──────────────┐
                    │   Django: apps.POS          │
                    │  outlets · menu · orders    │
                    │  kot · payments · reports   │
                    └───────┬───────────┬─────────┘
            read occupied   │           │ post Room Charge
            rooms / stay    │           │ (atomic)
                    ┌───────▼───┐   ┌───▼────────────────────┐
                    │reservations│   │ front_office           │
                    │inventory   │   │ GuestFolio             │
                    │            │   │ FolioTransaction       │
                    └────────────┘   └───────────────────────┘
```

**Principle:** PMS remains source of truth for **stay + folio**. POS remains source of truth for **F&B order + KOT**. The bridge is a small, audited service.

---

## 4. Room Charge / Guest Folio business flow

This is the critical cross-product flow for Room Service / Dine-In with room posting.

### 4.1 Happy path (step by step)

1. **Guest is in-house**  
   Reservation status `CHECKED_IN`, room allocated (`ReservationInventory` / room allocation), open `GuestFolio` (`status=OPEN`).

2. **POS loads occupied rooms**  
   UI Room Service screen calls POS bridge API (recommended):  
   `GET /api/pos/integrations/occupied-rooms/`  
   Implementation **reads** PMS data (not a second occupancy store):
   - Reservation `CHECKED_IN`
   - Room / unit number, guest name, pax, phone
   - Open folio id + folio_number + current balance (optional)
   - Flag `is_open_for_charges` (folio OPEN, not SUSPENDED)

3. **Captain / cashier takes room order**  
   Create POS order:  
   `POST /api/pos/orders/` with `order_type=ROOM_SERVICE`, `room_id` / `reservation_id`, cart lines, taxes.

4. **Send KOT**  
   `POST /api/pos/orders/{id}/kot/` → kitchen tickets (POS-owned). Order stays open / in preparation.

5. **Guest asks: “Put it on my room”**  
   Settle with payment method **Room Charge**:  
   `POST /api/pos/orders/{id}/settle/` body:

   ```json
   {
     "payment_mode": "ROOM_CHARGE",
     "reservation_id": "...",
     "folio_id": "...",
     "idempotency_key": "pos-ord-10521-settle-1"
   }
   ```

6. **Atomic folio post (bridge service)**  
   Inside `transaction.atomic()`:
   - Re-validate reservation still `CHECKED_IN` and folio still `OPEN`
   - Create `FolioTransaction`:
     - `transaction_type = CHARGE`
     - `charge_code = POS_ROOM_SERVICE` (or `POS_FNB`)
     - `amount = order.grand_total`
     - `description = "Room Service ORD-10521 · Outlet Main Restaurant"`
     - optional meta: `pos_order_id`, outlet, item summary
   - Update folio `total_charges` / `balance` using **existing PMS save rules**
   - Mark POS order `SETTLED`, payment_mode `ROOM_CHARGE`, store `folio_transaction_id`
   - Write POS `FolioPostingLog` (idempotency + status SUCCESS)

7. **PMS Front Office sees it**  
   Guest folio screen / checkout already lists `FolioTransaction` lines → food bill appears on the **current occupied guest folio**.

8. **Checkout**  
   Night audit / checkout settles folio including POS lines — no special POS step required if charge_code is standard.

### 4.2 Failure & edge cases

| Case | Behavior |
|------|----------|
| Folio suspended / settled | Reject Room Charge; force Cash/UPI/Card or Due |
| Guest checked out mid-order | Reject post; keep POS order open / convert to walk-in settle |
| Duplicate settle click | Same `idempotency_key` → return previous success (no second charge) |
| Partial payment + room charge | Prefer: room charge only for remaining due; log split payments |
| Void after room charge | Create `REVERSAL` FolioTransaction + POS void audit (manager permission) |
| Network retry from UI | Idempotency key mandatory on settle |

### 4.3 Sequence diagram

```
POS UI          POS API              FolioBridge           Front Office DB
  |  occupied rooms |                     |                      |
  |---------------->| read CHECKED_IN     |                      |
  |                 |-------------------->|                      |
  |                 |<--------------------|                      |
  |  create order   |                     |                      |
  |---------------->| save POS Order      |                      |
  |  send KOT       |                     |                      |
  |---------------->| KOT tickets         |                      |
  |  settle ROOM_CHARGE                  |                      |
  |---------------->| validate stay/folio |                      |
  |                 |-------------------->| INSERT FolioTxn      |
  |                 |                     | UPDATE GuestFolio    |
  |                 | mark order SETTLED  |                      |
  |<----------------| success + folio ref |                      |
```

---

## 5. Part-wise backend work plan (do in this order)

Work **one vertical slice at a time**. Each part ends with: models (if any) → serializers → services → URLs → tests → wire POS UI.

### Part 0 — Foundation hardening (½–1 day) ✅ mostly exists

**Goal:** Safe base so later parts don’t fight PMS.

- Confirm `apps.POS` in `INSTALLED_APPS` and `/api/pos/` route (done).
- Lock coding standards: tenant/property filters on every queryset.
- Add empty packages (no circular imports):

  ```
  apps/POS/
    models.py          # keep core outlet/table models
    services/          # business logic (folio_bridge.py, occupancy.py)
    integrations/      # thin wrappers around PMS reads/writes
    permissions.py
    tests/
  ```

- Replace production `AllowAny` with RBAC permission classes (can be phased).
- **Do not** start menu/orders until occupancy + folio bridge contract is written (this doc).

**Exit criteria:** `manage.py check` green; existing outlet/table APIs still pass.

---

### Part 1 — Occupied rooms bridge (PMS → POS UI)

**Goal:** Room Service screen shows real in-house guests.

**Build**

- Service: `apps/POS/services/occupancy.py`
  - Query reservations `status=CHECKED_IN` for property
  - Join room allocation + guest profile + open folio
- API: `GET /api/pos/integrations/occupied-rooms/`
- Response DTO (example):

  ```json
  {
    "rooms": [
      {
        "room_number": "204",
        "unit_id": "...",
        "reservation_id": "...",
        "guest_name": "Aman Singhal",
        "guest_phone": "...",
        "pax": 2,
        "folio_id": "...",
        "folio_number": "FOLIO-...",
        "folio_status": "OPEN",
        "balance": "4850.00",
        "is_open_for_charges": true
      }
    ]
  }
  ```

**Rules**

- Read-only. No writes to reservations.
- Vacant / dirty / checked-out rooms excluded.
- Cache lightly (15–30s) if needed; invalidate on check-in/out later.

**POS UI wire**

- Replace mock rooms in Room Service / billing room picker with this API.

**Exit criteria:** Occupied room from PMS check-in appears in POS; vacant does not.

---

### Part 2 — Menu catalog & taxes (POS-owned)

**Goal:** Billing menu comes from API, not mocks.

**Build (in `apps.POS`)**

- Models: `MenuCategory`, `MenuItem`, `MenuVariant`, `ModifierGroup`, `ModifierOption`, `TaxProfile` (or reuse outlet tax fields first)
- APIs: `/api/pos/menu/categories`, `/items`, schedule/on-off flags
- Seed command: `seed_pos_menu`

**Rules**

- Do not store menu under PMS `inventory` (rooms inventory ≠ F&B SKU). Later BOM can *link* to stock items.

**Exit criteria:** POS billing catalog loads from `/api/pos/menu/...`.

---

### Part 3 — Orders + KOT + Current Orders

**Goal:** Match POS UI flows (place → preparation → settle → history).

**Build**

- Models: `POSOrder`, `POSOrderItem`, `KOTTicket`, `KOTTicketItem`, `POSOrderStatusHistory`
- Statuses aligned with UI: `PLACED` → `PREPARED` → `SETTLED` / `CANCELLED`
- APIs:
  - `POST /api/pos/orders/`
  - `POST /api/pos/orders/{id}/kot/`
  - `POST /api/pos/orders/{id}/advance-stage/`
  - `GET /api/pos/orders/current/`
  - `GET /api/pos/orders/history/`
  - `PATCH /api/pos/orders/{id}/` (edit items → incremental KOT)

**Rules**

- Order numbers unique per property.
- Editing open order generates **modified KOT** (delta), updates totals.
- Settled orders immutable except manager void.

**Exit criteria:** UI Current Orders / KDS / Order History run on API (no in-memory mock store).

---

### Part 4 — Payments + Room Charge → Folio (core integration)

**Goal:** Food bill posts to occupied guest folio.

**Build**

- Models: `POSPayment`, `FolioPostingLog`  
  (`idempotency_key` unique, `folio_transaction_id`, status, payload snapshot)
- Service: `apps/POS/services/folio_bridge.py`
  - `post_room_charge(order, folio_id, reservation_id, idempotency_key)`
  - Uses `GuestFolio` + `FolioTransaction` from `front_office`
- Settle API supports: `CASH`, `CARD`, `UPI`, `ROOM_CHARGE`, `SPLIT`, `DUE`
- Charge code convention (agree with PMS once):

  | charge_code | Use |
  |-------------|-----|
  | `POS_ROOM_SERVICE` | In-room dining |
  | `POS_FNB` | Restaurant / bar room charge |
  | `POS_REVERSAL` | Linked void (or use `transaction_type=REVERSAL`) |

**Optional PMS-side (only if needed)**

- Small helper on front_office: `FolioService.post_charge(...)` if posting logic is duplicated today — **prefer one shared service** called by POS and FO UI.

**Exit criteria:**

1. Settle Room Charge creates folio line.  
2. FO guest folio balance increases by order total.  
3. Retry with same idempotency key does not double post.  
4. Checkout still works with POS lines present.

---

### Part 5 — Due bills, splits, day close

**Goal:** Pending Payments + Export parity with UI.

- Due ledger for non-room / unpaid checks
- Split payments
- Day-end summary totals (feed night audit later)
- Excel export endpoints matching UI “Export to Excel”

---

### Part 6 — Stock / recipe / reports (later)

- Recipe BOM → deduct stock on settle (link to inventory SKUs carefully)
- Aggregator webhooks
- Advanced reports

---

## 6. Suggested implementation order vs POS UI screens

| Order | Backend part | Primary UI screens |
|------:|--------------|--------------------|
| 1 | Occupied rooms bridge | Room Service floor, Billing room picker |
| 2 | Menu APIs | Billing catalog, Menu On/Off |
| 3 | Orders + KOT | Take Order, Billing KOT, Current Orders, KDS |
| 4 | Room Charge folio post | Billing Settle → Room Charge, FO Folio |
| 5 | History / dues / export | Order History, Pending Payments |
| 6 | Stock & reports | Inventory, Reports |

**Do not** build stock before Room Charge — folio integration unblocks hotel operations first.

---

## 7. API contract sketch (Part 1 + Part 4)

### 7.1 List occupied rooms

`GET /api/pos/integrations/occupied-rooms/?property_id=`

Headers: auth + `X-Tenant-ID` + `X-Property-ID`

### 7.2 Settle with room charge

`POST /api/pos/orders/{order_id}/settle/`

```json
{
  "payment_mode": "ROOM_CHARGE",
  "reservation_id": "uuid",
  "folio_id": "uuid",
  "idempotency_key": "uuid-or-string",
  "tendered_amount": null
}
```

Success:

```json
{
  "order_id": "...",
  "order_number": "ORD-10521",
  "status": "SETTLED",
  "payment_mode": "ROOM_CHARGE",
  "folio_id": "...",
  "folio_number": "FOLIO-8891",
  "folio_transaction_id": "...",
  "folio_balance_after": "5970.00"
}
```

---

## 8. Data model additions (POS app only)

Minimal new tables for Room Charge path (Part 3–4):

```
POSOrder
  - tenant, property, outlet
  - order_number, order_type (DINE_IN|TAKEAWAY|ROOM_SERVICE|...)
  - reservation_id (nullable FK/UUID)
  - room_unit_id (nullable)
  - folio_id (nullable, set on room charge)
  - status, subtotal, tax, grand_total
  - placed_at, settled_at

POSOrderItem
  - order, item snapshot fields, qty, price, notes

KOTTicket / KOTTicketItem
  - order, sequence, is_modified, status, timestamps

POSPayment
  - order, mode, amount, reference

FolioPostingLog
  - order, folio_id, folio_transaction_id
  - idempotency_key (unique)
  - status (PENDING|SUCCESS|FAILED)
  - request_payload, error_message
```

PMS `GuestFolio` / `FolioTransaction` **unchanged** unless a shared `FolioService` cleanup is agreed.

---

## 9. Testing plan (must block merge for Part 4)

1. **Unit:** folio_bridge rejects non-OPEN folio / non-CHECKED_IN reservation.  
2. **API:** occupied-rooms returns only in-house.  
3. **Integration:** create room order → settle ROOM_CHARGE → assert one `FolioTransaction` + folio.balance.  
4. **Idempotency:** settle twice → one folio line.  
5. **Regression:** PMS front_office folio tests still pass.  
6. **Checkout smoke:** reservation with POS charge can settle folio.

---

## 10. How we work day-to-day (process)

1. **Branch from latest PMS backend** (`retrod-one-backend`).  
2. One PR = one Part (or smaller). Title: `pos(backend): Part 1 occupied rooms bridge`.  
3. Never mix PMS reservation refactors with POS order features in the same PR.  
4. After models: `makemigrations pos` only → commit migrations with code.  
5. Update POS UI service layer (`POS/src/services/...`) in a **follow-up PR** once API is stable — or same PR if contract is tiny (Part 1).  
6. Document new endpoints in drf-spectacular tags: `POS - Integrations`, `POS - Orders`.  
7. Demo script per part: check-in in PMS → see room in POS → order → room charge → open folio in PMS.

---

## 11. Immediate next actions (when you say “start Part 1”)

1. Add `apps/POS/services/occupancy.py` + `FolioPostingLog` stub (optional until Part 4).  
2. Implement `GET /api/pos/integrations/occupied-rooms/`.  
3. Add tests with a checked-in reservation fixture.  
4. Point POS Room Service UI at the new endpoint.  
5. Only then start Part 2 (menu) / Part 3 (orders).

---

## 12. Summary

- POS backend stays inside **`PMS/backend/retrod-one-backend/apps/POS`**, URLs under **`/api/pos/`**.  
- PMS owns **stay + folio**; POS owns **F&B order + KOT**; bridge posts **Room Charge** with idempotency.  
- Build order: **Occupied rooms → Menu → Orders/KOT → Room Charge folio → Dues/Reports**.  
- This avoids migration/auth/folio conflicts and makes food bills show on the **current occupied guest folio** at checkout.

---

*Related docs:* `POS/docs/POS_IMPLEMENTATION_ROADMAP.md` (UI phases), existing seed models in `apps/POS/models.py`, folio models in `apps/features/front_office/models.py`.
