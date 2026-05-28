CREATE TABLE IF NOT EXISTS email_campaign_stats (
    campaign_id TEXT PRIMARY KEY,
    sent_count INT NOT NULL DEFAULT 0,
    opened_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE email_campaign_stats DISABLE ROW LEVEL SECURITY;
