# TCEX Compliance & Regulatory Specification

## Overview
Regulatory compliance requirements for operating a financial asset exchange in Taiwan under the Financial Supervisory Commission (FSC). This document covers the regulatory framework, data governance, audit requirements, and investor protection measures.

## Regulatory Framework

### Governing Authority
- **Primary regulator**: Financial Supervisory Commission (金融監督管理委員會, FSC)
- **Relevant divisions**: Securities and Futures Bureau (證券期貨局)
- **AML authority**: Money Laundering Prevention Act (洗錢防制法) — Ministry of Justice Investigation Bureau (MJIB)

### Applicable Laws & Regulations
1. Securities and Exchange Act (證券交易法)
2. Futures Trading Act (期貨交易法)
3. Financial Technology Development and Innovative Experimentation Act (金融科技發展與創新實驗條例) — "Regulatory Sandbox"
4. Money Laundering Control Act (洗錢防制法)
5. Terrorism Financing Prevention Act (資恐防制法)
6. Personal Data Protection Act (個人資料保護法, PDPA)
7. Electronic Signatures Act (電子簽章法)

### Regulatory Sandbox Consideration
- If TCEX operates under FSC's FinTech sandbox:
  - Application period: up to 18 months (extendable by 12 months)
  - Must demonstrate innovation and consumer protection
  - Sandbox exit strategy required (full license application)
  - Regular reporting to FSC during sandbox period

## Data Residency & Sovereignty

### Requirements
- **Primary financial data** (orders, trades, wallets, KYC): must be stored within Taiwan or FSC-approved jurisdictions
- **Recommended hosting**: GCP `asia-east1` (Changhua, Taiwan) or local Taiwan data centers
- **Backup**: encrypted backups within the same jurisdiction
- **Cross-border transfer**: requires explicit user consent and FSC notification for personal data

### Data Classification
| Category | Sensitivity | Retention | Storage |
|----------|------------|-----------|---------|
| Trading records | High | 7 years minimum | Taiwan-hosted PostgreSQL |
| KYC documents | Critical | 5 years after account closure | Encrypted S3 (Taiwan region) |
| Personal data | High | Duration of account + 3 years | Encrypted at rest (AES-256) |
| Audit logs | Critical | 10 years | Append-only, Taiwan-hosted |
| Market data | Medium | Indefinite | TimescaleDB (Taiwan region) |
| Website analytics | Low | 2 years | Any region |

## Audit Trail Requirements

### WORM (Write Once Read Many) Logging
All financial transactions must be logged immutably:

```
audit_entry {
  id: UUID (sequential)
  timestamp: ISO 8601 with timezone
  actor_id: UUID (user or system)
  actor_type: USER | ADMIN | SYSTEM
  action: ORDER_PLACED | ORDER_CANCELLED | TRADE_EXECUTED | WITHDRAWAL_REQUESTED | KYC_APPROVED | ...
  entity_type: ORDER | TRADE | WALLET | USER | LISTING
  entity_id: UUID
  before_state: JSONB (snapshot before change)
  after_state: JSONB (snapshot after change)
  ip_address: string
  user_agent: string
  request_id: UUID (for distributed tracing)
}
```

### Audit Requirements
- No UPDATE or DELETE operations on audit tables
- Cryptographic hash chain (each entry references hash of previous entry)
- Daily audit digest exported to separate secure storage
- Tamper detection: automated integrity verification every 6 hours
- Access to audit logs restricted to compliance officers and FSC auditors

### Reportable Events
- All order lifecycle events
- All fund movements (deposits, withdrawals, distributions)
- KYC state changes (submission, approval, rejection)
- User authentication events (login, failed login, 2FA)
- Admin actions (listing management, market halt, user management)
- System events (matching engine restart, circuit breaker triggered)

## AML/CFT (Anti-Money Laundering / Counter-Terrorism Financing)

### Customer Due Diligence (CDD)
1. **Simplified CDD**: KYC Level 1 — low-risk, limited transactions
2. **Standard CDD**: KYC Level 2 — identity verified, standard limits
3. **Enhanced CDD**: KYC Level 3 — source of funds verification, unlimited

### Transaction Monitoring
| Rule | Threshold | Action |
|------|-----------|--------|
| Large transaction | Single transaction > TWD 500,000 | Flag for review |
| Structuring detection | Multiple transactions summing > TWD 500,000 within 24h | Automatic SAR |
| Rapid movement | Deposit + withdrawal within 1 hour | Flag for review |
| Dormant account activity | No activity > 6 months then large transaction | Flag for review |
| PEP transaction | Any transaction by PEP-flagged user | Enhanced monitoring |

### Suspicious Activity Reporting (SAR)
- Filed to Taiwan FIU (法務部調查局洗錢防制處)
- Must be filed within 2 business days of detection
- Internal SAR records retained for 5 years
- Tipping-off prohibition: users must not be informed of SAR filing

### Sanctions Screening
- Screen all users against:
  - Taiwan MJIB sanctions list
  - UN Security Council consolidated list
  - OFAC SDN list
  - EU consolidated list
- Screen on: registration, KYC update, and periodically (monthly batch)

## Investor Protection

### Risk Disclosure Requirements
Every user must acknowledge before first trade:

```
投資風險聲明 (Investment Risk Statement)

1. 投資涉及風險。金融資產的價值及其收益可能會下跌也可能會上漲。
2. 過往表現並不代表將來的表現。
3. 收入分成回報取決於基礎資產的業績表現，不保證任何回報。
4. 投資者應在投資前仔細閱讀相關產品文件。
5. 如有疑問，應尋求獨立的專業意見。
```

### Suitability Assessment
- Risk tolerance questionnaire before first trade
- Product suitability matching (conservative investors restricted from high-risk products)
- Annual re-assessment prompt
- Warning display when trading products above risk profile

### Complaint Handling
- Dedicated complaint channel: complaint@tcex.tw
- Acknowledgement within 1 business day
- Resolution target: 15 business days
- Escalation to FSC if unresolved within 30 days
- Complaint register maintained for regulatory review

## Regulatory Reporting

### Periodic Reports to FSC
| Report | Frequency | Format | Calendar |
|--------|-----------|--------|----------|
| Daily trading summary | Daily (T+1) | XML/CSV | Gregorian |
| Monthly operations report | Monthly | PDF + structured data | Minguo Era |
| Quarterly financial report | Quarterly | Audited financials | Minguo Era |
| Annual compliance report | Annual | Comprehensive PDF | Minguo Era |
| AML statistics | Quarterly | Structured data | Gregorian |

### Minguo Calendar Support
- Taiwan regulatory reports use Minguo Era (民國紀年): Year = Gregorian Year - 1911
- Example: 2026 = 民國115年
- System must support dual calendar output
- Internal storage: always Gregorian (ISO 8601)
- Display/export: configurable (Gregorian or Minguo)

### Incident Reporting
- Material system outages: report to FSC within 4 hours
- Data breaches: report to FSC + PDPC within 72 hours
- Market manipulation detection: immediate report to FSC
- Matching engine failures during trading hours: immediate report

## Privacy & Data Protection (Taiwan PDPA)

### User Rights
1. Right to access personal data
2. Right to request correction
3. Right to request deletion (subject to retention requirements)
4. Right to request cessation of processing
5. Right to data portability (export within 30 days)

### Consent Management
- Explicit consent for data collection at registration
- Separate consent for marketing communications
- Consent for cross-border data transfer (if applicable)
- Consent withdrawal mechanism (account settings)
- Consent records retained for audit

### Data Breach Response Plan
1. **Detection** (< 1 hour): Automated alerts from security monitoring
2. **Containment** (< 4 hours): Isolate affected systems
3. **Assessment** (< 24 hours): Scope, impact, affected users
4. **Notification** (< 72 hours): FSC, affected users, PDPC
5. **Remediation** (ongoing): Fix root cause, enhance controls
6. **Review** (< 30 days): Post-incident report, process improvement

## Security Requirements

### Infrastructure
- Encryption at rest: AES-256 for all databases and file storage
- Encryption in transit: TLS 1.3 minimum
- Key management: HSM-backed (AWS KMS or equivalent)
- Network: VPC isolation, private subnets for databases
- DDoS protection: CloudFlare or AWS Shield
- WAF: OWASP Top 10 protection rules

### Application Security
- Annual penetration testing by FSC-recognized firm
- Quarterly vulnerability assessments
- Bug bounty program (recommended)
- SSDLC (Secure Software Development Lifecycle)
- Code review required for all changes to financial logic
- Dependency scanning (Dependabot / Snyk)

### Access Control
- Role-based access (RBAC): User, Trader, Compliance Officer, Admin, Super Admin
- Principle of least privilege
- Admin actions require 2FA + audit log
- SSH key-based access only for infrastructure (no passwords)
- Quarterly access review
