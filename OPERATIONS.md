# TCEX 營運操作指引

> 本文件說明平台上線後，營運團隊每日／每月需要執行的操作流程。
> 技術背景需求：能使用 Cloudflare Dashboard 或基本 CLI 指令。

---

## 一、首次上線前的一次性設定

### 1.1 設定管理員帳號

平台目前沒有「建立管理員」的 UI。流程如下：

**步驟一**：用你要指定為管理員的 Email 正常在網站註冊帳號

**步驟二**：執行以下指令將該帳號升格為管理員
```bash
npx wrangler d1 execute tcex-db --remote \
  --command "UPDATE users SET role = 'admin' WHERE email = 'your@email.com'"
```

**步驟三**：登入後進入 `https://tcex-portal.pages.dev/admin` 確認後台可正常存取

> ⚠️ 管理員身分不存在 JWT 中，每次操作都從資料庫讀取，不需重新登入即生效。

---

### 1.2 確認環境變數已設定

前往 [Cloudflare Dashboard → Pages → tcex-portal → Settings → Environment Variables](https://dash.cloudflare.com) 確認以下變數均存在：

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `JWT_SECRET` | JWT 簽章金鑰（隨機字串，至少 32 字元） | 自行產生 |
| `RESEND_API_KEY` | Email 發送服務金鑰 | [resend.com](https://resend.com) |
| `GOOGLE_CLIENT_ID` | Google OAuth 用戶端 ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 用戶端密鑰 | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://tcex-portal.pages.dev/api/v1/auth/google/callback` | 固定值 |

> SMS OTP（手機驗證）目前為開發模式：系統會接受任意 6 位數字作為驗證碼。正式啟用需接入 Twilio，詳見第六節。

---

### 1.3 確認資料庫 Migration 已全部執行

```bash
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

應看到以下所有資料表：
`audit_log`, `distributions`, `distribution_payments`, `email_verifications`, `google_accounts`, `kyc_applications`, `kyc_documents`, `line_accounts`, `listings`, `orders`, `phone_verifications`, `positions`, `products`, `totp_secrets`, `trades`, `users`, `wallet_transactions`, `wallets`, `watchlist`

若缺少任何資料表，依序執行 `portal/migrations/` 目錄下對應的 `.sql` 檔案。

---

### 1.4 新增掛牌產品（目前無 UI，需手動執行）

系統已有 15 個種子產品（測試用），正式上線需依實際合約新增。範例：

```bash
npx wrangler d1 execute tcex-db --remote --command "
INSERT INTO listings (id, product_id, product_type, symbol, name_zh, name_en,
  unit_price, total_units, available_units, yield_rate, risk_level, status, listed_at, created_at, updated_at)
VALUES (
  'lst_真實ID', 'prod_rbo', 'rbo',
  'RBO-台灣咖啡001', '台灣咖啡股份有限公司', 'Taiwan Coffee Co.',
  '100', '10000', '10000',
  '0.08', 'medium', 'active',
  datetime('now'), datetime('now'), datetime('now')
)"
```

> 📌 `product_id` 需對應 `products` 資料表中已存在的 ID，可先查詢：
> `SELECT id, name_zh FROM products`

---

## 二、每日必要操作

### 2.1 查看後台總覽

登入後前往 `/admin`，確認：
- **PENDING KYC**：是否有待審核申請 → 若有，當日處理（見第三節）
- **ACTIVE ORDERS**：活躍委託單數量是否正常

---

### 2.2 處理入金請求（人工流程）

**目前流程**（MVP 階段，無自動銀行對接）：

1. 用戶透過銀行轉帳將資金匯至 TCEX 指定帳戶
2. 用戶在平台「錢包 → 入金」提交入金申請，填寫金額與轉帳備註
3. 營運人員核對銀行帳單，確認款項到帳後，手動執行入帳指令：

```bash
# 先查詢用戶 ID
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT id, email FROM users WHERE email = 'user@example.com'"

# 查詢錢包 ID
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT id, available_balance FROM wallets WHERE user_id = 'USER_ID'"

# 執行入帳（以 50000 TWD 為例）
npx wrangler d1 execute tcex-db --remote --command "
BEGIN;
UPDATE wallets SET
  available_balance = CAST(available_balance AS REAL) + 50000,
  total_deposited = CAST(total_deposited AS REAL) + 50000,
  updated_at = datetime('now')
WHERE id = 'WALLET_ID';
INSERT INTO wallet_transactions
  (id, wallet_id, user_id, type, amount, fee, balance_before, balance_after,
   reference_type, description, status, created_at)
VALUES (
  lower(hex(randomblob(16))), 'WALLET_ID', 'USER_ID',
  'deposit', '50000.00', '0',
  (SELECT available_balance FROM wallets WHERE id = 'WALLET_ID'),
  CAST((SELECT available_balance FROM wallets WHERE id = 'WALLET_ID') AS REAL) + 50000,
  'bank_transfer', '銀行轉帳入金', 'completed', datetime('now')
);
COMMIT"
```

> 📌 未來規劃：接入玉山銀行或台新銀行的企業網銀 API，實現自動對帳。

---

### 2.3 處理出金請求（人工流程）

1. 用戶在「錢包 → 出金」提交出金申請（系統自動鎖定餘額）
2. 在銀行網銀執行實際匯款至用戶填寫的帳號
3. 確認匯款完成後，出金狀態由系統自動標記完成（目前出金 API 已立即完成，無待審核暫停機制）

> ⚠️ **風控提醒**：單筆出金超過 50 萬 TWD，需人工審核後再匯款。KYC L2 以下帳號每月出金上限 50 萬 TWD，系統已自動執行 gate。

---

## 三、KYC 審核流程

### 3.1 L1 → 自動核准

用戶完成 Email 驗證 + 手機驗證（任意 6 位數即通過，MVP 模式）後，系統自動升級至 L1，**無需人工操作**。

### 3.2 L2 → 人工審核

**操作頁面**：`/admin/kyc`（預設顯示 PENDING 分頁）

**審核流程**：
1. 點擊申請列展開詳細資料
2. 確認：姓名、生日、身分證字號、地址是否完整
3. 查看上傳文件數量（點擊後可在 R2 後台查看實際圖片）
4. 填寫審核備注（拒絕時必填，核准時選填）
5. 點擊 **APPROVE** 或 **REJECT**

**核准效果**：
- `kyc_applications.status` → `approved`
- `users.kyc_level` → `2`
- 用戶可開始交易（每月上限 50 萬 TWD）

**拒絕效果**：
- `kyc_applications.status` → `rejected`
- 用戶維持 L1，可重新提交申請
- 拒絕原因會顯示在用戶的設定頁面

---

## 四、收入分成發放流程

> 每月或每季執行一次，依合約約定的分成週期而定。

**操作頁面**：`/admin/distributions`

### 4.1 執行步驟

1. **收集數據**：向掛牌企業取得當期收入報告（例：本月營業額 100 萬 TWD，分成比例 10% → 分成金額 10 萬 TWD）
2. **選擇標的**：在 LISTING 下拉選單中選擇對應的掛牌產品
3. **輸入金額**：在 TOTAL REVENUE 欄位輸入本次應發放的總金額（TWD）
4. **填寫說明**：如「2026年2月 RBO-001 月收入分成」
5. **按下 EXECUTE DISTRIBUTION**

### 4.2 系統自動計算

```
每單位分成金額 = 輸入金額 ÷ 流通中單位數
每位投資人收到 = 每單位金額 × 持有單位數
```

**結果**：每位持倉者的錢包餘額立即增加，`wallet_transactions` 自動寫入，用戶可在「收入分成」頁面查看明細。

### 4.3 發放後確認

- 頁面下方歷史表格顯示本次發放紀錄（收件人數、總金額、每單位金額）
- 用戶端：`/dashboard/distributions` 顯示各自收到的金額
- 稽核：`audit_log` 自動記錄操作者 ID 與發放摘要

---

## 五、用戶管理

**操作頁面**：`/admin/users`

| 操作 | 方式 |
|------|------|
| 搜尋用戶 | 在搜尋欄輸入 Email 或姓名 |
| 查看 KYC 等級 | L0/L1/L2 徽章 |
| 查看驗證狀態 | E（Email）/ P（Phone）綠色表示已驗證 |
| 凍結帳號 | 點擊 FREEZE → 用戶無法登入、交易、出金 |
| 解凍帳號 | 點擊 UNFREEZE → 恢復正常 |

> 管理員帳號無法被凍結（系統保護）。

---

## 六、目前已知限制（MVP 階段）

| 功能 | 現況 | 正式啟用條件 |
|------|------|------------|
| 手機 OTP | 任意 6 位數字即通過 | 接入 Twilio（需信用卡，約 USD $0.05/則） |
| 入金 | 人工對帳後手動執行 SQL | 接入銀行 API（玉山 / 台新企業網銀） |
| 出金 | 立即完成，需人工匯款 | 建立待審核佇列 + 銀行 API |
| KYC 文件審閱 | 文件數量顯示，需到 Cloudflare R2 後台查看圖片 | 在後台直接顯示 R2 圖片（presigned URL） |
| 掛牌管理 | 需手動執行 SQL | 建立 `/admin/listings` 管理介面 |
| Email 通知 | ✅ KYC 審核結果、收入分成入帳、出金受理 已上線 | LINE 推播通知（未來擴充） |
| 2FA 強制 | 選用，不強制 | 可設定高額交易必須啟用 2FA |

---

## 七、常用查詢指令

```bash
# 查詢所有用戶
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT email, kyc_level, status, role, created_at FROM users ORDER BY created_at DESC LIMIT 20"

# 查詢待審 KYC
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT ka.id, u.email, ka.level, ka.created_at FROM kyc_applications ka JOIN users u ON u.id = ka.user_id WHERE ka.status = 'pending'"

# 查詢最近分成記錄
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT d.id, l.symbol, d.total_amount, d.status, d.created_at FROM distributions d JOIN listings l ON l.id = d.listing_id ORDER BY d.created_at DESC LIMIT 10"

# 查詢某用戶錢包餘額
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT u.email, w.available_balance, w.locked_balance FROM wallets w JOIN users u ON u.id = w.user_id WHERE u.email = 'user@example.com'"

# 查詢稽核紀錄
npx wrangler d1 execute tcex-db --remote \
  --command "SELECT action, entity_type, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 20"
```

---

## 八、緊急操作

### 凍結所有交易（市場熔斷）

目前需手動將掛牌狀態改為 `suspended`：
```bash
npx wrangler d1 execute tcex-db --remote \
  --command "UPDATE listings SET status = 'suspended', updated_at = datetime('now') WHERE status = 'active'"
```

恢復交易：
```bash
npx wrangler d1 execute tcex-db --remote \
  --command "UPDATE listings SET status = 'active', updated_at = datetime('now') WHERE status = 'suspended'"
```

### 鎖定可疑帳號

```bash
npx wrangler d1 execute tcex-db --remote \
  --command "UPDATE users SET status = 'frozen', updated_at = datetime('now') WHERE email = 'suspect@example.com'"
```

---

## 九、後台頁面速查

| 網址 | 功能 |
|------|------|
| `/admin` | 系統總覽（用戶數、待審 KYC、交易量） |
| `/admin/kyc` | KYC L2 申請審核 |
| `/admin/users` | 用戶管理（搜尋、凍結） |
| `/admin/distributions` | 收入分成發放 |

---

---

## 十、平台目前完整功能清單

截至民國115年2月，以下功能均已部署並可正式使用：

**用戶端**
- 首頁市場統計（交易量、掛牌數、用戶數、分成金額）即時顯示
- Email 註冊 + Google OAuth 登入 + LINE OAuth 登入
- Email 驗證碼（Resend 真實發送）
- 雙重驗證（2FA TOTP，Google Authenticator 相容）
- KYC L0→L1 自動升級、L1→L2 人工審核
- 錢包（入金/出金/餘額/交易紀錄）
- 即時撮合交易（市價單/限價單，WebSocket 掛單簿）
- 投資組合、訂單管理、自選清單、收入分成明細
- 儀表板最近活動（最新 10 筆錢包交易）
- Email 通知（KYC 審核結果、分成入帳、出金受理）

**後台管理**
- 系統總覽（用戶數、待審 KYC、交易量、活躍委託）
- KYC L2 審核（核准/拒絕，含審核備注與 Email 通知）
- 用戶管理（搜尋、凍結/解凍）
- 收入分成發放（選標的 → 輸入金額 → 批量入帳 → Email 通知持倉者）

*文件最後更新：民國115年2月*
