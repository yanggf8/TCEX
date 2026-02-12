-- 0004_distributions.sql — Distribution tables
-- Track revenue distributions to investors

CREATE TABLE IF NOT EXISTS distributions (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'revenue',
  amount_per_unit TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  record_date TEXT NOT NULL,
  payment_date TEXT,
  status TEXT DEFAULT 'announced',
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS distribution_payments (
  id TEXT PRIMARY KEY,
  distribution_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  units_held TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_distributions_listing_id ON distributions(listing_id);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON distributions(status);
CREATE INDEX IF NOT EXISTS idx_distribution_payments_user_id ON distribution_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_distribution_payments_distribution_id ON distribution_payments(distribution_id);
