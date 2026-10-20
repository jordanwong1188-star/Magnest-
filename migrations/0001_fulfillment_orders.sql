-- Create this database in Cloudflare D1 and bind it to Pages Functions as ORDERS_DB.
-- Contains customer shipping information: restrict database access and set a retention policy.
CREATE TABLE IF NOT EXISTS fulfillment_orders (
  session_id TEXT PRIMARY KEY,
  stripe_event_id TEXT NOT NULL,
  payment_link_id TEXT NOT NULL,
  shelf_quantity INTEGER NOT NULL CHECK (shelf_quantity BETWEEN 1 AND 12),
  amount_total INTEGER,
  currency TEXT NOT NULL CHECK (currency = 'usd'),
  email TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address_json TEXT,
  fulfillment_state TEXT NOT NULL CHECK (
    fulfillment_state IN ('awaiting_supplier_configuration', 'needs_shipping_review',
      'cj_draft_requested', 'cj_unpaid', 'fulfilled', 'canceled')
  ),
  cj_order_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_state ON fulfillment_orders (fulfillment_state, created_at);
