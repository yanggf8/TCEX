CREATE TABLE IF NOT EXISTS google_accounts (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE,
	google_user_id TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL,
	display_name TEXT,
	picture_url TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_google_accounts_user ON google_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_google_accounts_google_user ON google_accounts(google_user_id);
