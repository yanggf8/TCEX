# Taiwan Capital Exchange (TCEX) - Original Reference Specification

> **STATUS: ARCHIVED — This document is a historical reference only.**
> It captures the initial MCEX analysis and has been superseded by:
> - `PORTAL_SPEC.md` — Public website (active UX spec)
> - `CORE_ENGINE.md` — Trading backend
> - `AUTH_SPEC.md` — Authentication & user flows
> - `COMPLIANCE.md` — Regulatory compliance
>
> Where this document conflicts with the above, the above take precedence.

## Project Overview
A Taiwan-based financial asset exchange platform focused on revenue-sharing models for SMEs, inspired by MCEX but with redesigned UX.

## Data Structure (from MCEX)

### Real-time Statistics Dashboard
```json
{
  "statistics": {
    "cumulative_financing": {
      "value": "57.75億",
      "currency": "TWD",
      "label": "累計融資金額"
    },
    "daily_financing": {
      "value": "1,055,897.79",
      "currency": "TWD",
      "label": "當日融資金額"
    },
    "cumulative_revenue_sharing": {
      "value": "38.92億",
      "currency": "TWD",
      "label": "累計收入分成金額"
    },
    "daily_revenue_sharing": {
      "value": "2,332,703.10",
      "currency": "TWD",
      "label": "當日收入分成金額"
    }
  },
  "data_cutoff_date": "2026-02-08"
}
```

### Cumulative Listings
```json
{
  "listings": {
    "spv_count": 136,
    "spac_count": 104,
    "underlying_assets": 13961
  }
}
```

## Navigation Structure

### Primary Navigation
1. **首頁** (Home)
2. **產品** (Products)
   - 總覽 (Overview)
   - RBO (Revenue-Based Obligation)
   - SPV (Special Purpose Vehicle)
   - SPAC (Special Purpose Acquisition Company)
   - ETF (Exchange-Traded Fund)

3. **掛牌** (Listings)
   - 掛牌內容 (Listing Content)
   - 如何掛牌 (How to List)

4. **市場聯通** (Market Connectivity)
   - 市場參與 (Market Participation)
   - 費用 (Fees)
   - 交易日曆 (Trading Calendar)
   - 交易時間 (Trading Hours)

5. **服務** (Services)
   - 登記與託管 (Registration & Custody)
   - 清算與結算 (Clearing & Settlement)
   - 業績參數 (Performance Parameters)
   - 第三方信用評級 (Third-party Credit Rating)
   - 跨境資金通道 (Cross-border Funding Channels)
   - 估值方法 (Valuation Methods)
   - 稅務處理 (Tax Treatment)

6. **資源** (Resources)
   - 規則與監管 (Rules & Regulations)
   - 市場通訊 (Market Communications)
   - 市場支持 (Market Support)
   - 檔案資源 (Document Resources)

7. **關於** (About)
   - 創始人網誌 (Founder's Blog)
   - 媒體中心 (Media Center)
   - 招聘 (Careers)
   - 企業社會責任 (CSR)
   - 財務報告 (Financial Reports)
   - 聯絡 (Contact)

## Page Components

### Homepage Sections

#### 1. Hero Banner
- Title: Platform name
- Subtitle: Mission statement
- CTA: Link to M-Terminal equivalent
- Background: Video support

#### 2. Statistics Dashboard (Mobile & Desktop variants)
- 4 primary metrics in card layout
- Real-time data updates
- Data cutoff date display
- Responsive grid (2x2 on mobile, 4 columns on desktop)

#### 3. Market Preview
- Geographic visualization (world map)
- Shows regions of underlying assets
- Interactive elements

#### 4. Cumulative Listings
- 3 key metrics: SPV, SPAC, Underlying Assets
- Card-based layout
- Data timestamp

#### 5. Founder's Blog Section
- Latest articles display
- Empty state: "暂無文章"

#### 6. About Section
- Company description
- Regulatory information
- Mission statement

### Footer
- Social media links (WeChat, LinkedIn equivalents for Taiwan)
- Quick links (M-Terminal, Document System)
- Legal links (Disclaimer, Terms)
- Contact information:
  - General inquiries email
  - Media contact email
  - Recruitment email
  - Phone number
- Copyright notice
- Regulatory information
- reCAPTCHA notice

## Technical Stack Recommendations

### Frontend
- **Framework**: Next.js (React) - based on CSS modules pattern observed
- **Styling**: Tailwind CSS + CSS Modules
- **Components**: 
  - NavigationBar
  - Drawer (mobile menu)
  - Statistics cards
  - Collapse/Accordion
  - AnimationUnderlineLink
  - BlockContainer (wrapper)
  
### Key Features
- Responsive design (mobile-first)
- Bilingual support (繁體中文/English)
- Video background support
- Smooth animations
- Collapsible navigation
- Sticky header with transparency effects

### Data Requirements
- Real-time statistics API
- Historical data tracking
- Multi-currency support (TWD primary)
- Date-stamped snapshots
- Geographic data for market visualization

## Localization

### Taiwan-Specific Adaptations
1. **Currency**: Replace MOP with TWD
2. **Regulatory**: Reference Taiwan FSC instead of Macau AMCM
3. **Contact**: Taiwan phone format (+886)
4. **Social Media**: Replace WeChat with LINE
5. **Legal Framework**: Taiwan securities law references
6. **Company Registration**: Taiwan business registration format

## API Endpoints (Inferred)

```
GET /api/statistics/current
GET /api/statistics/historical
GET /api/listings/summary
GET /api/market/geographic-data
GET /api/blog/latest
```

## Design System

### Colors (WCAG AA Compliant)
- Primary: #00B386 (green accent — darkened from #00D29E for AA contrast on white)
- Primary Hover: #009E75
- Background: #F7F8FA (light gray)
- Surface: #FFFFFF (cards, modals)
- Text Primary: #2D3142 (dark — 12.5:1 on #F7F8FA, passes AAA)
- Text Secondary: #545B72 (gray — 5.2:1 on #F7F8FA, passes AA)
- Text Muted: #6B7280 (light gray — 4.6:1 on #FFFFFF, passes AA)
- Border: #D1D5DB
- Success: #059669
- Warning: #D97706
- Error: #DC2626
- Info: #2563EB

### Typography
- Primary: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif
- Headings: 700 weight, tracking -0.02em
- Body: 400 weight, line-height 1.75 (optimized for Chinese readability)
- Font sizes (rem): xs=0.75, sm=0.875, base=1, lg=1.125, xl=1.25, 2xl=1.5, 3xl=1.875, 4xl=2.25
- Numbers/Currency: "Noto Sans TC" tabular-nums (monospace figures for alignment)

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
- Section padding mobile: 32px vertical
- Section padding desktop: 80px vertical
- Container max-width: 1280px with 16px (mobile) / 32px (desktop) horizontal padding

## Security & Compliance
- reCAPTCHA integration
- SSL/TLS required
- Privacy policy
- Terms of service
- Risk disclosure statements
- Investment warnings

## Performance Requirements
- Fast initial load
- Lazy loading for images/videos
- Optimized for mobile networks
- Real-time data updates without page refresh

## Next Steps
1. Design mockups with new UX
2. Set up Next.js project structure
3. Implement component library
4. Build API layer
5. Integrate real-time data
6. Localization setup
7. Testing & deployment
