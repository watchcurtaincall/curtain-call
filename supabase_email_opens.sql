
CREATE TABLE IF NOT EXISTS email_opens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id text NOT NULL,
  user_email text NOT NULL,
  opened_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, user_email)
);

