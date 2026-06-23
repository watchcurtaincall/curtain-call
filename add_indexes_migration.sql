-- ── CREATE INDEXES FOR PERFORMANCE OPTIMIZATION ──

-- Create index on buyer_email to speed up ticket lookup on the profiles and ticket listings
CREATE INDEX IF NOT EXISTS tickets_buyer_email_idx ON tickets (buyer_email);

-- Create index on production_id to speed up reviews loading on individual show pages
CREATE INDEX IF NOT EXISTS reviews_production_id_idx ON reviews (production_id);
