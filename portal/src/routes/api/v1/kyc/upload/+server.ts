import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const POST: RequestHandler = async ({ request, locals, platform, getClientAddress }) => {
	if (!locals.user) {
		return json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
	}
	if (!platform?.env?.DB) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '服務暫時無法使用' } }, { status: 503 });
	}
	if (!platform?.env?.DOCUMENTS) {
		return json({ error: { code: 'SERVICE_UNAVAILABLE', message: '文件儲存服務暫時無法使用' } }, { status: 503 });
	}

	const db = platform.env.DB;
	const r2 = platform.env.DOCUMENTS;

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json({ error: { code: 'BAD_REQUEST', message: '無效的表單資料' } }, { status: 400 });
	}

	const file = formData.get('file') as File | null;
	const documentType = formData.get('documentType') as string | null;
	const applicationId = formData.get('applicationId') as string | null;

	if (!file || !documentType || !applicationId) {
		return json({ error: { code: 'BAD_REQUEST', message: '請提供文件、文件類型和申請ID' } }, { status: 400 });
	}

	// Validate file
	if (!ALLOWED_TYPES.includes(file.type)) {
		return json({ error: { code: 'INVALID_FILE_TYPE', message: '僅支援 JPEG、PNG、WebP 或 PDF 格式' } }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		return json({ error: { code: 'FILE_TOO_LARGE', message: '文件大小不得超過 10MB' } }, { status: 400 });
	}

	// Verify application exists and belongs to user
	const application = await db
		.prepare("SELECT id FROM kyc_applications WHERE id = ? AND user_id = ? AND status = 'pending'")
		.bind(applicationId, locals.user.id)
		.first<{ id: string }>();

	if (!application) {
		return json({ error: { code: 'NOT_FOUND', message: '申請不存在或已完成' } }, { status: 404 });
	}

	// Upload to R2
	const docId = generateId();
	const ext = file.name.split('.').pop() || 'bin';
	const r2Key = `kyc/${locals.user.id}/${applicationId}/${docId}.${ext}`;

	await r2.put(r2Key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	// Record in DB
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO kyc_documents (id, user_id, application_id, document_type, r2_key, file_name, content_type, file_size, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(docId, locals.user.id, applicationId, documentType, r2Key, file.name, file.type, file.size, now)
		.run();

	// Audit log
	await db
		.prepare(
			`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
			 VALUES (?, ?, 'kyc_document_uploaded', 'kyc_document', ?, ?, ?, ?)`
		)
		.bind(generateId(), locals.user.id, docId, `Type: ${documentType}, File: ${file.name}`, getClientAddress(), now)
		.run();

	return json({ documentId: docId, r2Key }, { status: 201 });
};
