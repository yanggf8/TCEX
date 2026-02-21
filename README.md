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
│  │  • Admin panel      │                   │  • Order matching    │  │
│  │  • REST API routes  │                   │  • Orderbook state   │  │
│  │  • Auth (JWT + KV)  │                   │  • WS broadcast      │  │
│  │  • i18n (zh-TW/en)  │                   └──────────────────────┘  │
│  └─────────────────────┘                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Storage: D1 (SQLite) · KV (sessions/rate-limit) · R2 (KYC) │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
TCEX/
├── README.md
├── AUDIT_REPORT.md        # Full feature audit (10 areas, current status)
├── CEO_OVERVIEW.md        # Non-technical platform overview (Chinese)
├── OPERATIONS.md          # Operations guide for launch (Chinese)
├── PORTAL_SPEC.md         # Public website spec
├── CORE_ENGINE.md         # Trading backend spec
├── AUTH_SPEC.md           # Authentication + KYC spec
├── COMPLIANCE.md          # Regulatory compliance spec
├── portal/                # SvelteKit app (Cloudflare Pages + Workers)
│   ├── migrations/        # D1 SQL migrations (0001–0010)
│   └── src/
│       ├── lib/
│       │   ├── components/    # OrderBook, OrderForm, TradeHistory, PriceChart, Header, Footer
│       │   ├── server/        # auth.ts, db.ts, wallet.ts, totp.ts, 2fa-guard.ts,
│       │   │                  # email.ts, notifications.ts, sms.ts, rate-limit.ts,
│       │   │                  # kyc-rules.ts, line-oauth.ts, order-validation.ts
│       │   ├── stores/        # websocket.ts, orderbook.ts, trades.ts
│       │   ├── utils/         # decimal.ts (BigInt-based financial arithmetic), i18n.ts
│       │   └── types/         # wallet.ts, order.ts, portfolio.ts, trading.ts, auth.ts, kyc.ts
│       └── routes/
│           ├── +page.svelte           # Homepage (live market stats from D1)
│           ├── dashboard/             # Portfolio, orders, wallet, distributions, settings
│           │   └── trade/[listing_id] # Trading page (WebSocket orderbook + chart)
│           ├── admin/                 # Admin panel (DB role check, not JWT)
│           │   ├── +page             # Overview: users, pending KYC, trades, active orders
│           │   ├── kyc/              # L2 review: approve/reject + inline document preview
│           │   ├── users/            # Search, freeze/unfreeze, mock deposit
│           │   ├── listings/         # Create listing, toggle active/suspended
│           │   └── distributions/    # Pro-rata revenue distribution engine
│           ├── api/v1/
│           │   ├── auth/             # register, login, logout, 2fa, google, line
│           │   ├── kyc/              # phone OTP, L2 application, document upload
│           │   ├── orders/           # place, cancel, list
│           │   ├── wallet/           # deposit, withdraw, transactions
│           │   ├── listings/         # list, orderbook
│           │   └── admin/            # kyc review, user status, listings CRUD,
│           │                         # distributions, mock deposit, document proxy
│           └── ws/v1/listing/[id]/   # WebSocket proxy → ENGINE service binding
└── engine/                # Matching engine Worker (Cloudflare Workers + Durable Objects)
    └── src/
        ├── index.ts            # Worker entry, routes /ws/* and /v1/* to DO stubs
        ├── matching-engine.ts  # MatchingEngine DO: order matching + WebSocket broadcast
        ├── orderbook.ts        # In-memory orderbook (price-time priority, FIFO)
        ├── types.ts            # Order, Trade, PriceLevel, OrderBookSnapshot
        └── decimal.ts          # Decimal arithmetic
```

## Current Status

### ✅ Fully Working

| Area | Details |
|------|---------|
| Auth | Email register/login, PBKDF2, 2FA TOTP, account lockout, httpOnly JWT cookies |
| OAuth | Google Login (new account auto-create or link), LINE Login (code complete, **env vars required**) |
| KYC | L0→L1 auto (email + phone), L1→L2 manual review, R2 document upload + inline admin preview |
| Wallet | Mock deposit (admin one-click), withdrawal (KYC L1 + 2FA gate), transaction history |
| Trading | Limit orders, price-time priority matching DO, order cancel, engine rollback, price improvement refund |
| WebSocket | Portal proxy route → ENGINE service binding → DO; initial snapshot + live broadcast |
| Dashboard | Portfolio, orders, wallet, watchlist, distributions, settings, recent activity (live from DB) |
| Admin | KYC review, user management (freeze/mock deposit), listings management, revenue distributions |
| Notifications | Email via Resend: KYC result, distribution credit, withdrawal confirmation (non-blocking) |
| Homepage | Live market stats (volume, listings, users, distributions) from D1 |

### ⚠️ Coded But Requires External Setup

| Feature | What's Missing |
|---------|---------------|
| LINE Login | Set `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_REDIRECT_URI` in Cloudflare env vars |
| Phone SMS OTP | OTP logic complete; integrate Twilio (`TWILIO_*` env vars) to actually send SMS |

### 🔲 Not Yet Built

- Market orders (engine supports, frontend/backend hardcoded to limit)
- Bank API auto-reconciliation for deposits (玉山/台新)
- LINE push notifications (email notifications live)
- AML auto-detection engine (rules designed)
- FSC regulatory reports

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Random string ≥ 32 chars for JWT signing |
| `RESEND_API_KEY` | Resend email service API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://tcex-portal.pages.dev/api/v1/auth/google/callback` |
| `LINE_CHANNEL_ID` | LINE Login channel ID *(optional — LINE Login disabled without this)* |
| `LINE_CHANNEL_SECRET` | LINE Login channel secret |
| `LINE_REDIRECT_URI` | `https://tcex-portal.pages.dev/api/v1/auth/line/callback` |

## Key Design Decisions

1. **Cloudflare-native**: Entire stack on Cloudflare — Pages, Workers, D1, KV, R2, Durable Objects
2. **Single codebase**: SvelteKit handles both public portal and API routes (`+server.ts`)
3. **Admin role from DB**: Admin APIs always query `role` from D1, never trust JWT claims
4. **Financial precision**: All monetary values stored as `TEXT` decimal strings; custom BigInt arithmetic
5. **Non-blocking notifications**: All email sends wrapped in try/catch — failures logged, never break main flow
6. **WebSocket via proxy**: Portal's `/ws/v1/listing/[id]` proxies to ENGINE service binding → DO
7. **Taiwan-native**: LINE Login, TWD formatting, National ID KYC, Minguo calendar

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes) + Tailwind CSS v4
- **Fonts**: Noto Sans TC (user-facing) + IBM Plex Mono (admin panel)
- **Portal Hosting**: Cloudflare Pages (SSR via `@sveltejs/adapter-cloudflare`)
- **Engine Hosting**: Cloudflare Workers + Durable Objects (Hibernation API)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Sessions/Rate-limit**: Cloudflare KV
- **File Storage**: Cloudflare R2 (KYC documents, admin proxy endpoint)
- **Email**: Resend API
- **Charts**: lightweight-charts (TradingView library)
- **Financial Math**: Custom BigInt-based TEXT decimal arithmetic (no floating-point)

## Key Differences from MCEX

| Aspect | MCEX (Macau) | TCEX (Taiwan) |
|--------|-------------|---------------|
| Region | Macau SAR | Taiwan |
| Currency | MOP | TWD |
| Regulator | AMCM | FSC (金管會) |
| Social | WeChat | LINE |
| UX | Legacy layout | Modern, trust-first |
| Auth | Basic | KYC L0-L2, 2FA, Google + LINE OAuth |

## Documentation

| File | Contents |
|------|---------|
| `AUDIT_REPORT.md` | Full feature audit — what works, what's stubbed, pending items |
| `CEO_OVERVIEW.md` | Non-technical overview in Chinese — platform purpose, roadmap, features |
| `OPERATIONS.md` | Operations playbook in Chinese — admin setup, KYC review, deposits, distributions |
| `PORTAL_SPEC.md` | Public website specification |
| `CORE_ENGINE.md` | Trading engine specification |
| `AUTH_SPEC.md` | Auth + KYC specification |
| `COMPLIANCE.md` | FSC regulatory compliance specification |
