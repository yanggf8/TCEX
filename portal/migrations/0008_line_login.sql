-- LINE accounts table for OAuth linking
CREATE TABLE IF NOT EXISTS line_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    line_user_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    picture_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_line_accounts_user ON line_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_line_accounts_line_user ON line_accounts(line_user_id);
