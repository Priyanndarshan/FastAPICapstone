-- Run this once to add payment_mode and transaction_type to expenses.
-- PostgreSQL (for SQLite/MySQL adjust syntax as needed).

-- 1. Add new columns (defaults apply to existing rows)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_mode VARCHAR NOT NULL DEFAULT 'CASH';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS transaction_type VARCHAR NOT NULL DEFAULT 'out';

-- 2. Drop old currency column only if it exists (skip if your table never had it)
ALTER TABLE expenses DROP COLUMN IF EXISTS currency;
