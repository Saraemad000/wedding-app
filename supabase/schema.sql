CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS guest_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('attending', 'not-attending', 'pending')),
  guests_count INTEGER NOT NULL DEFAULT 1,
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guest_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow guest wishes insert"
ON guest_wishes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow approved wishes read"
ON guest_wishes
FOR SELECT
USING (approved = true);

CREATE POLICY "allow rsvp insert"
ON rsvp_responses
FOR INSERT
WITH CHECK (true);

-- No public SELECT policy for RSVP responses: keep guest RSVP data private.

