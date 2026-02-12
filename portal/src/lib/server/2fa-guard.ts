import { verifyTotpCode } from '$lib/server/totp';

interface TwoFaResult {
	ok: boolean;
	message: string;
}

export async function require2fa(
	db: D1Database,
	userId: string,
	totpCode: string | undefined
): Promise<TwoFaResult> {
	// Check if user has 2FA enabled
	const totpRow = await db
		.prepare('SELECT secret, backup_codes, enabled FROM totp_secrets WHERE user_id = ?')
		.bind(userId)
		.first<{ secret: string; backup_codes: string; enabled: number }>();

	if (!totpRow || !totpRow.enabled) {
		return { ok: true, message: '' };
	}

	if (!totpCode) {
		return { ok: false, message: '請輸入兩步驟驗證碼' };
	}

	// Try TOTP code first
	if (verifyTotpCode(totpRow.secret, totpCode)) {
		return { ok: true, message: '' };
	}

	// Try backup codes
	const backupCodes: string[] = JSON.parse(totpRow.backup_codes);
	const codeIndex = backupCodes.indexOf(totpCode);
	if (codeIndex !== -1) {
		// Remove used backup code
		backupCodes.splice(codeIndex, 1);
		await db
			.prepare('UPDATE totp_secrets SET backup_codes = ?, updated_at = ? WHERE user_id = ?')
			.bind(JSON.stringify(backupCodes), new Date().toISOString(), userId)
			.run();
		return { ok: true, message: '' };
	}

	return { ok: false, message: '驗證碼不正確' };
}
