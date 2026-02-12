# TCEX Authentication & User Experience Specification

## Overview
Authentication, identity verification, and authenticated user flows for Taiwan Capital Exchange. Covers registration, KYC/AML, session management, and the user dashboard.

### Ownership Boundary
The authenticated dashboard pages (`/dashboard/*`) are part of the same SvelteKit codebase as the public portal (see `PORTAL_SPEC.md`), deployed on Cloudflare Pages + Workers. Auth is enforced via SvelteKit's `hooks.server.ts` handle function. API routes are SvelteKit `+server.ts` endpoints (same codebase). This document owns the **UX specification** for all authenticated routes. The database schema and trading logic are specified in `CORE_ENGINE.md`.

## Authentication Methods

### Primary: Email + Password
- Email verification required
- Password requirements: 12+ chars, mixed case, number, special char
- PBKDF2-SHA256 hashing (100k iterations, 16-byte salt)
- Account lockout after 5 failed attempts (15-minute cooldown)

### Social Login: LINE
- LINE Login OAuth 2.1 integration
- Scope: `profile`, `openid`, `email`
- Link LINE account to TCEX account (not standalone registration)
- LINE Notify for trade confirmations and alerts

### Two-Factor Authentication (2FA)
- **Mandatory** for all financial transactions (orders, withdrawals)
- Methods: TOTP (Google Authenticator / Authy) or SMS OTP
- Backup codes: 10 single-use codes generated at 2FA setup
- 2FA required for: login (optional but encouraged), trading (mandatory), withdrawal (mandatory), profile changes (mandatory)

### Taiwan-Specific Identity
- Taiwan National ID verification for KYC Level 2+
- Mobile ID (TWID) integration for digital identity verification
- Natural Person Certificate (自然人憑證) support for institutional features

## KYC/AML Levels

| Level | Requirements | Capabilities |
|-------|-------------|-------------|
| **Level 0** | Email verified | Browse market data, watchlist only |
| **Level 1** | Phone verified + basic info | View portfolio, receive distributions |
| **Level 2** | National ID + address proof | Trade up to TWD 500,000/month |
| **Level 3** | Enhanced due diligence | Unlimited trading, institutional features |

### KYC Flow
```
Register → Email Verify → Phone Verify (L1) → ID Upload + Selfie (L2) → Manual Review → Approved
                                              → Rejected (with reason, can resubmit)
```

### Document Requirements (Level 2)
- Taiwan National ID (front + back photo)
- Selfie holding ID
- Proof of address (utility bill or bank statement, < 3 months old)
- Processing time: 1-3 business days

### AML Screening
- PEP (Politically Exposed Person) database check
- Sanctions list screening (OFAC, EU, Taiwan MJIB)
- Transaction monitoring for suspicious patterns
- Suspicious Activity Report (SAR) filing to Taiwan FIU

## Registration Flow

### Step 1: Account Creation
```
Email → Password → Agree to Terms + Risk Disclosure → Create Account → Verification Email
```

### Step 2: Email Verification
- 6-digit code sent to email (valid 15 minutes)
- Resend cooldown: 60 seconds
- Max 5 attempts per hour

### Step 3: Onboarding (post-verification)
- Welcome screen explaining platform
- Guided tour of key features (skippable)
- Prompt to complete KYC Level 1 (phone verification)
- Risk tolerance questionnaire (required before first trade)

## Session Management

- JWT access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry (stored in httpOnly cookie)
- Concurrent sessions: max 3 devices
- Session revocation on password change
- IP-based anomaly detection (new location → email confirmation)

## User Dashboard

### Overview Page (`/dashboard`)
- Portfolio value (TWD) with daily P&L
- Quick stats: total positions, pending orders, recent distributions
- Watchlist preview (top 5)
- Recent activity feed (last 10 events)
- Market status indicator (open/closed/pre-market)

### Portfolio Page (`/dashboard/portfolio`)
- Holdings table: listing name, quantity, avg cost, current price, unrealized P&L, % change
- Portfolio allocation chart (donut/pie)
- Performance chart (line, selectable timeframes: 1D, 1W, 1M, 3M, 1Y, ALL)
- Export: CSV download

### Orders Page (`/dashboard/orders`)
- Tabs: Active Orders | Order History
- Active: listing, side, type, price, quantity, filled, status, cancel button
- History: date, listing, side, type, price, quantity, avg fill, status
- Filters: date range, product type, side, status
- Export: CSV download

### Trading Page (`/dashboard/trade/{listing_id}`)
- Left panel: order book (L2 depth)
- Center: price chart (TradingView integration or lightweight-charts)
- Right panel: order entry form
  - Buy / Sell toggle
  - Order type selector (Market / Limit / Stop-Limit)
  - Quantity input with quick-fill buttons (25%, 50%, 75%, 100%)
  - Price input (for limit/stop-limit)
  - Estimated cost/proceeds display
  - Available balance display
  - Submit button (triggers 2FA)
- Bottom: recent trades, user's open orders for this listing

### Wallet Page (`/dashboard/wallet`)
- Available balance (TWD)
- Locked balance (in open orders)
- Total balance
- Deposit: bank transfer instructions (TCEX's bank account + user reference code)
- Withdraw: amount input, bank account selection, 2FA confirmation
- Transaction history: date, type, amount, status, reference

### Revenue Sharing Page (`/dashboard/distributions`)
- Upcoming distributions: listing, record date, estimated per-unit amount
- Past distributions: date, listing, units held, amount received, status
- Annual summary for tax reporting
- Export: CSV, PDF (for tax filing)

### Watchlist Page (`/dashboard/watchlist`)
- Listing name, current price, daily change, volume
- Price alerts: set target price, notify via LINE/email/push
- Remove from watchlist
- Quick trade button

### Notifications Page (`/dashboard/notifications`)
- Categories: Trade, Distribution, Account, System
- Mark as read / mark all as read
- Notification preferences:
  - Trade executed → LINE + Email
  - Distribution received → LINE + Email
  - Price alert triggered → LINE + Push
  - Account security → Email (always on)
  - System announcements → In-app

### Settings Page (`/dashboard/settings`)
- Profile: display name, email, phone
- Security: password change, 2FA management, active sessions, login history
- KYC: current level, upgrade prompt, document status
- Notifications: channel preferences per category
- API Keys: generate/revoke API keys (for programmatic trading, Level 3 only)
- Data export: request full data export (GDPR-like, within 30 days)

## Error Handling

| Scenario | User Message |
|----------|-------------|
| Wrong credentials | "電子郵件或密碼不正確" (5 attempts remaining) |
| Account locked | "帳戶已鎖定，請在15分鐘後重試" |
| KYC required | "請先完成身份驗證以使用此功能" with CTA to KYC page |
| 2FA failed | "驗證碼不正確，請重新輸入" |
| Session expired | Silent refresh attempt → if fail, redirect to login |
| Insufficient balance | "餘額不足" with current balance + required amount |
| Market closed | "目前非交易時段" with next trading session time |
