# TCEX - Taiwan Capital Exchange

A Taiwan-based financial asset exchange platform for SME revenue-sharing, regulated by Taiwan FSC.

## Architecture

```
Portal (SvelteKit)  ←→  API Gateway (Go)  ←→  Core Engine (Rust/Go)
     │                        │                       │
     │                   WebSocket                    │
     │                        │                       │
     └── Cloudflare Pages ────┴── PostgreSQL / Redis / TimescaleDB
              (edge)                   (GCP Taiwan)
```

## Project Structure

```
TCEX/
├── PORTAL_SPEC.md         # Public website — navigation, homepage, components, i18n, performance
├── CORE_ENGINE.md         # Trading backend — matching engine, OMS, APIs, WebSocket, database
├── AUTH_SPEC.md           # Authentication — KYC/AML, user dashboard, LINE Login, 2FA
├── COMPLIANCE.md          # Regulatory — Taiwan FSC, data residency, audit trails, AML/CFT
├── SPEC.md                # Original reference spec (from MCEX analysis)
├── scraper.py             # Web scraper for MCEX reference data
├── mcex_scraped_data.json # Scraped structure and content
└── README.md              # This file
```

## Specification Overview

| Spec | Covers |
|------|--------|
| [PORTAL_SPEC.md](PORTAL_SPEC.md) | SvelteKit portal on Cloudflare, redesigned navigation (5 sections), homepage (trust-first), component library, i18n, SEO, performance targets |
| [CORE_ENGINE.md](CORE_ENGINE.md) | Matching engine, order management, clearing/settlement, REST + WebSocket APIs, database schema, infrastructure |
| [AUTH_SPEC.md](AUTH_SPEC.md) | Registration, KYC levels (0-3), LINE Login, 2FA, user dashboard (portfolio, orders, wallet, distributions) |
| [COMPLIANCE.md](COMPLIANCE.md) | FSC regulatory framework, data residency, WORM audit logging, AML/CFT, PDPA privacy, incident response |

## Key Design Decisions

1. **Separated architecture**: Portal (SvelteKit/Cloudflare) is decoupled from Trading Core (Rust/Go)
2. **Trust-first homepage**: FSC badges + market data upfront, no video hero
3. **WCAG 2.1 AA compliant**: Color contrast, keyboard navigation, ARIA patterns, prefers-reduced-motion
4. **Taiwan-native**: LINE Login, Minguo calendar, TWD formatting, National ID KYC
5. **Real-time via WebSocket**: `wss://api.tcex.tw/ws/v1` for market data + order updates
6. **Immutable audit trail**: Cryptographic hash chain, WORM logging, 10-year retention

## Key Differences from MCEX

| Aspect | MCEX (Macau) | TCEX (Taiwan) |
|--------|-------------|---------------|
| Region | Macau SAR | Taiwan |
| Currency | MOP | TWD |
| Regulator | AMCM | FSC (金管會) |
| Social | WeChat | LINE |
| UX | Legacy layout | Modern, trust-first, WCAG AA |
| Auth | Basic | KYC L0-L3, 2FA, LINE Login |

## Tech Stack

- **Portal**: SvelteKit, Tailwind CSS, Skeleton UI, Noto Sans TC
- **API Gateway**: Go (gin/fiber)
- **Matching Engine**: Rust or Go
- **Database**: PostgreSQL 16 (RLS), TimescaleDB, Redis 7
- **Message Queue**: NATS or Kafka
- **Search**: Meilisearch
- **Hosting**: GCP asia-east1 (Taiwan) — mandatory for financial data
- **Portal/CDN**: Cloudflare Pages + Workers (global edge)

## Roadmap (Solo Developer + CEO)

### Phase 1 — Public Portal (ship a live site first)

| Step | Task | Deliverable |
|------|------|-------------|
| 1.1 | Init SvelteKit + Tailwind + `adapter-cloudflare` | Project scaffold, dev server |
| 1.2 | Set up i18n (`zh-TW` / `en`) + Noto Sans TC font | Bilingual routing, translation files |
| 1.3 | Build shared layout: Header, Footer, MobileDrawer | Site-wide navigation |
| 1.4 | Build homepage: Hero, StatCard, ProductCard, TrustBadge | Trust-first landing page |
| 1.5 | Build static pages: About, Contact, Products, Rules | Content pages (prerendered) |
| 1.6 | Deploy to Cloudflare Pages | **Live URL to share with partners** |

### Phase 2 — Auth + User System

| Step | Task | Deliverable |
|------|------|-------------|
| 2.1 | Set up Go API gateway (REST, JWT) | Backend foundation on GCP Taiwan |
| 2.2 | Registration + login (email/password) | Basic auth flow |
| 2.3 | LINE Login OAuth | Social login for Taiwan users |
| 2.4 | 2FA (TOTP via Google Authenticator) | Mandatory for trading |
| 2.5 | KYC flow (L0→L1→L2: email → phone → ID) | Identity verification pipeline |
| 2.6 | User dashboard shell (layout, sidebar) | Authenticated area scaffold |

### Phase 3 — Trading Core

| Step | Task | Deliverable |
|------|------|-------------|
| 3.1 | PostgreSQL schema on GCP Taiwan | Database with RLS |
| 3.2 | Listings API (CRUD, search, detail) | Product catalog |
| 3.3 | Wallet (deposit/withdraw/balance) | Fund management |
| 3.4 | Order management (place, cancel, history) | Trading flow |
| 3.5 | Matching engine prototype | Price-time priority matching |
| 3.6 | WebSocket real-time data | Live orderbook + trade feed |
| 3.7 | Trading UI (chart, order entry, order book) | Full trading page |

### Phase 4 — Revenue Sharing + Compliance

| Step | Task | Deliverable |
|------|------|-------------|
| 4.1 | Distribution calculation + auto-payout | Revenue sharing engine |
| 4.2 | Audit trail (WORM logging, hash chain) | Immutable transaction log |
| 4.3 | AML transaction monitoring | Suspicious activity detection |
| 4.4 | Regulatory reporting (FSC format, Minguo calendar) | Compliance reports |
| 4.5 | FSC sandbox application | **Regulatory approval process**|
