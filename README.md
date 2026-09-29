# Merchandising Funnel Automation (MMS)

A distributed Merchandise Management System that digitally mirrors the physical
flow of goods and money through a retail business. The system replaces
spreadsheets, paper receipts, and manual data entry with eight autonomous
services that communicate over defined APIs and an event bus.

The architecture is deliberately **not a monolith** — each module owns its own
domain, its own database, and its own deployment lifecycle. If Financials goes
down for maintenance, sales still ring, goods still arrive, and shelves still
get stocked.

---

## Table of Contents

- [Business Context](#business-context)
- [Architecture](#architecture)
- [Module Directory](#module-directory)
- [Tech Stack](#tech-stack)
- [Communication Contract](#communication-contract)
- [Event Catalog](#event-catalog)
- [Local Development Setup](#local-development-setup)
- [Feature Flags](#feature-flags)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Example End-to-End Flows](#example-end-to-end-flows)
- [Repository Layout](#repository-layout)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Business Context

A retail business buys goods from suppliers, stores them in a warehouse, and
sells them in physical stores. Historically this ran on:

- **Spreadsheets** for purchase orders and stock counts
- **Paper receipts** for goods received at the dock
- **Manual data entry** into an accounting system weeks behind reality

The consequences were predictable: stale inventory counts, delayed supplier
payments, no real-time visibility into profitability, and errors caught only
during quarterly counts.

This system replaces that chaos with eight independent services that each
answer one business question — and only that question.

---

## Architecture
┌──────────────────────────────────────────────────────────────────────────────┐
│ │
│ EVENT BUS (RabbitMQ — topic exchange) │
│ │
└──────────▲─────────────▲──────────────▲──────────────▲──────────────▲────────┘
│ │ │ │ │
publish/subscribe (async, at-least-once, idempotent consumers)
│ │ │ │ │
┌────────┴──┐ ┌───────┴───┐ ┌───────┴───┐ ┌───────┴───┐ ┌───────┴───┐
│ Vendor │ │ Procure- │ │ Receiving │ │ Inventory │ │ Warehouse │
│ Mgmt │ │ ment │ │ (Inbound) │ │ (Stock) │ │ Ops │
│ :3001 │ │ :3002 │ │ :3003 │ │ :3004 │ │ :3005 │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
│ │ │ │ │
└──────────────┴──────────────┴──────────────┴──────────────┘
│
sync REST / gRPC
│
┌────────────┐ ┌───────────┐ ┌──┴─────────┐ ┌────────────┐
│ Retail │ │ Sales │ │ Financials │ │ Frontend │
│ Sales (POS)│ │ Audit │ │ (Ledger) │ │ Apps │
│ :3006 │ │ :3007 │ │ :3008 │ │ :5171-5180 │
└────────────┘ └───────────┘ └────────────┘ └────────────┘

text

**Two communication paths are used deliberately:**

| Path | When it's used | Examples |
|---|---|---|
| **Synchronous** — REST / gRPC | Caller needs an immediate answer to complete a transaction | POS → Inventory (check stock at checkout), Procurement → Vendor (get supplier terms), Warehouse Ops → Inventory (get product attributes) |
| **Asynchronous** — event bus | Publisher doesn't care who is listening or how long they take | Receiving → (Inventory, Warehouse Ops, Financials), POS → (Inventory, Sales Audit, Financials) |

The rule of thumb: **if the caller can't continue without the answer, it's
synchronous. If the caller just needs to announce that something happened,
it's an event.**

Each service has its own database. No service reads another service's tables.
This is enforced by architecture, not by convention — the databases are
separate Postgres instances and only the owning service knows the credentials.

---

## Module Directory

| # | Module | Backend Path | Frontend Path | Purpose | Phase |
|---|---|---|---|---|---|
| 1 | **Vendor Management** | `apps/vendor-management` | `frontend/vendor-management-portal` | Authoritative record of approved suppliers, their terms, lead times, and product catalogs | Phase 1 |
| 2 | **Procurement** | `apps/procurement` | `frontend/procurement-dashboard` | Purchase order lifecycle with approval workflow, unit cost lock-in, and reorder suggestions | Phase 1 |
| 3 | **Receiving** | `apps/receiving` | `frontend/warehouse-receiving-app` | Validate incoming goods against approved POs, flag discrepancies, generate Goods Received Notes | Phase 2 |
| 4 | **Inventory** | `apps/inventory` | `frontend/inventory-control-center` | Single source of truth for stock — on-hand counts, allocations, valuation, product master data | Phase 1 |
| 5 | **Warehouse Operations** | `apps/warehouse-operations` | `frontend/warehouse-floor-app` | Spatial brain of the warehouse — bin assignments, putaway, picking, transfers between buildings | Phase 2 |
| 6 | **Retail Sales (POS)** | `apps/retail-sales` | `frontend/pos-terminal-app` | Transaction engine for the storefront — pricing, sales, returns, payment capture | Phase 3 |
| 7 | **Sales Audit** | `apps/sales-audit` | `frontend/store-manager-dashboard` | Reconcile physical cash against POS totals, track overages and shortages with manager sign-off | Phase 3 |
| 8 | **Financials** | `apps/financials` | `frontend/finance-portal` | Automated bookkeeper — turns physical events into double-entry journal entries, AP, P&L, balance sheet | Phase 4 |

Every service follows the same DDD-flavoured internal structure:
apps/<service>/
├── migrations/ # Numbered SQL migrations
├── scripts/
│ └── migrate.ts # Migration runner
├── src/
│ ├── config/ # Env loading, database pool
│ ├── modules/ # Domain modules (one per aggregate)
│ │ └── <domain>/
│ │ ├── *.types.ts # Interfaces + DTOs
│ │ ├── *.model.ts # DB row → domain object mappers
│ │ ├── *.repository.ts # SQL, transactions
│ │ ├── *.service.ts # Business logic
│ │ ├── *.controller.ts # HTTP handlers
│ │ └── *.routes.ts # Express route table
│ ├── events/
│ │ ├── publisher.ts # Outbox → event bus drain loop
│ │ └── handlers/ # Subscribers for external events
│ ├── shared/
│ │ └── outbox.repository.ts # Transactional outbox write
│ ├── middleware/ # Error handler, validation, feature flags
│ ├── routes/ # Top-level API router
│ └── server.ts # Bootstraps everything
└── package.json

text

Frontends are plain React + Vite + TypeScript. Each app has:
frontend/<app>/
├── src/
│ ├── api/ # Typed HTTP client + per-domain API modules
│ ├── components/ # Shared UI components
│ ├── pages/ # Route-level views
│ ├── styles/ # Plain CSS
│ └── utils/ # Date formatting, helpers
└── vite.config.ts

text

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript (strict mode) |
| HTTP framework | Express |
| gRPC framework | `@grpc/grpc-js` + `@grpc/proto-loader` |
| Database | PostgreSQL 15 |
| Message broker | RabbitMQ 3 (topic exchange) |
| Schema validation | Zod |
| Frontend framework | React 18 |
| Frontend build | Vite 5 |
| Frontend state | TanStack Query (React Query) |
| Frontend routing | React Router 6 |
| Charting | Chart.js + react-chartjs-2 |
| Icons | lucide-react |
| Logging | `@mfa/logger` (structured JSON) |
| Errors | `@mfa/errors` (typed AppError subclasses) |
| Event bus client | `@mfa/event-bus` (RabbitMQ wrapper) |
| Migration runner | Custom `ts-node` runner with `_migrations` tracking table |

Shared packages live under `packages/` and are consumed by every service via
workspace references (`@mfa/logger`, `@mfa/errors`, `@mfa/event-bus`,
`@mfa/shared-types`).

---

## Communication Contract

### Synchronous (REST over HTTP)

Used for frontend interactions and for server-to-server calls where an
immediate answer is required to complete a transaction.

| Caller | Callee | Purpose | Protocol |
|---|---|---|---|
| Frontend apps | their own backend | All UI operations | REST / JSON |
| Procurement | Vendor Management | Fetch supplier details + product catalog when creating a PO | REST / JSON |
| POS Terminal | Inventory | Check stock availability before finalizing a sale | gRPC |
| Warehouse Ops | Inventory | Fetch product attributes for bin allocation decisions | gRPC |
| Finance Portal | Financials | Read reports, ledger, AP aging | REST / JSON |

### Asynchronous (event bus)

Used when a service announces that something important happened and doesn't
need to wait for anyone to process it.

- Every service writes events to an **outbox table** inside the same
  transaction that mutates its own state.
- A background worker (`OutboxPublisher`) polls the outbox and publishes each
  row to the topic exchange.
- Consumers are **idempotent** — a second delivery of the same event produces
  no side effects.

This is the transactional outbox pattern. It guarantees that state change and
event publication are atomic — if the DB commit succeeds, the event will
eventually be published; if the DB rolls back, the event vanishes with it.

---

## Event Catalog

### Published Events

| Event | Publisher | Payload (key fields) | Consumers |
|---|---|---|---|
| `receiving.goods-received-note.completed` | Receiving | `goodsReceivedNoteId`, `purchaseOrderId`, `supplierId`, `supplierName`, `lines[{productCode, receivedQty, unitCost}]` | Inventory, Warehouse Ops, Financials |
| `warehouse.putaway.completed` | Warehouse Ops | `taskId`, `productCode`, `quantity`, `assignedBin` | Inventory |
| `warehouse.pick.completed` | Warehouse Ops | `taskId`, `productCode`, `quantity`, `fromBin`, `toLocation` | Inventory |
| `warehouse.transfer.dispatched` | Warehouse Ops | `transferId`, `fromLocation`, `toLocation`, `lines` | Inventory |
| `warehouse.transfer.received` | Warehouse Ops | `transferId`, `fromLocation`, `toLocation`, `lines` | Inventory |
| `inventory.stock.received` | Inventory | `productCode`, `locationCode`, `quantity`, `newOnHand` | (extension point) |
| `inventory.stock.moved` | Inventory | `productCode`, `fromLocation`, `toLocation`, `quantity` | (extension point) |
| `inventory.stock.low` | Inventory | `productCode`, `locationCode`, `available`, `threshold` | Procurement (reorder suggestions) |
| `retail-sales.sale.completed` | POS | `saleId`, `saleNumber`, `storeLocation`, `grandTotal`, `taxTotal`, `lines`, `payments` | Inventory, Sales Audit, Financials |
| `retail-sales.sale.voided` | POS | `saleId`, `saleNumber`, `storeLocation`, `grandTotal` | Sales Audit, Financials |
| `retail-sales.return.completed` | POS | `returnId`, `returnNumber`, `originalSaleId`, `refundTotal`, `lines` | Inventory, Financials |
| `sales-audit.register.closed` | Sales Audit | `registerSessionId`, `registerCode`, `businessDate`, `expectedTotal`, `countedTotal`, `difference`, `signedOffBy` | Financials |
| `financials.journal-entry.posted` | Financials | `entryId`, `entryNumber`, `referenceType`, `referenceId`, `totalDebit` | (extension point — audit trail) |

### Subscriptions by Service

| Service | Subscribes to |
|---|---|
| Vendor Management | — (leaf service, publishes nothing) |
| Procurement | `inventory.stock.low` |
| Receiving | `procurement.purchase-order.approved` |
| Inventory | `receiving.goods-received-note.completed`, `warehouse.putaway.completed`, `warehouse.pick.completed`, `warehouse.transfer.dispatched`, `warehouse.transfer.received`, `retail-sales.sale.completed`, `retail-sales.return.completed` |
| Warehouse Operations | `receiving.goods-received-note.completed` |
| Retail Sales | — (publishes only) |
| Sales Audit | `retail-sales.sale.completed` |
| Financials | `receiving.goods-received-note.completed`, `retail-sales.sale.completed`, `retail-sales.return.completed`, `sales-audit.register.closed` |

---

## Local Development Setup

### Prerequisites

- **Node.js 20+** and **npm 10+**
- **Docker** and **Docker Compose**
- **PostgreSQL client** (`psql`) — optional, for inspecting databases
- **RabbitMQ management UI access** — optional, for inspecting queues

### 1. Clone and install

```bash
git clone <repository-url>
cd merchandising-funnel-automation
npm install
The npm install at the root installs dependencies for every workspace
(apps, frontends, packages) in one shot.

2. Start infrastructure
bash
docker compose up -d
This brings up:

PostgreSQL on localhost:5432 with 8 databases pre-created

RabbitMQ on localhost:5672 (AMQP) and localhost:15672 (management UI)

RabbitMQ default credentials are the standard local-only guest / guest

3. Configure environment
Each service ships with a .env.example file. Copy it to .env:

bash
for app in apps/*/; do
  if [ -f "$app/.env.example" ] && [ ! -f "$app/.env" ]; then
    cp "$app/.env.example" "$app/.env"
  fi
done

for fe in frontend/*/; do
  if [ -f "$fe/.env.example" ] && [ ! -f "$fe/.env" ]; then
    cp "$fe/.env.example" "$fe/.env"
  fi
done
The example files contain working local defaults. Do not commit .env files
— they are git-ignored.

4. Run migrations
Each service manages its own schema. Run all of them:

bash
npm run migrate:vendor
npm run migrate:procurement
npm run migrate:receiving
npm run migrate:inventory
npm run migrate:warehouse
npm run migrate:retail-sales
npm run migrate:sales-audit
npm run migrate:financials
Migrations are idempotent — a _migrations table tracks what's been applied,
so re-running is safe.

5. Start the backend services
Each service runs in its own terminal:

bash
npm run dev:vendor           # :3001
npm run dev:procurement      # :3002
npm run dev:receiving        # :3003
npm run dev:inventory        # :3004
npm run dev:warehouse        # :3005
npm run dev:retail-sales     # :3006
npm run dev:sales-audit      # :3007
npm run dev:financials       # :3008
6. Start the frontends
Also in separate terminals:

bash
npm run dev:vendor-portal       # :5171  Vendor Management Portal
npm run dev:procurement         # :5172  Procurement Dashboard
npm run dev:receiving           # :5173  Warehouse Receiving App
npm run dev:inventory           # :5174  Inventory Control Center
npm run dev:warehouse-floor     # :5177  Warehouse Floor App
npm run dev:pos-terminal        # :5178  POS Terminal
npm run dev:store-manager       # :5179  Store Manager Dashboard
npm run dev:finance-portal      # :5180  Finance Portal
7. Verify
Open any frontend. The health endpoint of each backend is available at:

text
GET http://localhost:<port>/api/v1/health
Expected response:

json
{ "status": "ok", "service": "<service-name>" }
Feature Flags
Development is phased. A feature flag is a simple env variable that toggles a
module on or off. When a flag is disabled, its routes return 404 and its
frontend menu items are hidden.

Phase	Modules	Flag Variable
Phase 1 — Foundation	Vendor, Procurement, Inventory	FEATURE_VENDOR, FEATURE_PROCUREMENT, FEATURE_INVENTORY
Phase 2 — Warehouse	Receiving, Warehouse Ops	FEATURE_RECEIVING, FEATURE_WAREHOUSE
Phase 3 — Retail	Retail Sales, Sales Audit	FEATURE_RETAIL_SALES, FEATURE_SALES_AUDIT
Phase 4 — Accounting	Financials	FEATURE_FINANCIALS
To disable a module temporarily:

bash
# In apps/<service>/.env
FEATURE_WAREHOUSE=disabled
Restart the service. All its routes now return:

json
{ "error": { "code": "FEATURE_DISABLED", "message": "Feature disabled" } }
This lets you merge code to main before the module is production-ready
without exposing half-built endpoints.

Database Migrations
Migrations are numbered SQL files applied in lexical order:

text
apps/warehouse-operations/migrations/
├── 001_create_locations.sql
├── 002_create_putaway_tasks.sql
├── 003_create_pick_tasks.sql
├── 004_create_transfers.sql
├── 005_create_outbox.sql
└── 006_seed_locations.sql
Rules:

Never edit an applied migration. Add a new one instead.

Never rename a migration. The _migrations table tracks them by filename.

Each migration is applied in a transaction. Failure rolls back the whole file.

Seeds go in their own numbered file (e.g. 006_seed_locations.sql) so they can be identified and reset independently.

To reset a single service's data without losing seed data, see the test-data
cleanup section in Troubleshooting.

Testing
Each service is set up for Jest:

bash
# Run tests for a specific service
npm --workspace=@mfa/inventory test

# Run all tests across the monorepo
npm test --workspaces
Test layout:

text
apps/<service>/
├── tests/
│   ├── unit/         # Domain logic in isolation
│   └── integration/  # Route handlers + repositories against a test DB
Integration tests use a dedicated test database. They do not touch development
data.

CI runs unit tests on every pull request. Integration tests run on merges to
main against an ephemeral Postgres instance.

API Documentation
REST
Each service exposes an OpenAPI 3.0 specification under contracts/openapi/:

text
contracts/openapi/
├── vendor-management.yaml
├── procurement.yaml
├── receiving.yaml
├── inventory.yaml
├── warehouse.yaml
├── retail-sales.yaml
├── sales-audit.yaml
└── financials.yaml
The specs are hand-written and are the source of truth for REST contracts.
They are populated before the business logic is written.

To view any spec, paste the YAML into editor.swagger.io,
or run a Swagger UI locally:

bash
npx @redocly/cli preview-docs contracts/openapi/financials.yaml
gRPC
.proto files live in contracts/proto/:

text
contracts/proto/
├── inventory.proto
├── procurement.proto
├── warehouse.proto
├── retail-sales.proto
└── financials.proto
These are loaded at service boot via @grpc/proto-loader. To regenerate client
stubs for another language, use protoc:

bash
protoc --proto_path=contracts/proto \
       --js_out=import_style=commonjs,binary:./generated \
       contracts/proto/inventory.proto
Example End-to-End Flows
Flow 1 — Purchase Order Creation
A buyer wants to order 100 units of Widget X from an approved supplier.

text
1. Buyer opens Procurement Dashboard (http://localhost:5172)
2. Clicks "New PO"
3. Selects supplier from dropdown  →  frontend calls
                                      Vendor Management /suppliers
4. Adds line items
5. Submits                          →  Procurement creates PO in "draft"
6. Clicks "Submit for approval"     →  status: pending
7. Clicks "Approve"                 →  status: approved
                                      Procurement publishes:
                                      procurement.purchase-order.approved
8. Clicks "Send"                    →  status: sent
Who listens: Receiving subscribes to procurement.purchase-order.approved
so it knows to expect a delivery. Financials doesn't listen yet — the
commitment is not yet a liability.

Flow 2 — Goods Arrive at the Dock
A truck from SPACEX arrives carrying 100 units of Widget X, but only 95 arrive.

text
1. Dock worker opens Receiving App (http://localhost:5173)
2. Clicks "New receipt"
3. Selects the PO from dropdown
4. Records each line:
     - ordered: 100
     - received: 95
     - condition: good
5. Shortage of 5 auto-flagged on the GRN
6. Clicks "Complete GRN"  →  Receiving publishes:
                             receiving.goods-received-note.completed
Who listens:

Inventory — increases on-hand count by 95 at MAIN

Warehouse Ops — creates a putaway task: "Place 95 units in bin A-01-01-A"

Financials — posts journal entry:

Debit Inventory 1200: 95 × unit_cost

Credit Accounts Payable 2000: 95 × unit_cost

And creates a supplier bill for that amount, due in 30 days

Flow 3 — Putaway
text
1. Picker opens Warehouse Floor App (http://localhost:5177)
2. Sees pending putaway task for Widget X → bin A-01-01-A
3. Taps "Start"  →  4-step guided flow:
     - Navigate to bin A-01-01-A
     - Scan bin barcode (must match)
     - Scan item barcode (must match)
     - Confirm quantity (must equal 95)
4. Task completes  →  Warehouse Ops publishes:
                      warehouse.putaway.completed
Who listens: Inventory consumes the event and moves the 95 units from MAIN
to the specific bin A-01-01-A. From now on, any picker asking "where is
Widget X?" gets an answer, not a shrug.

Flow 4 — Customer Buys an Item
text
1. Cashier opens POS Terminal (http://localhost:5178)
2. Scans Widget X  →  POS calls Inventory via gRPC:
                      "Is 1 unit available at Store #1?"
3. Inventory responds: yes
4. Cashier clicks "Charge"
5. Selects payment method (cash / card / gift card)
6. Completes payment
                  →  POS publishes:
                     retail-sales.sale.completed
Who listens:

Inventory — permanently deducts the reserved unit from on-hand

Sales Audit — adds the sale total to Register POS-01's expected total for today

Financials — posts journal entry:

Debit Cash 1000: 1,158.84

Credit Sales Revenue 4000: 999.00

Credit VAT Payable 2100: 159.84

Debit Cost of Goods Sold 5000: 599.40

Credit Inventory 1200: 599.40

Flow 5 — End of Day Reconciliation
The manager counts the cash drawer.

text
1. Manager opens Store Manager Dashboard (http://localhost:5179)
2. Sees Register POS-01 with status "Needs count"
3. Clicks "Reconcile"
4. Enters physical count:
     - cash: 4,950
     - card slips: 300
     - other: 0
5. Difference is calculated live:
     expected: 5,000
     counted:  4,950
     difference: −50 (shortage)
6. Because there's a variance, an explanation is required
7. Manager types: "Cashier forgot to log a KES 50 payout for cleaning supplies"
8. Signs off with their name
9. Clicks "Sign off and close session"
                  →  Sales Audit publishes:
                     sales-audit.register.closed
Who listens: Financials posts:

Debit Cash Over/Short 5900: 50

Credit Cash 1000: 50

The shortage becomes a line item in the general ledger. If it repeats,
Financials' discrepancy analytics will surface the pattern.

Flow 6 — Supplier Payment
text
1. Accountant opens Finance Portal (http://localhost:5180)
2. Goes to Payables
3. Sees the bill from Flow 2 (95 × unit_cost, due in 30 days)
4. Clicks "Pay"
5. Enters the amount
6. Confirms
                  →  Financials posts journal entry:
                     Debit Accounts Payable 2000
                     Credit Cash 1000
                  →  Bill status: open → paid
                  →  AP Aging bar updates
The full chain in one picture
text
Truck arrives                     Store opens                    End of day
     │                                 │                              │
     ▼                                 ▼                              ▼
 Receiving  ──event──▶  Warehouse Ops  ──event──▶  POS Sale  ──event──▶  Sales Audit
     │                        │                        │                      │
     ├──event──▶ Inventory ───┘                        │                      │
     │                                                   │                      │
     └──event─────────────┐                             │                      │
                          ▼                             ▼                      ▼
                      Financials  ◀── event ──── ◀── event ──── ◀── event ────┘
                          │
                          ▼
                    Ledger, P&L, AP, Balance Sheet
Repository Layout
text
merchandising-funnel-automation/
├── apps/                              # Backend services
│   ├── vendor-management/
│   ├── procurement/
│   ├── receiving/
│   ├── inventory/
│   ├── warehouse-operations/
│   ├── retail-sales/
│   ├── sales-audit/
│   └── financials/
├── frontend/                          # React applications
│   ├── vendor-management-portal/
│   ├── procurement-dashboard/
│   ├── warehouse-receiving-app/
│   ├── inventory-control-center/
│   ├── warehouse-floor-app/
│   ├── pos-terminal-app/
│   ├── store-manager-dashboard/
│   └── finance-portal/
├── packages/                          # Shared libraries
│   ├── event-bus/
│   ├── shared-types/
│   ├── feature-flags/
│   ├── observability/
│   ├── errors/
│   └── logger/
├── contracts/                         # API contracts (source of truth)
│   ├── openapi/
│   └── proto/
├── infrastructure/                    # Local development infrastructure
│   ├── postgres/
│   ├── rabbitmq/
│   └── kong/                          # Optional API gateway
├── docs/                              # Architecture docs, ADRs
│   ├── architecture.md
│   ├── event-catalog.md
│   ├── communication-matrix.md
│   ├── feature-flags.md
│   ├── local-development.md
│   └── adr/
├── .github/workflows/                 # CI pipelines
├── docker-compose.yml
├── package.json                       # Workspace root
└── tsconfig.json                      # Shared TS config
Development Workflow
Branching
main is protected. Never push directly.

Feature work happens on branches named feat/<module>-<description>,
fix/<module>-<description>, or docs/<topic>.

Examples:

text
feat/receiving-service
feat/inventory-reservation
fix/warehouse-bin-allocation
docs/system-overview
Pull Requests
A PR should cover one module or one significant feature. Do not bundle
unrelated changes.

Before requesting review, confirm:

□ All tests pass locally
□ API documentation is updated (contracts/openapi/ or contracts/proto/)
□ The feature flag for the relevant phase is configured
□ The module directory table in this README is updated if a new module was added
□ No .env files, secrets, or local-only paths are committed
Merge gates in CI:

TypeScript compiles with no errors (tsc --noEmit)

Unit tests pass

Integration tests pass

OpenAPI / proto specs validate

Commit Messages
Follow the standard imperative-mood convention:

text
<type>: <imperative summary under 50 chars>

<Body explaining what and why, wrapped at 72 characters.>
<Not how — the code shows how.>

Co-authored-by: Name <email@example.com>
The subject line must not end with a period, must use imperative mood ("Add",
not "Added"), and must be capitalized.

Troubleshooting
A service fails to start with "relation does not exist"
The migration runner hasn't been invoked. Run:

bash
npm run migrate:<service>
A service logs "Outbox flush failed"
The event bus is unreachable. Verify RabbitMQ is up:

bash
docker compose ps rabbitmq
Then check the management UI at
http://localhost:15672 (default local credentials).

Duplicate events produce duplicate side effects
Every event consumer must be idempotent. If a downstream service is creating
duplicate rows, its handler is missing an existence check. The pattern is:

ts
if (await repo.existsForReference(referenceType, referenceId, tx)) {
  return;  // Already processed — skip silently
}
Combine this with a partial unique index on the reference column so the
database also enforces it:

sql
CREATE UNIQUE INDEX uniq_entries_per_ref
  ON journal_entries(reference_type, reference_id)
  WHERE reference_type IS NOT NULL;
Migration fails with "permission denied to create extension"
Some migrations call CREATE EXTENSION IF NOT EXISTS pgcrypto. That requires
superuser privileges. Run it once as the postgres superuser against the
offending database:

bash
docker exec -it mfa-postgres psql -U postgres -d <database> \
  -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
A frontend shows a blank white screen
Two likely causes:

A runtime error in a component. Open DevTools → Console for the exact
error and stack trace.

A missing import after an automated refactor. Run tsc --noEmit in the
frontend directory to see TypeScript errors.

Resetting test data without losing seed data
The following databases have seed data that should survive a reset:
locations (Warehouse), accounts (Financials), registers (Sales Audit),
retail_prices (Retail Sales).

To clear transactional tables while keeping seeds, truncate everything else
explicitly:

bash
docker exec -i mfa-postgres psql -U vendor_user -d vendor_db -c \
  "TRUNCATE TABLE suppliers, supplier_products, supplier_product_price_history, supplier_reliability, outbox CASCADE;"

docker exec -i mfa-postgres psql -U warehouse_user -d warehouse_db -c \
  "TRUNCATE TABLE putaway_tasks, pick_tasks, transfers, transfer_lines, outbox CASCADE;"

docker exec -i mfa-postgres psql -U finance_user -d financials_db -c \
  "TRUNCATE TABLE journal_entries, journal_lines, supplier_bills, product_costs, outbox CASCADE;"
Adjust the table lists for the other services based on \dt output.

The POS shows "Unknown product" when scanning
The product has no retail price. Add one from the POS Prices page, or seed
directly:

sql
INSERT INTO retail_prices (product_code, product_name, unit_price)
VALUES ('PROD-X', 'Widget X', 999.00)
ON CONFLICT (product_code) DO NOTHING;
A bill shows "Unknown" as the supplier name
The GRN that generated the bill was created before the supplierName field
was added to the completion event. New GRNs will carry the name; historical
ones can be back-filled with an UPDATE against supplier_bills using the
supplier_id mapping from Receiving's database.

License
Copyright © 2026. All rights reserved.
