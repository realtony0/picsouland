CREATE TABLE IF NOT EXISTS accounts (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      VARCHAR(20) UNIQUE NOT NULL,
  pin        VARCHAR(4) NOT NULL,
  points     INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  account_phone   VARCHAR(20) REFERENCES accounts(phone) ON DELETE SET NULL,
  items           JSONB NOT NULL,
  subtotal        INTEGER NOT NULL,
  delivery_zone   TEXT,
  delivery_price  INTEGER NOT NULL DEFAULT 0,
  reward_id       TEXT,
  reward_discount INTEGER NOT NULL DEFAULT 0,
  grand_total     INTEGER NOT NULL,
  points_earned   INTEGER NOT NULL DEFAULT 0,
  points_used     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_account_phone ON orders(account_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
