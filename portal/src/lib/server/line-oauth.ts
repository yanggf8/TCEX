const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

interface LineTokenResponse {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
	id_token?: string;
}

export interface LineProfile {
	userId: string;
	displayName: string;
	pictureUrl?: string;
	statusMessage?: string;
}

export function getLineAuthUrl(
	channelId: string,
	redirectUri: string,
	state: string
): string {
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: channelId,
		redirect_uri: redirectUri,
		state,
		scope: 'profile openid',
		bot_prompt: 'normal'
	});
	return `${LINE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLineCode(
	code: string,
	channelId: string,
	channelSecret: string,
	redirectUri: string
): Promise<LineTokenResponse> {
	const res = await fetch(LINE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri,
			client_id: channelId,
			client_secret: channelSecret
		})
	});

	if (!res.ok) {
		const error = await res.text();
		throw new Error(`LINE token exchange failed: ${error}`);
	}

	return res.json();
}

export async function getLineProfile(accessToken: string): Promise<LineProfile> {
	const res = await fetch(LINE_PROFILE_URL, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) {
		throw new Error('Failed to fetch LINE profile');
	}

	return res.json();
}
