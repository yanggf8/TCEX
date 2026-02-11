# TCEX Portal — Website Specification

## Overview
The SvelteKit application for Taiwan Capital Exchange, deployed on **Cloudflare Pages + Workers**. This is a **single codebase** serving both:
- **Public pages** (`/`, `/markets`, `/about`, etc.) — unauthenticated, read-only
- **Authenticated pages** (`/dashboard/*`) — protected by auth hooks, route-level separation

The public pages are specified in this document. The authenticated dashboard pages (portfolio, orders, wallet, etc.) are specified in `AUTH_SPEC.md`. Trading logic, matching, and settlement are handled by the backend services specified in `CORE_ENGINE.md`.

### Deployment Boundary
Both public and authenticated pages ship as one SvelteKit app on Cloudflare Pages. Auth is enforced via SvelteKit `hooks.server.ts` — the `handle` hook checks JWT validity on `/dashboard/*` routes and redirects unauthenticated users to login. The backend API (Go) is a separate deployment on GCP.

### Tech Stack (Portal)
- **Framework**: SvelteKit (with `@sveltejs/adapter-cloudflare`)
- **Styling**: Tailwind CSS
- **UI Components**: Skeleton UI or Melt UI (headless)
- **Deployment**: Cloudflare Pages + Workers
- **i18n**: `sveltekit-i18n` or `paraglide-js`
- **Charts**: lightweight-charts (TradingView open-source)

## Rendering Strategy

| Page Type | Strategy | Examples |
|-----------|----------|---------|
| Static content | **Prerendered** (`export const prerender = true`) | About, Rules, CSR, Careers, Contact |
| Frequently updated | **SSR on Cloudflare Workers** (with `stale-while-revalidate` cache headers) | Blog, Media Center, Market Communications |
| Real-time data | **SSR + Client hydration** (load function + WebSocket on client) | Homepage stats, Listings overview |
| Authenticated | **CSR** (client-only, auth-gated via hooks) | Dashboard, Portfolio, Orders, Wallet (see `AUTH_SPEC.md`) |

## Navigation Structure (Revised)

### Primary Navigation (5 sections + user menu)
Reduced from 7 sections to 5 for lower cognitive load.

1. **市場** (Markets)
   - 總覽 (Overview) — real-time stats dashboard
   - 產品介紹 (Products) — RBO, SPV, SPAC, ETF
   - 掛牌資訊 (Listings) — current listings, how to list
   - 交易日曆 (Trading Calendar)
   - 交易時間 (Trading Hours)
   - 費用 (Fees)

2. **服務** (Services)
   - 登記與託管 (Registration & Custody)
   - 清算與結算 (Clearing & Settlement)
   - 業績參數 (Performance Parameters)
   - 第三方信用評級 (Third-party Credit Rating)
   - 跨境資金通道 (Cross-border Funding Channels)
   - 估值方法 (Valuation Methods)
   - 稅務處理 (Tax Treatment)

3. **資源** (Resources)
   - 規則與監管 (Rules & Regulations)
   - 市場通訊 (Market Communications)
   - 市場支持 (Market Support)
   - 檔案下載 (Document Downloads)

4. **關於** (About)
   - 關於 TCEX (About TCEX)
   - 創始人網誌 (Founder's Blog) — moved here from homepage
   - 媒體中心 (Media Center)
   - 招聘 (Careers)
   - 企業社會責任 (CSR)
   - 財務報告 (Financial Reports)
   - 聯絡我們 (Contact)

5. **搜尋** (Search) — global search icon

### User Menu (top-right, separate from main nav)
- 登入 / 註冊 (Login / Register) — unauthenticated state
- 我的帳戶 (My Account) — authenticated state (links to dashboard in AUTH_SPEC)
- 語言切換 (Language Toggle) — 繁中 / EN

### Mobile Navigation
- Hamburger menu → full-screen drawer
- Accordion-style section expansion
- User menu items at top of drawer
- Language toggle in drawer footer
- Search bar at top of drawer

## Homepage Redesign

### Section Order (revised for financial credibility)

#### 1. Hero Section
- **No video background** — use optimized static image with subtle CSS animation (gradient shift or parallax)
- Platform name + one-line mission statement
- Primary CTA: "開始交易" (Start Trading) → login/register
- Secondary CTA: "了解更多" (Learn More) → Markets overview
- Trust bar below hero: FSC license number, ISO 27001 badge, encryption badge

#### 2. Live Market Statistics
- 4 primary metric cards (responsive: 2×2 mobile → 4-col desktop)
- Metrics:
  - 當日交易量 (Daily Trading Volume) — TWD
  - 累計融資金額 (Cumulative Financing) — TWD
  - 活躍掛牌數 (Active Listings) — count
  - 當日收入分成 (Daily Revenue Sharing) — TWD
- Data cutoff timestamp
- Subtle pulse animation on data refresh
- Link: "查看完整市場數據" (View Full Market Data)

#### 3. Product Highlights
- 3-card layout: RBO, SPV, SPAC
- Each card: icon, title, one-line description, "了解更多" link
- Replaces the old "Cumulative Listings" section with more actionable content

#### 4. Trust & Credibility
- Regulatory status: "受台灣金管會監管" (Regulated by Taiwan FSC)
- Key numbers: years of operation, total investors, cumulative transactions
- Partner logos row (banks, auditors, custodians)
- Security certifications

#### 5. Market Map (simplified)
- Interactive map showing geographic distribution of underlying assets
- Hover/tap for region details
- Lazy-loaded (below fold)

#### 6. Latest Updates
- 2-3 latest market communications or announcements
- Link to full Resources section
- Empty state: "目前無最新公告" (No recent announcements)

### Footer
- **Column 1**: TCEX logo + brief description + FSC license info
- **Column 2**: Quick links (Markets, Services, Resources, About)
- **Column 3**: Contact info (email, phone +886 format, address)
- **Column 4**: Social links (LINE, LinkedIn) + newsletter signup
- **Bottom bar**: Copyright © 2026 TCEX | 免責聲明 (Disclaimer) | 使用條款 (Terms) | 隱私政策 (Privacy)
- reCAPTCHA notice
- Risk disclosure: "投資有風險，入市需謹慎" (Investment involves risk)

## Component Library

### Layout Components
| Component | Description |
|-----------|-------------|
| `PageLayout` | Base layout with header, main, footer |
| `Container` | Max-width wrapper (1280px) with responsive padding |
| `Section` | Vertical section with configurable padding |
| `Grid` | Responsive CSS Grid wrapper |

### Navigation Components
| Component | Description |
|-----------|-------------|
| `Header` | Sticky header, solid background (no transparency — readability first) |
| `NavBar` | Desktop horizontal navigation with dropdowns |
| `MobileDrawer` | Full-screen slide-in menu |
| `Breadcrumb` | Page hierarchy indicator |
| `LanguageToggle` | 繁中 / EN switch |

### Content Components
| Component | Description |
|-----------|-------------|
| `StatCard` | Metric display with label, value, trend indicator |
| `ProductCard` | Product overview with icon, title, description, CTA |
| `TrustBadge` | Regulatory/certification badge |
| `AnnouncementCard` | Title, date, excerpt, link |
| `MapVisualization` | Interactive geographic asset map |
| `Accordion` | Collapsible content sections |
| `DataTable` | Sortable, paginated table for listings |

### Form Components
| Component | Description |
|-----------|-------------|
| `SearchBar` | Global search with autocomplete |
| `ContactForm` | reCAPTCHA-protected contact form |
| `NewsletterSignup` | Email subscription |

## Internationalization (i18n)

### Strategy
- Use `sveltekit-i18n` or `paraglide-js` (Inlang)
- URL pattern: `/zh-TW/...` (Traditional Chinese), `/en/...` (English)
- Default locale: `zh-TW` (BCP-47 standard for Traditional Chinese, Taiwan)
- Hreflang mapping: `zh-TW` → `<link rel="alternate" hreflang="zh-TW">`, `en` → `<link rel="alternate" hreflang="en">`
- All static text in JSON translation files (`zh-TW.json`, `en.json`)
- Content from CMS delivered in both languages

### Formatting Rules
| Type | 繁中 | English |
|------|------|---------|
| Currency | NT$1,234 | TWD 1,234 |
| Large numbers | 57.75億 | 5.775B |
| Date | 2026年2月10日 | Feb 10, 2026 |
| Date (regulatory) | 民國115年2月10日 | Feb 10, 2026 |
| Phone | +886-2-XXXX-XXXX | +886-2-XXXX-XXXX |
| Percentage | 5.2% | 5.2% |

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | No video hero, optimized images (WebP/AVIF), font preload |
| INP | < 200ms | Minimal JS on initial load, code splitting, avoid long tasks |
| CLS | < 0.1 | Fixed dimensions for stat cards, font-display: swap |
| TTFB | < 200ms | Cloudflare Workers edge-side rendering, global PoP |
| Bundle size | < 200KB gzip | Tree-shaking, dynamic imports for map/charts |

> Note: INP (Interaction to Next Paint) replaced FID as a Core Web Vital in March 2024.

## SEO Requirements
- Semantic HTML5 structure
- Structured data (JSON-LD): Organization, FinancialProduct
- Open Graph + Twitter Card meta tags
- Sitemap.xml (auto-generated)
- robots.txt
- Canonical URLs for bilingual pages
- Hreflang tags for language alternates

## Accessibility (WCAG 2.1 AA)

All pages must comply with WCAG 2.1 Level AA. This is not optional — financial platforms face legal risk for non-compliance.

### Color & Contrast
- All text must meet 4.5:1 contrast ratio (normal text) or 3:1 (large text, ≥18px bold / ≥24px regular)
- Interactive elements (links, buttons) must have 3:1 contrast against adjacent colors
- Color must not be the sole means of conveying information (e.g., red/green for gain/loss must also use icons or text labels)

### Keyboard Navigation
- All interactive elements must be reachable and operable via keyboard (Tab, Enter, Escape, Arrow keys)
- Visible focus indicator on all focusable elements (minimum 2px outline, 3:1 contrast)
- Logical tab order matching visual layout
- Skip-to-content link as first focusable element
- Dropdown menus: Arrow keys to navigate, Escape to close, Enter to select
- Modal dialogs: focus trap while open, return focus to trigger on close
- DataTable: keyboard-navigable rows with sort controls

### ARIA Patterns
- Navigation: `role="navigation"` with `aria-label` per nav region
- Statistics cards: `aria-live="polite"` for real-time data updates (not `assertive` — avoid interrupting screen readers)
- Accordion: `aria-expanded`, `aria-controls` on triggers
- Mobile drawer: `role="dialog"`, `aria-modal="true"`, focus trap
- Loading states: `aria-busy="true"` on containers, `role="status"` for skeleton screens
- Data tables: proper `<th scope>` and `<caption>` elements
- Language toggle: `aria-current` on active language

### Motion & Animation
- All animations must respect `prefers-reduced-motion: reduce`:
  - Hero parallax/gradient shift → static image
  - Stat card pulse animation → instant update with no animation
  - Map interactions → static view with click-to-expand
  - Page transitions → instant swap
- No auto-playing animations that cannot be paused
- No content that flashes more than 3 times per second

### Screen Reader
- Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`)
- All images have descriptive `alt` text (or `alt=""` for decorative)
- Form inputs have associated `<label>` elements
- Error messages linked to inputs via `aria-describedby`
- Page titles update on route change (`<title>` reflects current page)
- Real-time data: use `aria-live` regions, not DOM replacement, for stat updates

### Testing Requirements
- Automated: axe-core in CI pipeline (zero violations for AA)
- Manual: keyboard-only navigation test for all user flows
- Screen reader: test with VoiceOver (macOS/iOS) and NVDA (Windows)
- Audit: annual third-party WCAG audit

## Error & Loading States

| State | Treatment |
|-------|-----------|
| Page loading | Skeleton screens matching final layout |
| Data loading | Pulse animation on stat cards |
| Data error | "資料暫時無法載入，請稍後再試" + retry button |
| 404 | Custom page with search bar + popular links |
| 500 | Minimal error page with contact info |
| Empty list | Contextual message + suggested action |
| Offline | Banner: "網路連線中斷" with cached content |
