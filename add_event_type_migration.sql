-- Migration to add event types to productions table
ALTER TABLE productions ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Theatre';
ALTER TABLE productions ADD COLUMN IF NOT EXISTS custom_event_type TEXT;

-- Update the Supabase schema file as well for new setups
