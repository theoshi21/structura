-- Migration: Add organization_id to events table
-- Events are scoped to the organization of the user who created them.
-- This allows each organization to see only their own events.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);

COMMENT ON COLUMN events.organization_id IS 'The organization this event belongs to. Null for events created before this migration.';
