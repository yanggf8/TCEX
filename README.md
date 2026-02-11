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

## Next Steps

1. Initialize SvelteKit project with Tailwind + Cloudflare adapter + i18n
2. Build component library (StatCard, Header, Navigation, etc.)
3. Implement portal pages (homepage, markets, about)
4. Set up Go API gateway with auth middleware
5. Build matching engine prototype
6. Integrate WebSocket real-time data
7. KYC flow implementation
8. FSC sandbox application preparation
