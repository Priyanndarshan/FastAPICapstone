-- Add optional receipt image URL (Cloudinary) to expenses.
-- Run once: psql -d expense_db -f migrations/add_expense_receipt_url.sql

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(2048);
