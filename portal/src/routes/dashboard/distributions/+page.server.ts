import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/dashboard/distributions');
	}

	if (!platform?.env?.DB) {
		return { upcoming: [], past: [], userPayments: [] };
	}

	const db = platform.env.DB;

	// Upcoming distributions (announced, not yet paid)
	const { results: upcoming } = await db
		.prepare(
			`SELECT d.*, l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en
			 FROM distributions d
			 LEFT JOIN listings l ON d.listing_id = l.id
			 WHERE d.status IN ('announced', 'scheduled')
			 ORDER BY d.payment_date ASC`
		)
		.all();

	// Past distributions
	const { results: past } = await db
		.prepare(
			`SELECT d.*, l.symbol as listing_symbol, l.name_zh as listing_name_zh, l.name_en as listing_name_en
			 FROM distributions d
			 LEFT JOIN listings l ON d.listing_id = l.id
			 WHERE d.status = 'paid'
			 ORDER BY d.payment_date DESC LIMIT 20`
		)
		.all();

	// User's distribution payments
	const { results: userPayments } = await db
		.prepare(
			`SELECT dp.*, d.type as distribution_type, l.symbol as listing_symbol,
				l.name_zh as listing_name_zh, l.name_en as listing_name_en
			 FROM distribution_payments dp
			 LEFT JOIN distributions d ON dp.distribution_id = d.id
			 LEFT JOIN listings l ON dp.listing_id = l.id
			 WHERE dp.user_id = ?
			 ORDER BY dp.created_at DESC LIMIT 20`
		)
		.bind(locals.user.id)
		.all();

	return {
		upcoming: upcoming.map((r: any) => ({
			id: r.id,
			listingSymbol: r.listing_symbol,
			listingNameZh: r.listing_name_zh,
			listingNameEn: r.listing_name_en,
			type: r.type,
			amountPerUnit: r.amount_per_unit,
			totalAmount: r.total_amount,
			recordDate: r.record_date,
			paymentDate: r.payment_date,
			status: r.status,
			description: r.description
		})),
		past: past.map((r: any) => ({
			id: r.id,
			listingSymbol: r.listing_symbol,
			listingNameZh: r.listing_name_zh,
			listingNameEn: r.listing_name_en,
			type: r.type,
			amountPerUnit: r.amount_per_unit,
			totalAmount: r.total_amount,
			recordDate: r.record_date,
			paymentDate: r.payment_date,
			status: r.status
		})),
		userPayments: userPayments.map((r: any) => ({
			id: r.id,
			listingSymbol: r.listing_symbol,
			listingNameZh: r.listing_name_zh,
			listingNameEn: r.listing_name_en,
			unitsHeld: r.units_held,
			amount: r.amount,
			status: r.status,
			paidAt: r.paid_at,
			createdAt: r.created_at
		}))
	};
};
