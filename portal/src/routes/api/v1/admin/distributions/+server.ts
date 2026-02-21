import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { sendNotification, distributionEmail } from '$lib/server/notifications';

export const POST: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE' } }, { status: 503 });
	}

	const db = platform.env.DB;

	// Verify admin role
	const adminUser = await db
		.prepare('SELECT role FROM users WHERE id = ?')
		.bind(locals.user.id)
		.first<{ role: string }>();

	if (!adminUser || adminUser.role !== 'admin') {
		return json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
	}

	let body: { listingId?: string; totalRevenue?: string; description?: string | null };
	try {
		body = await request.json();
	} catch {
		return json({ error: { code: 'BAD_REQUEST' } }, { status: 400 });
	}

	if (!body.listingId || !body.totalRevenue) {
		return json({ error: { code: 'MISSING_FIELDS' } }, { status: 400 });
	}

	const totalRevenue = parseFloat(body.totalRevenue);
	if (isNaN(totalRevenue) || totalRevenue <= 0) {
		return json({ error: { code: 'INVALID_AMOUNT' } }, { status: 400 });
	}

	// Get listing + total issued units
	const listing = await db
		.prepare("SELECT id, symbol, total_units, available_units FROM listings WHERE id = ? AND status = 'active'")
		.bind(body.listingId)
		.first<{ id: string; symbol: string; total_units: string; available_units: string }>();

	if (!listing) {
		return json({ error: { code: 'LISTING_NOT_FOUND' } }, { status: 404 });
	}

	// Held units = total_units - available_units (units in circulation)
	const totalUnits = parseFloat(listing.total_units);
	const availableUnits = parseFloat(listing.available_units);
	const heldUnits = totalUnits - availableUnits;

	if (heldUnits <= 0) {
		return json({ error: { code: 'NO_POSITIONS' } }, { status: 400 });
	}

	const amountPerUnit = totalRevenue / heldUnits;
	const now = new Date().toISOString();
	const today = now.slice(0, 10);

	// Get all holders with positive positions + email for notifications
	const { results: positions } = await db
		.prepare(`
			SELECT p.user_id, p.quantity,
				w.id as wallet_id, w.available_balance,
				u.email, u.display_name
			FROM positions p
			JOIN wallets w ON w.user_id = p.user_id AND w.currency = 'TWD'
			JOIN users u ON u.id = p.user_id
			WHERE p.listing_id = ? AND CAST(p.quantity AS REAL) > 0
		`)
		.bind(body.listingId)
		.all<{
			user_id: string; quantity: string;
			wallet_id: string; available_balance: string;
			email: string; display_name: string | null;
		}>();

	if (positions.length === 0) {
		return json({ error: { code: 'NO_POSITIONS' } }, { status: 400 });
	}

	// Create distribution record
	const distributionId = generateId();
	const actualTotal = positions.reduce((sum, p) => {
		return sum + parseFloat(p.quantity) * amountPerUnit;
	}, 0);

	await db.prepare(`
		INSERT INTO distributions (id, listing_id, type, amount_per_unit, total_amount, record_date, payment_date, status, description, created_at, updated_at)
		VALUES (?, ?, 'revenue', ?, ?, ?, ?, 'paid', ?, ?, ?)
	`).bind(
		distributionId, body.listingId,
		amountPerUnit.toFixed(8),
		actualTotal.toFixed(2),
		today, today,
		body.description ?? null,
		now, now
	).run();

	// Credit each holder
	for (const pos of positions) {
		const qty = parseFloat(pos.quantity);
		const paymentAmount = qty * amountPerUnit;
		const paymentAmountStr = paymentAmount.toFixed(2);
		const balanceBefore = parseFloat(pos.available_balance);
		const balanceAfter = balanceBefore + paymentAmount;

		const paymentId = generateId();
		const txId = generateId();

		// distribution_payments record
		await db.prepare(`
			INSERT INTO distribution_payments (id, distribution_id, user_id, listing_id, units_held, amount, status, paid_at, created_at)
			VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?)
		`).bind(
			paymentId, distributionId, pos.user_id, body.listingId,
			pos.quantity, paymentAmountStr, now, now
		).run();

		// Wallet transaction
		await db.prepare(`
			INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount, fee, balance_before, balance_after, reference_type, reference_id, description, status, created_at)
			VALUES (?, ?, ?, 'distribution', ?, '0', ?, ?, 'distribution', ?, ?, 'completed', ?)
		`).bind(
			txId, pos.wallet_id, pos.user_id,
			paymentAmountStr,
			balanceBefore.toFixed(2),
			balanceAfter.toFixed(2),
			distributionId,
			`${listing.symbol} 收入分成`,
			now
		).run();

		// Credit wallet
		await db.prepare(`
			UPDATE wallets SET available_balance = ?, updated_at = ? WHERE id = ?
		`).bind(balanceAfter.toFixed(2), now, pos.wallet_id).run();

		// Notify holder (non-blocking)
		sendNotification(
			platform.env.RESEND_API_KEY,
			pos.email,
			`【TCEX】${listing.symbol} 收入分成入帳通知`,
			distributionEmail(pos.display_name, listing.symbol, paymentAmountStr, balanceAfter.toFixed(2))
		);
	}

	// Audit log
	await db.prepare(`
		INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
		VALUES (?, ?, 'distribution_execute', 'distribution', ?, ?, ?, ?)
	`).bind(
		generateId(), locals.user.id, distributionId,
		`listing=${listing.symbol}, total=${actualTotal.toFixed(2)}, recipients=${positions.length}`,
		getClientAddress(), now
	).run();

	return json({
		distributionId,
		listingSymbol: listing.symbol,
		totalAmount: actualTotal.toFixed(2),
		amountPerUnit: amountPerUnit.toFixed(8),
		recipientCount: positions.length
	}, { status: 201 });
};
