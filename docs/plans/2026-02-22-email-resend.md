# Email 真實發送（Resend 整合）實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用 Resend API 取代所有 `console.log` 的 Email stub，讓註冊驗證碼可以真實寄送。

**Architecture:** 在現有的 `EmailSender` 介面下新增 `ResendEmailSender` 實作，透過 Cloudflare secret (`RESEND_API_KEY`) 注入。Register 和 resend-verification 兩個路由直接使用新的 sender，不改動介面簽名。

**Tech Stack:** Resend REST API (fetch)、Cloudflare Workers Secrets、SvelteKit `platform.env`

---

## 前置條件（手動完成）

1. 前往 [resend.com](https://resend.com) 註冊帳號（免費）
2. 在 Resend Dashboard 取得 API Key
3. 驗證寄件網域（或先用 `onboarding@resend.dev` 測試）
4. 執行以下指令設定 Cloudflare secret：

```bash
cd /home/yanggf/b/TCEX/portal
npx wrangler secret put RESEND_API_KEY
# 貼上 API Key 後 Enter
```

---

## Task 1: 實作 ResendEmailSender

**Files:**
- Modify: `portal/src/lib/server/email.ts`

**Step 1: 新增 ResendEmailSender class**

將 `email.ts` 改為：

```typescript
export interface EmailSender {
	send(to: string, subject: string, html: string): Promise<void>;
}

export function generateOtp(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(4));
	const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
	return String(num % 1000000).padStart(6, '0');
}

export class ConsoleEmailSender implements EmailSender {
	async send(to: string, subject: string, html: string): Promise<void> {
		console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${html}`);
	}
}

export class ResendEmailSender implements EmailSender {
	constructor(
		private readonly apiKey: string,
		private readonly from: string = 'TCEX <noreply@tcex.tw>'
	) {}

	async send(to: string, subject: string, html: string): Promise<void> {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ from: this.from, to, subject, html })
		});

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`Resend error ${res.status}: ${err}`);
		}
	}
}

export function createEmailSender(apiKey?: string): EmailSender {
	if (apiKey) return new ResendEmailSender(apiKey);
	return new ConsoleEmailSender();
}
```

**Step 2: 確認 TypeScript 無錯誤**

```bash
cd /home/yanggf/b/TCEX/portal && npx tsc --noEmit 2>&1 | head -20
```

Expected: 無輸出（無錯誤）

**Step 3: Commit**

```bash
git add portal/src/lib/server/email.ts
git commit -m "feat: add ResendEmailSender and createEmailSender factory"
```

---

## Task 2: 更新 register 路由

**Files:**
- Modify: `portal/src/routes/api/v1/auth/register/+server.ts`

**Step 1: 更新 import**

找到第 14 行：
```typescript
import { generateOtp } from '$lib/server/email';
```
改為：
```typescript
import { generateOtp, createEmailSender } from '$lib/server/email';
```

**Step 2: 取代 console.log 發信**

找到第 94-95 行：
```typescript
// Send verification email (console in dev)
console.log(`[EMAIL] Verification code for ${email.toLowerCase()}: ${otp}`);
```
改為：
```typescript
const emailSender = createEmailSender(platform.env.RESEND_API_KEY);
await emailSender.send(
    email.toLowerCase(),
    '【TCEX】Email 驗證碼',
    `<p>您的驗證碼為：<strong style="font-size:24px">${otp}</strong></p><p>驗證碼將於 10 分鐘後失效。</p>`
);
```

**Step 3: 確認 TypeScript 無錯誤**

```bash
cd /home/yanggf/b/TCEX/portal && npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add portal/src/routes/api/v1/auth/register/+server.ts
git commit -m "feat: send real verification email on register via Resend"
```

---

## Task 3: 更新 resend-verification 路由

**Files:**
- Modify: `portal/src/routes/api/v1/auth/resend-verification/+server.ts`

**Step 1: 更新 import**

```typescript
import { generateOtp, createEmailSender } from '$lib/server/email';
```

**Step 2: 取代 console.log 發信**

找到：
```typescript
console.log(`[EMAIL] Verification code for ${user.email}: ${otp}`);
```
改為：
```typescript
const emailSender = createEmailSender(platform.env.RESEND_API_KEY);
await emailSender.send(
    user.email,
    '【TCEX】Email 驗證碼（重新發送）',
    `<p>您的驗證碼為：<strong style="font-size:24px">${otp}</strong></p><p>驗證碼將於 10 分鐘後失效。</p>`
);
```

**Step 3: 確認 TypeScript 無錯誤**

```bash
cd /home/yanggf/b/TCEX/portal && npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add portal/src/routes/api/v1/auth/resend-verification/+server.ts
git commit -m "feat: send real verification email on resend via Resend"
```

---

## Task 4: 設定 wrangler.toml（本機開發用）

**Files:**
- Modify: `portal/wrangler.toml`

**Step 1: 加入 vars 區塊供本機開發 fallback**

在 `wrangler.toml` 最後加入：

```toml
[vars]
# RESEND_API_KEY 由 wrangler secret 管理，此處留空讓 dev 自動 fallback 至 ConsoleEmailSender
RESEND_API_KEY = ""
```

> 注意：空字串會讓 `createEmailSender` 回傳 `ConsoleEmailSender`，本機開發不需要真實 API Key。

**Step 2: Commit**

```bash
git add portal/wrangler.toml
git commit -m "chore: add RESEND_API_KEY var placeholder in wrangler.toml"
```

---

## Task 5: 手動測試

1. 部署至 Cloudflare Pages：
```bash
cd /home/yanggf/b/TCEX/portal && npm run build && npx wrangler pages deploy .svelte-kit/cloudflare
```

2. 用一個真實 Email 帳號註冊
3. 確認收到驗證碼信件
4. 確認驗證碼可正常使用

---

## 注意事項

- **寄件網域**：Resend 免費方案可用 `onboarding@resend.dev` 測試，正式上線前需驗證自有網域（tcex.tw）
- **錯誤處理**：`ResendEmailSender` 發信失敗會拋出例外，register 路由會回傳 500，不會靜默失敗
- **本機開發**：`RESEND_API_KEY` 空字串 → `ConsoleEmailSender` → 驗證碼印在 console，不影響開發
