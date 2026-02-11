# TCEX Portal — Public Website Specification

## Overview
The public-facing marketing and information portal for Taiwan Capital Exchange. Built with Next.js, this is the **read-only** layer — it does not handle trading, order management, or authenticated user flows (see `AUTH_SPEC.md` and `CORE_ENGINE.md`).

## Rendering Strategy

| Page Type | Strategy | Examples |
|-----------|----------|---------|
| Static content | **SSG** (build-time) | About, Rules, CSR, Careers, Contact |
| Frequently updated | **ISR** (revalidate 60s) | Blog, Media Center, Market Communications |
| Real-time data | **SSR + Client hydration** | Homepage stats, Listings overview |
| User-specific | **CSR** (client-only) | Dashboard, Portfolio (via AUTH_SPEC) |

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
- Use `next-intl` or `next-i18next`
- URL pattern: `/tc/...` (Traditional Chinese), `/en/...` (English)
- Default locale: `tc` (Traditional Chinese)
- All static text in JSON translation files
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
| FID | < 100ms | Minimal JS on initial load, code splitting |
| CLS | < 0.1 | Fixed dimensions for stat cards, font-display: swap |
| TTI | < 3.5s | SSG for static pages, lazy-load below-fold content |
| Bundle size | < 200KB gzip | Tree-shaking, dynamic imports for map/charts |

## SEO Requirements
- Semantic HTML5 structure
- Structured data (JSON-LD): Organization, FinancialProduct
- Open Graph + Twitter Card meta tags
- Sitemap.xml (auto-generated)
- robots.txt
- Canonical URLs for bilingual pages
- Hreflang tags for language alternates

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
