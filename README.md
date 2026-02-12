# TCEX - Taiwan Capital Exchange

A Taiwan-based financial asset exchange platform for SME revenue-sharing, regulated by Taiwan FSC.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Cloudflare Platform                            │
│                                                                     │
│  ┌─────────────────────┐     Service      ┌──────────────────────┐  │
│  │  Portal (Pages)     │     Binding       │  Engine (Worker)     │  │
│  │  SvelteKit SSR      │ ───────────────▶  │                      │  │
│  │                     │                   │  Matching Engine DO  │  │
│  │  • Public site      │                   │  (one per listing)   │  │
│  │  • Dashboard UI     │  ◀── WebSocket ── │                      │  │
│  │  • REST API routes  │                   │  • Order matching    │  │
│  │  • Auth (JWT + KV)  │                   │  • Orderbook state   │  │
│  │  • i18n (zh-TW/en)  │                   │  • WS broadcast      │  │
│  └─────────────────────┘                   └──────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Storage: D1 (SQLite) · KV (sessions) · R2 (KYC) · Queues   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
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
│   └── src/
│       ├── lib/components/ # OrderBook, OrderForm, TradeHistory, PriceChart, Header, Footer...
│       ├── lib/server/     # auth.ts, db.ts, wallet.ts, totp.ts, 2fa-guard.ts, email.ts, sms.ts, rate-limit.ts, kyc-rules.ts, line-oauth.ts
│       ├── lib/stores/     # websocket.ts, orderbook.ts, trades.ts
│       ├── lib/utils/      # decimal.ts (BigInt-based financial arithmetic)
│       ├── lib/types/      # wallet.ts, order.ts, portfolio.ts, trading.ts, auth.ts, kyc.ts
│       └── routes/         # Public pages + /dashboard/* + /api/v1/*
├── engine/                # Matching engine Worker (Cloudflare Workers + Durable Objects)
│   └── src/
│       ├── index.ts        # Worker entry, routes to DO stubs
│       ├── matching-engine.ts  # MatchingEngine DO (order matching + WebSocket broadcast)
│       ├── orderbook.ts    # In-memory orderbook (price-time priority, FIFO)
│       ├── types.ts        # Order, Trade, PriceLevel types
│       └── decimal.ts      # Decimal arithmetic (shared with portal)
├── migrations/            # D1 SQL migrations (users, trading, distributions, email verification, TOTP, KYC, LINE)
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

- **Framework**: SvelteKit 5 + Tailwind CSS v4 + Noto Sans TC + IBM Plex Mono
- **Portal Hosting**: Cloudflare Pages (SSR)
- **Engine Hosting**: Cloudflare Workers (Durable Objects for matching engine)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Sessions/Cache**: Cloudflare KV (JWT session store)
- **File Storage**: Cloudflare R2 (KYC documents)
- **Real-time**: Durable Objects WebSocket Hibernation API (one DO per listing)
- **Charts**: lightweight-charts (TradingView)
- **Financial Math**: Custom BigInt-based TEXT decimal arithmetic (no floating-point)
- **Queues**: Cloudflare Queues (async events, audit trail)
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

### Phase 2 — Auth + User System (DONE)

| Step | Task | Deliverable |
|------|------|-------------|
| 2.1 | Set up D1 database + users schema | Database foundation |
| 2.2 | API routes: register, login, logout (`/api/auth/*`) | Auth endpoints in SvelteKit |
| 2.3 | JWT sessions via KV + hooks.server.ts guard | Protected dashboard routes |
| 2.4 | JWT secret from env (`JWT_SECRET`), PBKDF2 password hashing | Security hardening |
| 2.5 | Email verification (6-digit OTP, rate-limited resend) | Email verify flow |
| 2.6 | 2FA TOTP (`otpauth` + Web Crypto, backup codes) | Setup/verify/disable + login-2fa flow |
| 2.7 | 2FA enforcement on orders, withdrawals, password change | Financial transaction security |
| 2.8 | KYC flow L0→L1→L2 (email → phone → ID + personal info) | Identity verification pipeline with auto-approve L1 |
| 2.9 | Phone verification (SMS OTP, rate-limited) | Phone verify for KYC L1 |
| 2.10 | KYC document upload to R2 | ID document storage |
| 2.11 | KYC gating (L2 for trading, L1 for withdrawals) | Level-based access control |
| 2.12 | LINE Login OAuth (auth, callback, link/unlink) | Social login for Taiwan users |
| 2.13 | Settings UI (profile, email verify, 2FA, KYC upgrade, LINE) | Full settings page |
| 2.14 | Login UI with 2FA step + LINE button | Enhanced login flow |
| 2.15 | KV-based rate limiter, error helpers, i18n for all new features | Shared utilities |
| 2.16 | User dashboard shell (layout, sidebar) | Authenticated area scaffold |

### Phase 3 — Trading Core (DONE)

| Step | Task | Deliverable |
|------|------|-------------|
| 3.1 | D1 schema: products, listings, orders, trades, wallets, positions, watchlist | Full database schema (8 trading tables, 15 seeded listings) |
| 3.2 | Listings API + Dashboard shell with sidebar | Product catalog, read-only APIs, dashboard overview |
| 3.3 | Wallet system (deposit/withdraw/balance/transactions) | Fund management with BigInt decimal arithmetic |
| 3.4 | Watchlist, Portfolio, Orders, Distributions, Settings pages | All dashboard pages functional |
| 3.5 | Matching engine (separate Worker + Durable Object per listing) | Price-time priority matching, partial fills, pre-trade risk checks |
| 3.6 | WebSocket via DO Hibernation API | Live orderbook + trade feed, auto-reconnect client |
| 3.7 | Trading UI (OrderBook, OrderForm, PriceChart, TradeHistory) | Full trading page with precision terminal aesthetic |

### Security Hardening (post Phase 2+3)

| Fix | Issue | Resolution |
|-----|-------|------------|
| Auth flow | Client stored JWT in sessionStorage, never sent to SSR | Switched to httpOnly cookie-based auth; hooks.server.ts reads from cookie |
| LINE 2FA bypass | LINE OAuth callback skipped 2FA check, leaked JWT in URL | Added totp_enabled check; tokens set as httpOnly cookies, never in URL |
| Engine rollback | Engine failure left orders stranded with locked funds | On engine error: mark order failed, unlock funds, audit log |
| Price improvement | Buy fills at better price left excess funds locked | After match, calculate actual cost vs locked amount, unlock difference |
| Wallet races | Concurrent withdraw/lock used read-then-write without CAS | Optimistic concurrency: conditional UPDATE WHERE balance = ? |
| JWT dev fallback | Missing JWT_SECRET silently fell back to known dev key | Fail-loud in production via `resolveJwtSecret()`, dev-only fallback |

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
