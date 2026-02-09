# Taiwan Capital Exchange (TCEX) - Technical Specification

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

### Colors (from CSS classes)
- Primary: #00D29E (green accent)
- Background: #F7F8FA (light gray)
- Text: #6D758F (gray)
- Dark: Various shades

### Typography
- Responsive font sizes
- Chinese font optimization required

### Spacing
- Consistent padding/margin system
- Mobile: 30px sections
- Desktop: 80px sections

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
