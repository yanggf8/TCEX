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
