-- 0002_trading.sql — Trading core tables
-- All financial values stored as TEXT (decimal strings)
-- No foreign key constraints (document-style flexibility)

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  unit_price TEXT NOT NULL DEFAULT '0',
  total_units TEXT NOT NULL DEFAULT '0',
  available_units TEXT NOT NULL DEFAULT '0',
  yield_rate TEXT,
  risk_level TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  listed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  currency TEXT DEFAULT 'TWD',
  available_balance TEXT NOT NULL DEFAULT '0',
  locked_balance TEXT NOT NULL DEFAULT '0',
  total_deposited TEXT NOT NULL DEFAULT '0',
  total_withdrawn TEXT NOT NULL DEFAULT '0',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '0',
  average_cost TEXT NOT NULL DEFAULT '0',
  realized_pnl TEXT NOT NULL DEFAULT '0',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  side TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'limit',
  status TEXT NOT NULL DEFAULT 'pending',
  price TEXT,
  quantity TEXT NOT NULL,
  filled_quantity TEXT NOT NULL DEFAULT '0',
  remaining_quantity TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  filled_at TEXT,
  cancelled_at TEXT
);

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  buy_order_id TEXT NOT NULL,
  sell_order_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  price TEXT NOT NULL,
  quantity TEXT NOT NULL,
  total TEXT NOT NULL,
  fee_buyer TEXT NOT NULL DEFAULT '0',
  fee_seller TEXT NOT NULL DEFAULT '0',
  settlement_status TEXT DEFAULT 'pending',
  settled_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount TEXT NOT NULL,
  fee TEXT NOT NULL DEFAULT '0',
  balance_before TEXT NOT NULL,
  balance_after TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_product_type ON listings(product_type);
CREATE INDEX IF NOT EXISTS idx_listings_symbol ON listings(symbol);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_listing_id ON positions(listing_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE INDEX IF NOT EXISTS idx_trades_listing_id ON trades(listing_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON trades(seller_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_listing_id ON watchlist(listing_id);
