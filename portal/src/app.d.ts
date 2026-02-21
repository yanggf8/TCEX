/// <reference types="@cloudflare/workers-types" />
// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			user: {
				id: string;
				email: string;
				displayName: string | null;
				kycLevel: number;
				emailVerified: boolean;
				totpEnabled: boolean;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				SESSIONS: KVNamespace;
				ENGINE?: Fetcher;
				JWT_SECRET: string;
				DOCUMENTS?: R2Bucket;
				LINE_CHANNEL_ID?: string;
				LINE_CHANNEL_SECRET?: string;
				LINE_REDIRECT_URI?: string;
				RESEND_API_KEY?: string;
			};
			context: ExecutionContext;
		}
	}
}

export {};
