export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface KycApplication {
	id: string;
	userId: string;
	level: number;
	status: KycStatus;
	reviewerNotes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface KycDocument {
	id: string;
	userId: string;
	applicationId: string;
	documentType: string;
	r2Key: string;
	fileName: string;
	contentType: string;
	fileSize: number;
	createdAt: string;
}

export interface KycUserProfile {
	kycLevel: number;
	emailVerified: boolean;
	phoneVerified: boolean;
	fullName: string | null;
	dateOfBirth: string | null;
	nationalId: string | null;
	address: string | null;
	currentApplication: KycApplication | null;
}
