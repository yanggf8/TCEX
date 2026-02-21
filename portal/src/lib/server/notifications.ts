import { createEmailSender } from './email';

const BASE = 'https://tcex-portal.pages.dev';

const STYLE = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
  margin: 0; padding: 0;
`;
const CARD = `
  max-width: 520px; margin: 40px auto; background: #fff;
  border: 1px solid #e4e4e7; border-radius: 4px; overflow: hidden;
`;
const HEADER = `
  background: #09090b; padding: 24px 32px;
`;
const BODY = `padding: 32px;`;
const FOOTER = `
  padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7;
  font-size: 11px; color: #71717a; text-align: center;
`;
const BTN = `
  display: inline-block; margin-top: 20px; padding: 10px 24px;
  background: #f59e0b; color: #000; font-weight: 600;
  text-decoration: none; border-radius: 3px; font-size: 14px;
`;
const LABEL = `font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em;`;
const VALUE = `font-size: 15px; color: #18181b; font-weight: 500; margin-top: 2px;`;

function wrap(content: string): string {
	return `<body style="${STYLE}"><div style="${CARD}">
<div style="${HEADER}">
  <span style="color:#fafafa;font-size:18px;font-weight:700;letter-spacing:0.05em;">TCEX</span>
  <span style="color:#71717a;font-size:11px;margin-left:8px;letter-spacing:0.1em;">TAIWAN CAPITAL EXCHANGE</span>
</div>
${content}
<div style="${FOOTER}">
  © 2026 TCEX Taiwan Capital Exchange ·
  <a href="${BASE}" style="color:#a1a1aa;text-decoration:none;">tcex-portal.pages.dev</a><br>
  本郵件由系統自動發送，請勿直接回覆。
</div>
</div></body>`;
}

// ─── KYC 審核結果 ────────────────────────────────────────────────────────────

export function kycApprovedEmail(name: string | null): string {
	const displayName = name || '用戶';
	return wrap(`<div style="${BODY}">
<p style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px;">身份驗證通過 ✓</p>
<p style="color:#52525b;font-size:14px;margin:0 0 24px;">親愛的 ${displayName}，</p>
<p style="color:#3f3f46;font-size:14px;line-height:1.6;margin:0 0 24px;">
  您的 KYC L2 身份驗證申請已通過審核。您現在可以在 TCEX 平台進行交易，每月交易上限為 <strong>NT$500,000</strong>。
</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
  <p style="margin:0;color:#16a34a;font-size:13px;">✓ KYC 等級已升級至 L2 — 交易功能已解鎖</p>
</div>
<a href="${BASE}/dashboard/trade" style="${BTN}">立即開始交易</a>
</div>`);
}

export function kycRejectedEmail(name: string | null, reason: string): string {
	const displayName = name || '用戶';
	return wrap(`<div style="${BODY}">
<p style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px;">身份驗證未通過</p>
<p style="color:#52525b;font-size:14px;margin:0 0 24px;">親愛的 ${displayName}，</p>
<p style="color:#3f3f46;font-size:14px;line-height:1.6;margin:0 0 20px;">
  您的 KYC L2 身份驗證申請未能通過審核，請查看以下原因並重新提交。
</p>
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
  <p style="${LABEL}">審核備注</p>
  <p style="${VALUE}">${reason}</p>
</div>
<p style="color:#52525b;font-size:13px;line-height:1.6;margin:0 0 20px;">
  請修正上述問題後，前往設定頁面重新提交 KYC 申請。
</p>
<a href="${BASE}/dashboard/settings" style="${BTN}">前往重新申請</a>
</div>`);
}

// ─── 收入分成通知 ────────────────────────────────────────────────────────────

export function distributionEmail(name: string | null, symbol: string, amount: string, balance: string): string {
	const displayName = name || '用戶';
	const formatted = parseFloat(amount).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const balanceFormatted = parseFloat(balance).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	return wrap(`<div style="${BODY}">
<p style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px;">收入分成已入帳</p>
<p style="color:#52525b;font-size:14px;margin:0 0 24px;">親愛的 ${displayName}，</p>
<p style="color:#3f3f46;font-size:14px;line-height:1.6;margin:0 0 24px;">
  您持有的 <strong>${symbol}</strong> 本期收入分成已入帳至您的錢包。
</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:20px;margin:0 0 24px;">
  <div style="margin-bottom:16px;">
    <p style="${LABEL}">本次分成金額</p>
    <p style="font-size:28px;font-weight:700;color:#16a34a;margin:4px 0 0;">+ NT$ ${formatted}</p>
  </div>
  <div style="border-top:1px solid #dcfce7;padding-top:16px;display:flex;gap:40px;">
    <div>
      <p style="${LABEL}">來源標的</p>
      <p style="${VALUE}">${symbol}</p>
    </div>
    <div>
      <p style="${LABEL}">錢包餘額</p>
      <p style="${VALUE}">NT$ ${balanceFormatted}</p>
    </div>
  </div>
</div>
<a href="${BASE}/dashboard/distributions" style="${BTN}">查看分成明細</a>
</div>`);
}

// ─── 出金確認 ────────────────────────────────────────────────────────────────

export function withdrawalEmail(name: string | null, amount: string, balance: string): string {
	const displayName = name || '用戶';
	const formatted = parseFloat(amount).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const balanceFormatted = parseFloat(balance).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	return wrap(`<div style="${BODY}">
<p style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px;">出金申請已受理</p>
<p style="color:#52525b;font-size:14px;margin:0 0 24px;">親愛的 ${displayName}，</p>
<p style="color:#3f3f46;font-size:14px;line-height:1.6;margin:0 0 24px;">
  您的出金申請已受理。款項將於 1–3 個工作天內匯至您的銀行帳戶，請注意查收。
</p>
<div style="border:1px solid #e4e4e7;border-radius:4px;padding:20px;margin:0 0 24px;">
  <div style="display:flex;gap:40px;">
    <div>
      <p style="${LABEL}">出金金額</p>
      <p style="font-size:24px;font-weight:700;color:#18181b;margin:4px 0 0;">NT$ ${formatted}</p>
    </div>
    <div>
      <p style="${LABEL}">剩餘錢包餘額</p>
      <p style="${VALUE}">NT$ ${balanceFormatted}</p>
    </div>
  </div>
</div>
<p style="color:#71717a;font-size:12px;line-height:1.6;margin:0 0 20px;">
  若您未發起此出金請求，請立即聯絡客服並修改密碼。
</p>
<a href="${BASE}/dashboard/wallet" style="${BTN}">查看錢包記錄</a>
</div>`);
}

// ─── 便捷發送函數 ────────────────────────────────────────────────────────────

export async function sendNotification(
	apiKey: string | undefined,
	to: string,
	subject: string,
	html: string
): Promise<void> {
	try {
		const sender = createEmailSender(apiKey);
		await sender.send(to, subject, html);
	} catch (err) {
		// Never let notification failure break the main operation
		console.error('[NOTIFY] Failed to send email to', to, err);
	}
}
