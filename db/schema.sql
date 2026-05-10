CREATE TABLE IF NOT EXISTS redeem_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  exported INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  first_redeemed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON redeem_codes(code);

CREATE TABLE IF NOT EXISTS redeem_records (
  id TEXT PRIMARY KEY,
  redeem_code_id TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  machine_code TEXT NOT NULL,
  redeemed_at TEXT NOT NULL,
  FOREIGN KEY(redeem_code_id) REFERENCES redeem_codes(id)
);

CREATE INDEX IF NOT EXISTS idx_redeem_records_code_id ON redeem_records(redeem_code_id);
