-- Add email tracking to quiz_days
ALTER TABLE quiz_days ADD COLUMN IF NOT EXISTS emails_sent INT NOT NULL DEFAULT 0;
ALTER TABLE quiz_days ADD COLUMN IF NOT EXISTS emails_opened INT NOT NULL DEFAULT 0;

-- RPC for tracking an open safely (atomic increment)
CREATE OR REPLACE FUNCTION increment_email_opened(p_quiz_date DATE)
RETURNS VOID AS $$
BEGIN
    UPDATE quiz_days
    SET emails_opened = emails_opened + 1
    WHERE quiz_date = p_quiz_date;
END;
$$ LANGUAGE plpgsql;

-- RPC for tracking sent counts safely (atomic increment)
CREATE OR REPLACE FUNCTION increment_email_sent(p_quiz_date DATE, p_count INT)
RETURNS VOID AS $$
BEGIN
    UPDATE quiz_days
    SET emails_sent = emails_sent + p_count
    WHERE quiz_date = p_quiz_date;
END;
$$ LANGUAGE plpgsql;
