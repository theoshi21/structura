-- Migration: Add organization_id FK to users table
-- Replaces the loose organization_name string with a proper foreign key reference.
-- This allows direct org ID lookups without a secondary query.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

COMMENT ON COLUMN users.organization_id IS 'FK to the organization this user belongs to. Set for organizer/officer accounts; null for admin accounts.';
