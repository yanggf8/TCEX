# TCEX - Taiwan Capital Exchange

A Taiwan-based financial asset exchange platform for SME revenue-sharing, regulated by Taiwan FSC.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Cloudflare Platform                     │
├──────────────┬──────────────┬──────────────┬──────────────┤
│  Portal      │  API Routes  │  Workers     │  Storage     │
│  (SvelteKit) │  (+server.ts)│  (WebSocket) │              │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Public site  │ REST API     │ Real-time    │ D1 (SQLite)  │
│ SSG/SSR      │ Auth/Rate    │ Orderbook    │ KV (sessions)│
│ i18n         │ limiting     │ Trade feed   │ R2 (KYC docs)│
│ SEO          │ JWT hooks    │ Durable Obj  │ Queues       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

## Project Structure

```
TCEX/
├── PORTAL_SPEC.md         # Public website — navigation, homepage, components, i18n, performance
├── CORE_ENGINE.md         # Trading backend — matching engine, OMS, APIs, WebSocket, database
├── AUTH_SPEC.md           # Authentication — KYC/AML, user dashboard, LINE Login, 2FA
├── COMPLIANCE.md          # Regulatory — Taiwan FSC, data residency, audit trails, AML/CFT
├── SPEC.md                # Original reference spec (from MCEX analysis, archived)
├── portal/                # SvelteKit app (Cloudflare Pages + Workers)
├── scraper.py             # Web scraper for MCEX reference data
├── mcex_scraped_data.json # Scraped structure and content
└── README.md              # This file
```

## Specification Overview

| Spec | Covers |
|------|--------|
| [PORTAL_SPEC.md](PORTAL_SPEC.md) | SvelteKit portal on Cloudflare, navigation, homepage, component library, i18n, SEO, performance targets |
| [CORE_ENGINE.md](CORE_ENGINE.md) | Matching engine, order management, clearing/settlement, REST + WebSocket APIs, database schema, infrastructure |
| [AUTH_SPEC.md](AUTH_SPEC.md) | Registration, KYC levels (0-3), LINE Login, 2FA, user dashboard (portfolio, orders, wallet, distributions) |
| [COMPLIANCE.md](COMPLIANCE.md) | FSC regulatory framework, data residency, WORM audit logging, AML/CFT, PDPA privacy, incident response |

## Key Design Decisions

1. **Cloudflare-native**: Entire stack on Cloudflare — Pages, Workers, D1, KV, R2, Durable Objects
2. **Single codebase**: SvelteKit handles both public portal and API routes (`+server.ts`)
3. **Trust-first homepage**: FSC badges + market data upfront, no video hero
4. **WCAG 2.1 AA compliant**: Color contrast, keyboard navigation, ARIA patterns, prefers-reduced-motion
5. **Taiwan-native**: LINE Login, Minguo calendar, TWD formatting, National ID KYC
6. **Real-time via WebSocket**: Durable Objects for market data + order updates
7. **Immutable audit trail**: Cryptographic hash chain, append-only D1 table, 10-year retention

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

- **Framework**: SvelteKit + Tailwind CSS + Noto Sans TC
- **Hosting**: Cloudflare Pages + Workers
- **Database**: Cloudflare D1 (SQLite at edge)
- **Sessions/Cache**: Cloudflare KV
- **File Storage**: Cloudflare R2 (KYC documents)
- **Real-time**: Cloudflare Durable Objects (WebSocket)
- **Queues**: Cloudflare Queues (async events, audit trail)
- **Search**: D1 FTS5 (full-text search) or Meilisearch (if needed)
- **Data Residency**: D1 location hint `asia` + R2 in APAC. If FSC requires Taiwan-only hosting, migrate to Hyperdrive + external PostgreSQL in GCP `asia-east1`

## Roadmap (Solo Developer + CEO)

### Phase 1 — Public Portal (DONE)

| Step | Task | Deliverable |
|------|------|-------------|
| 1.1 | Init SvelteKit + Tailwind + `adapter-cloudflare` | Project scaffold, dev server |
| 1.2 | Set up i18n (`zh-TW` / `en`) + Noto Sans TC font | Store-based locale switching |
| 1.3 | Build shared layout: Header, Footer, MobileDrawer | Site-wide navigation |
| 1.4 | Build homepage: Hero, Stats, Features, Trust, Market Reach, Updates | Trust-first landing page |
| 1.5 | Build content pages: Products, Market, Rules, About, Contact, Login, Register | All routes with i18n |
| 1.6 | Deploy to Cloudflare Pages | **Live URL: tcex-portal.pages.dev** |

### Phase 2 — Auth + User System (Cloudflare-native)

| Step | Task | Deliverable |
|------|------|-------------|
| 2.1 | Set up D1 database + users schema | Database foundation |
| 2.2 | API routes: register, login, logout (`/api/auth/*`) | Auth endpoints in SvelteKit |
| 2.3 | JWT sessions via KV + hooks.server.ts guard | Protected dashboard routes |
| 2.4 | LINE Login OAuth | Social login for Taiwan users |
| 2.5 | 2FA (TOTP via Google Authenticator) | Mandatory for trading |
| 2.6 | KYC flow (L0→L1→L2: email → phone → ID) | Identity verification pipeline |
| 2.7 | User dashboard shell (layout, sidebar) | Authenticated area scaffold |

### Phase 3 — Trading Core (Cloudflare-native)

| Step | Task | Deliverable |
|------|------|-------------|
| 3.1 | D1 schema: products, listings, orders, trades, wallets | Full database schema |
| 3.2 | Listings API (CRUD, search, detail) | Product catalog |
| 3.3 | Wallet (deposit/withdraw/balance) | Fund management |
| 3.4 | Order management (place, cancel, history) | Trading flow |
| 3.5 | Matching engine (Durable Object) | Price-time priority matching |
| 3.6 | WebSocket real-time data (Durable Object) | Live orderbook + trade feed |
| 3.7 | Trading UI (chart, order entry, order book) | Full trading page |

### Phase 4 — Revenue Sharing + Compliance

| Step | Task | Deliverable |
|------|------|-------------|
| 4.1 | Distribution calculation + auto-payout | Revenue sharing engine |
| 4.2 | Audit trail (append-only D1, hash chain) | Immutable transaction log |
| 4.3 | AML transaction monitoring | Suspicious activity detection |
| 4.4 | Regulatory reporting (FSC format, Minguo calendar) | Compliance reports |
| 4.5 | FSC sandbox application | **Regulatory approval process** |

### Phase 5 — Production Hardening (if FSC requires dedicated infra)

| Step | Task | Deliverable |
|------|------|-------------|
| 5.1 | Migrate D1 → Hyperdrive + GCP Cloud SQL PostgreSQL | Taiwan data residency |
| 5.2 | Migrate R2 → GCP Cloud Storage (asia-east1) | KYC doc residency |
| 5.3 | Add Redis (Upstash or GCP Memorystore) | Session cache, pub/sub |
| 5.4 | Penetration testing + security audit | FSC compliance requirement |
