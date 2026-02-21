-- Add role to users
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Add review fields to kyc_applications
ALTER TABLE kyc_applications ADD COLUMN reviewed_by TEXT;
ALTER TABLE kyc_applications ADD COLUMN reviewed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
