-- Add source column to quiz_cash_credits to distinguish between different credit types
-- Run this migration on your Supabase SQL editor

ALTER TABLE quiz_cash_credits
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'quiz_conversion';

-- Update any existing rows that are exactly ₦2,000 to 'article_approval' (best guess for legacy data)
UPDATE quiz_cash_credits SET source = 'article_approval' WHERE amount_naira = 2000;
