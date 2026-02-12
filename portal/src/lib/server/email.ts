export interface EmailSender {
	send(to: string, subject: string, body: string): Promise<void>;
}

export function generateOtp(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(4));
	const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
	return String(num % 1000000).padStart(6, '0');
}

export class ConsoleEmailSender implements EmailSender {
	async send(to: string, subject: string, body: string): Promise<void> {
		console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
	}
}
