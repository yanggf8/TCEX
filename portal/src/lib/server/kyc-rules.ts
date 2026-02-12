// KYC Level Gating
// L0: Browse only (default on registration)
// L1: Portfolio view, deposit, basic withdrawal (requires email + phone verification)
// L2: Trade up to NT$500,000/month (requires L1 + personal info + ID document)
// L3: Unlimited (requires L2 + enhanced due diligence — admin review)

export const KYC_LEVELS = {
	L0: 0,
	L1: 1,
	L2: 2,
	L3: 3
} as const;

export const KYC_REQUIREMENTS: Record<number, string[]> = {
	1: ['email_verified', 'phone_verified'],
	2: ['full_name', 'date_of_birth', 'national_id', 'address', 'id_document'],
	3: ['enhanced_due_diligence']
};

export const KYC_TRADE_LIMITS: Record<number, number> = {
	0: 0,
	1: 0,
	2: 500000,
	3: Infinity
};

export function canAutoApprove(level: number): boolean {
	return level === 1;
}
