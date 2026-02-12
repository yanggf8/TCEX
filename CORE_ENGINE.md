# TCEX Core Engine — Trading Backend Specification

## Overview
The backend trading infrastructure for Taiwan Capital Exchange. This system handles order management, matching, clearing/settlement, and real-time data distribution. Built on **Cloudflare's serverless platform** as part of the same SvelteKit codebase.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Platform                         │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Portal      │  API Routes  │  Durable     │  Storage        │
│  (SvelteKit) │  (+server.ts)│  Objects     │                 │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│ Public site  │ REST API     │ Matching     │ D1 (SQLite)     │
│ SSG/SSR      │ Auth/Rate    │ WebSocket    │ KV (sessions)   │
│ i18n         │ JWT hooks    │ Orderbook    │ R2 (KYC docs)   │
│ SEO          │ Validation   │ State mgmt   │ Queues (events) │
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Routes | **SvelteKit `+server.ts`** | Same codebase, TypeScript, runs on Workers |
| Matching Engine | **Cloudflare Durable Object** | Stateful singleton, in-memory orderbook, WebSocket |
| Database (transactional) | **Cloudflare D1** (SQLite) | ACID, zero config, edge-local, SQL |
| Sessions / Cache | **Cloudflare KV** | Global low-latency key-value, JWT storage |
| Object Storage | **Cloudflare R2** | S3-compatible, KYC documents, reports |
| Event Queue | **Cloudflare Queues** | Async audit trail, distribution events |
| Real-time | **Durable Objects WebSocket** | Per-listing orderbook, trade feed |
| Search | **D1 FTS5** | Built-in SQLite full-text search |

> **Migration path**: If FSC requires Taiwan-only data residency, D1 can be replaced with Hyperdrive + GCP Cloud SQL PostgreSQL (`asia-east1`) without changing API routes. See Phase 5 in README.md.

## Matching Engine

### Order Types Supported
| Type | Description |
|------|-------------|
| Market | Execute at best available price |
| Limit | Execute at specified price or better |
| Stop-Limit | Trigger limit order when stop price reached |

### Matching Algorithm
- **Price-Time Priority** (FIFO at each price level)
- Order book: buy-side sorted descending, sell-side sorted ascending
- Partial fills supported
- Minimum order size enforced per product type

### Order Lifecycle
```
PENDING → VALIDATED → QUEUED → PARTIAL_FILL → FILLED
                   → REJECTED (risk check fail)
          → CANCELLED (user/system)
          → EXPIRED (time-in-force exceeded)
```

### Performance Targets
| Metric | Target |
|--------|--------|
| Order processing latency | < 5ms (p99) |
| Throughput | 10,000 orders/second |
| Matching latency | < 1ms (p99) |
| Recovery time | < 30 seconds |

## Order Management System (OMS)

### Order Fields
```
Order {
  id: UUID
  user_id: UUID
  product_type: RBO | SPV | SPAC | ETF
  listing_id: UUID
  side: BUY | SELL
  order_type: MARKET | LIMIT | STOP_LIMIT
  quantity: Decimal
  price: Decimal (nullable for MARKET)
  stop_price: Decimal (nullable)
  time_in_force: GTC | GTD | IOC | FOK
  status: OrderStatus
  filled_quantity: Decimal
  avg_fill_price: Decimal
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Pre-Trade Risk Checks
1. Sufficient balance (TWD or asset)
2. Position limits per user/product
3. Price band validation (circuit breaker range)
4. Daily trading limit check
5. Product eligibility (KYC level match)
6. Market hours validation

## Clearing & Settlement

### Settlement Cycle
- **T+2** for standard transactions
- **T+0** for specific revenue-sharing distributions

### Settlement Process
```
Trade Executed → Netting → Obligation Calculation → Fund Transfer → Asset Transfer → Confirmation
```

### Revenue Sharing Distribution
- Scheduled distributions based on SPV/RBO terms
- Automated calculation from underlying asset performance
- TWD bank transfer to investor accounts
- Full audit trail per distribution

## Real-Time Data (WebSocket)

### Connection
```
wss://tcex-portal.pages.dev/ws/v1  (or custom domain: wss://tcex.tw/ws/v1)
```

### Authentication
```json
{ "type": "auth", "token": "<JWT>" }
```

### Channel Subscriptions
```json
{ "type": "subscribe", "channels": ["stats", "orderbook:SPV-001", "trades:SPV-001"] }
```

### Message Types

#### Market Statistics (public)
```json
{
  "channel": "stats",
  "type": "stat_update",
  "data": {
    "daily_volume": "1055897.79",
    "cumulative_financing": "5775000000",
    "active_listings": 136,
    "daily_revenue_sharing": "2332703.10",
    "timestamp": "2026-02-10T08:30:00+08:00"
  }
}
```

#### Order Book Update (public)
```json
{
  "channel": "orderbook:SPV-001",
  "type": "l2_update",
  "data": {
    "bids": [["100.50", "500"], ["100.00", "1200"]],
    "asks": [["101.00", "300"], ["101.50", "800"]],
    "sequence": 1234567
  }
}
```

#### Trade Feed (public)
```json
{
  "channel": "trades:SPV-001",
  "type": "trade",
  "data": {
    "id": "t-uuid",
    "price": "100.75",
    "quantity": "200",
    "side": "BUY",
    "timestamp": "2026-02-10T08:30:01.234+08:00"
  }
}
```

#### User Order Update (private, authenticated)
```json
{
  "channel": "user:orders",
  "type": "order_update",
  "data": {
    "order_id": "o-uuid",
    "status": "PARTIAL_FILL",
    "filled_quantity": "100",
    "avg_fill_price": "100.75",
    "remaining": "400"
  }
}
```

## REST API Design

### Base URL
```
/api/v1  (same origin — SvelteKit +server.ts routes on Cloudflare Workers)
```

### Public Endpoints (no auth)
```
GET  /market/stats                    # Current market statistics
GET  /market/stats/historical         # Historical stats (TimescaleDB)
GET  /listings                        # All active listings (paginated)
GET  /listings/{id}                   # Listing detail
GET  /listings/{id}/orderbook         # Current order book snapshot
GET  /listings/{id}/trades            # Recent trades
GET  /listings/{id}/candles           # OHLCV data (1m, 5m, 15m, 1h, 1d)
GET  /products                        # Product types (RBO, SPV, SPAC, ETF)
GET  /products/{type}                 # Product type detail
GET  /calendar/trading-days           # Trading calendar
GET  /announcements                   # Market announcements
GET  /search?q=                       # Global search
```

### Authenticated Endpoints
```
# Orders
POST   /orders                        # Place new order
GET    /orders                        # List user orders (paginated, filterable)
GET    /orders/{id}                   # Order detail
DELETE /orders/{id}                   # Cancel order

# Portfolio
GET    /portfolio                     # User holdings summary
GET    /portfolio/positions           # Detailed positions
GET    /portfolio/history             # Transaction history

# Wallet
GET    /wallet                        # Balance (TWD + assets)
POST   /wallet/deposit                # Initiate TWD deposit
POST   /wallet/withdraw               # Initiate TWD withdrawal
GET    /wallet/transactions           # Wallet transaction history

# Watchlist
GET    /watchlist                     # User watchlist
POST   /watchlist                     # Add to watchlist
DELETE /watchlist/{listing_id}        # Remove from watchlist

# Notifications
GET    /notifications                 # User notifications
PUT    /notifications/{id}/read       # Mark as read
PUT    /notifications/settings        # Notification preferences

# Revenue Sharing
GET    /distributions                 # Revenue sharing history
GET    /distributions/{id}            # Distribution detail

# Account
GET    /account/profile               # User profile
PUT    /account/profile               # Update profile
GET    /account/kyc/status            # KYC verification status
```

### Admin Endpoints (internal, role-gated)
```
# Listings Management
POST   /admin/listings                # Create listing
PUT    /admin/listings/{id}           # Update listing
PUT    /admin/listings/{id}/status    # Activate/suspend listing

# User Management
GET    /admin/users                   # List users
GET    /admin/users/{id}              # User detail
PUT    /admin/users/{id}/kyc          # Approve/reject KYC

# Market Operations
POST   /admin/market/halt             # Market-wide trading halt
POST   /admin/market/resume           # Resume trading
POST   /admin/circuit-breaker/config  # Update circuit breaker params

# Reports
GET    /admin/reports/daily           # Daily trading report
GET    /admin/reports/settlement      # Settlement report
GET    /admin/reports/regulatory      # FSC regulatory report
```

### API Standards
- JSON request/response bodies
- ISO 8601 timestamps with timezone (+08:00)
- Decimal strings for financial values (never floating point)
- Pagination: `?page=1&per_page=20` with `Link` headers
- Rate limiting: 100 req/min (public), 300 req/min (authenticated)
- Error format: `{ "error": { "code": "INSUFFICIENT_BALANCE", "message": "..." } }`
- API versioning via URL prefix (`/v1/`)

## Database Schema (Cloudflare D1 — SQLite)

> D1 uses SQLite. Financial values stored as TEXT (decimal strings, never float).
> If migrating to PostgreSQL via Hyperdrive (Phase 5), schema is compatible — only add RLS policies.

### Core Tables
```sql
-- Users
users (id TEXT PRIMARY KEY, email TEXT UNIQUE, phone TEXT, display_name TEXT, password_hash TEXT, kyc_level INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TEXT, updated_at TEXT)

-- KYC
kyc_applications (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), national_id_hash TEXT, document_type TEXT, document_r2_key TEXT, status TEXT DEFAULT 'pending', reviewer_id TEXT, reviewed_at TEXT, created_at TEXT)

-- Products & Listings
products (id TEXT PRIMARY KEY, type TEXT, name_tc TEXT, name_en TEXT, description_tc TEXT, description_en TEXT, status TEXT DEFAULT 'active')
listings (id TEXT PRIMARY KEY, product_id TEXT REFERENCES products(id), symbol TEXT UNIQUE, name_tc TEXT, name_en TEXT, total_units TEXT, available_units TEXT, unit_price TEXT, status TEXT DEFAULT 'active', listed_at TEXT)

-- Orders & Trades
orders (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), listing_id TEXT REFERENCES listings(id), side TEXT, type TEXT, quantity TEXT, price TEXT, stop_price TEXT, tif TEXT DEFAULT 'GTC', status TEXT DEFAULT 'pending', filled_qty TEXT DEFAULT '0', avg_fill_price TEXT, created_at TEXT)
trades (id TEXT PRIMARY KEY, listing_id TEXT REFERENCES listings(id), buy_order_id TEXT, sell_order_id TEXT, price TEXT, quantity TEXT, traded_at TEXT)

-- Wallet & Positions
wallets (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), currency TEXT DEFAULT 'TWD', available_balance TEXT DEFAULT '0', locked_balance TEXT DEFAULT '0')
positions (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), listing_id TEXT REFERENCES listings(id), quantity TEXT, avg_cost TEXT)
wallet_transactions (id TEXT PRIMARY KEY, wallet_id TEXT REFERENCES wallets(id), type TEXT, amount TEXT, reference_id TEXT, created_at TEXT)

-- Revenue Sharing
distributions (id TEXT PRIMARY KEY, listing_id TEXT REFERENCES listings(id), total_amount TEXT, per_unit_amount TEXT, record_date TEXT, payment_date TEXT, status TEXT DEFAULT 'pending')
distribution_payments (id TEXT PRIMARY KEY, distribution_id TEXT REFERENCES distributions(id), user_id TEXT REFERENCES users(id), units_held TEXT, amount TEXT, status TEXT DEFAULT 'pending', paid_at TEXT)

-- Audit (append-only — application enforces no UPDATE/DELETE)
audit_log (id TEXT PRIMARY KEY, user_id TEXT, action TEXT, entity_type TEXT, entity_id TEXT, details TEXT, ip_address TEXT, prev_hash TEXT, created_at TEXT)
```

### Indexes
```sql
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at);
CREATE INDEX idx_orders_listing_side ON orders(listing_id, side, price);
CREATE INDEX idx_trades_listing ON trades(listing_id, traded_at);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at);
CREATE INDEX idx_users_email ON users(email);
```

### Access Control
- Application-level enforcement: API routes filter by authenticated `user_id`
- Audit log: application code only issues INSERT (no UPDATE/DELETE handlers)
- Admin routes: role check in middleware before accessing any management endpoint
- If migrated to PostgreSQL (Phase 5): add Row-Level Security policies

## Infrastructure

### Deployment Architecture (Cloudflare-native)
```
┌───────────────────────────────────────────────────────────┐
│                   Cloudflare Platform                       │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Pages       │  │  Workers     │  │  Durable     │    │
│  │  (SvelteKit) │  │  (API routes)│  │  Objects     │    │
│  │  SSR + SSG   │  │  +server.ts  │  │  Matching    │    │
│  └──────┬───────┘  └──────┬───────┘  │  WebSocket   │    │
│         │                 │          └──────┬───────┘    │
│         │                 │                 │            │
│  ┌──────┴─────────────────┴─────────────────┴───────┐    │
│  │              Cloudflare Bindings                    │    │
│  ├────────┬────────┬────────┬──────────┤              │    │
│  │ D1     │ KV     │ R2     │ Queues   │              │    │
│  │ (SQL)  │ (cache)│ (files)│ (events) │              │    │
│  └────────┴────────┴────────┴──────────┘              │    │
└───────────────────────────────────────────────────────┘
```

### Hosting Strategy

**MVP (Phase 2-4): Cloudflare-only**

| Service | Cloudflare Product | What goes here |
|---------|-------------------|----------------|
| Database | D1 (location hint: `asia`) | Users, orders, trades, wallets, audit logs |
| Sessions | KV | JWT tokens, rate limiting counters |
| Files | R2 | KYC documents, reports |
| Matching | Durable Objects | In-memory orderbook, WebSocket connections |
| Events | Queues | Audit trail, distribution events |
| Portal | Pages + Workers | Public site, API routes, SSR |

**Production (Phase 5 — if FSC requires Taiwan-only hosting):**

| Service | Migration Target | Rationale |
|---------|-----------------|-----------|
| Database | Hyperdrive → GCP Cloud SQL PostgreSQL (`asia-east1`) | Data residency compliance |
| Files | R2 → GCP Cloud Storage (`asia-east1`) | KYC doc residency |
| Cache | KV → Upstash Redis (APAC) | Session management at scale |

> **Note**: API routes (`+server.ts`) remain on Cloudflare Workers — only the data layer migrates. No code changes needed thanks to Hyperdrive's PostgreSQL wire protocol compatibility.

### Monitoring & Observability
- **Metrics**: Cloudflare Analytics + Workers Analytics Engine
- **Logging**: Workers `console.log` → Cloudflare Logpush (or Tail Workers)
- **Alerting**: Cloudflare Notifications for error rate spikes
- **Uptime**: Cloudflare's 99.99% SLA for Workers

### Circuit Breakers
- Per-listing price band: ±10% from reference price
- Market-wide halt if >20% of listings hit circuit breaker
- Automatic cooldown period: 5 minutes
- Manual resume by admin for market-wide halt
