export interface EmailVerification {
	id: string;
	userId: string;
	code: string;
	expiresAt: string;
	used: boolean;
	createdAt: string;
}
