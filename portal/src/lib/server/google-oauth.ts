const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	id_token?: string;
}

export interface GoogleProfile {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	picture?: string;
}

export function getGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: clientId,
		redirect_uri: redirectUri,
		state,
		scope: 'openid profile email',
		access_type: 'online'
	});
	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string
): Promise<GoogleTokenResponse> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri,
			client_id: clientId,
			client_secret: clientSecret
		})
	});

	if (!res.ok) {
		const error = await res.text();
		throw new Error(`Google token exchange failed: ${error}`);
	}

	return res.json();
}

export async function getGoogleProfile(accessToken: string): Promise<GoogleProfile> {
	const res = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) {
		throw new Error('Failed to fetch Google profile');
	}

	return res.json();
}
