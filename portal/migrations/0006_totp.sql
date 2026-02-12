-- TOTP secrets table for 2FA
CREATE TABLE IF NOT EXISTS totp_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    secret TEXT NOT NULL,
    backup_codes TEXT NOT NULL,
    enabled INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_totp_secrets_user ON totp_secrets(user_id);

-- Add totp_enabled column to users
ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0;
