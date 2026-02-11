# TCEX Core Engine — Trading Backend Specification

## Overview
The backend trading infrastructure for Taiwan Capital Exchange. This system handles order management, matching, clearing/settlement, and real-time data distribution. **Completely separate** from the public portal (Next.js).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TCEX Architecture                         │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Portal      │  Trading     │  Core        │  Data              │
│  (SvelteKit) │  Gateway     │  Engine      │  Pipeline          │
│              │  (API GW)    │  (Rust/Go)   │                    │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Public site  │ REST API     │ Matching     │ PostgreSQL         │
│ SSG/SSR      │ WebSocket    │ OMS          │ Redis              │
│ i18n         │ Auth/Rate    │ Risk Mgmt    │ TimescaleDB        │
│ SEO          │ limiting     │ Settlement   │ Event Store        │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Matching Engine | **Rust** or **Go** | Sub-millisecond latency, memory safety |
| API Gateway | **Go** (gin/fiber) | High concurrency, efficient WebSocket handling |
| Database (transactional) | **PostgreSQL 16** | ACID compliance, Row-Level Security, JSONB |
| Database (time-series) | **TimescaleDB** | Price history, OHLCV candles, analytics |
| Cache / Pub-Sub | **Redis 7** | Real-time stats, session store, event pub/sub |
| Message Queue | **NATS** or **Kafka** | Event-driven architecture, audit trail |
| Object Storage | **S3-compatible** | Documents, KYC files, reports |
| Search | **Meilisearch** | Listing search, document search |

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
wss://api.tcex.tw/ws/v1
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
https://api.tcex.tw/v1
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

## Database Schema (PostgreSQL)

### Core Tables
```sql
-- Users
users (id, email, phone, display_name, kyc_level, status, created_at, updated_at)

-- KYC
kyc_applications (id, user_id, national_id_hash, document_type, status, reviewer_id, reviewed_at)

-- Products & Listings
products (id, type, name_tc, name_en, description_tc, description_en, status)
listings (id, product_id, symbol, name_tc, name_en, total_units, available_units, unit_price, status, listed_at)

-- Orders & Trades
orders (id, user_id, listing_id, side, type, quantity, price, stop_price, tif, status, filled_qty, avg_fill_price, created_at)
trades (id, listing_id, buy_order_id, sell_order_id, price, quantity, traded_at)

-- Wallet & Positions
wallets (id, user_id, currency, available_balance, locked_balance)
positions (id, user_id, listing_id, quantity, avg_cost, unrealized_pnl)
wallet_transactions (id, wallet_id, type, amount, reference_id, created_at)

-- Revenue Sharing
distributions (id, listing_id, total_amount, per_unit_amount, record_date, payment_date, status)
distribution_payments (id, distribution_id, user_id, units_held, amount, status, paid_at)

-- Audit
audit_log (id, user_id, action, entity_type, entity_id, details_jsonb, ip_address, created_at)
```

### Indexes
- `orders`: composite on (user_id, status, created_at), (listing_id, side, price) for order book
- `trades`: composite on (listing_id, traded_at) for trade feed
- `audit_log`: composite on (entity_type, entity_id, created_at) — append-only, no deletes

### Row-Level Security
- Users can only access their own orders, positions, wallet
- Admin roles bypass RLS for management endpoints
- Audit log is append-only (no UPDATE/DELETE permissions)

## Infrastructure

### Deployment Architecture
```
                    ┌─────────────┐
                    │  CloudFlare  │
                    │  CDN + WAF   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
        │  Portal    │ │  API   │ │  WS      │
        │ (SvelteKit)│ │  GW    │ │  Server  │
        │ CF Pages   │ │  (Go)  │ │  (Go)    │
        └────────────┘ └───┬────┘ └────┬─────┘
                           │           │
                    ┌──────┴───────────┴──────┐
                    │     Internal Network      │
                    ├────────┬────────┬─────────┤
                    │ Match  │ Redis  │ NATS/   │
                    │ Engine │        │ Kafka   │
                    │ (Rust) │        │         │
                    └────┬───┴───┬────┴────┬────┘
                         │       │         │
                    ┌────┴───┐ ┌─┴──┐ ┌───┴────┐
                    │ Postgres│ │TS  │ │ S3     │
                    │        │ │ DB │ │        │
                    └────────┘ └────┘ └────────┘
```

### Hosting (Taiwan Data Residency — Compliance Gate)

> **COMPLIANCE REQUIREMENT** (see `COMPLIANCE.md`): All primary financial data
> (orders, trades, wallets, KYC, audit logs) **must** be hosted in Taiwan or
> FSC-approved jurisdictions. This is non-negotiable for regulatory approval.

| Tier | Hosting | What goes here |
|------|---------|----------------|
| **Financial data** (mandatory Taiwan) | GCP `asia-east1` (Changhua, Taiwan) | PostgreSQL, TimescaleDB, Redis, S3 (KYC docs), audit logs |
| **Compute** (mandatory Taiwan) | GCP `asia-east1` | Matching engine, API gateway, WebSocket server |
| **Portal / CDN** (global edge OK) | Cloudflare Pages + Workers | Public website, static assets, edge caching |
| **DR / backup** | GCP `asia-east2` (Hong Kong) or secondary Taiwan DC | Cross-region replication, encrypted snapshots |

- Database: GCP Cloud SQL for PostgreSQL (Taiwan region), encrypted at rest
- Backup: Daily snapshots, 90-day retention, encrypted, same jurisdiction
- **AWS Tokyo is NOT approved** for primary financial data unless explicitly cleared by FSC

### Monitoring & Observability
- **Metrics**: Prometheus + Grafana (latency, throughput, error rates)
- **Logging**: Structured JSON logs → ELK stack or Loki
- **Tracing**: OpenTelemetry distributed tracing
- **Alerting**: PagerDuty for P1 (matching engine down, settlement failure)
- **Uptime**: 99.95% SLA during trading hours

### Circuit Breakers
- Per-listing price band: ±10% from reference price
- Market-wide halt if >20% of listings hit circuit breaker
- Automatic cooldown period: 5 minutes
- Manual resume by admin for market-wide halt
