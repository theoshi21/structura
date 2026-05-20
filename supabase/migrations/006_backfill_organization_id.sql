-- Migration: Backfill organization_id on users and events
-- Users created before migration 005 have organization_name set but organization_id null.
-- Events created before migration 004 have organization_id null.
-- This migration resolves both by joining on the organizations table.

-- 1. Backfill organization_id on users where organization_name matches an org
UPDATE users
SET organization_id = organizations.id
FROM organizations
WHERE users.organization_name = organizations.name
  AND users.organization_id IS NULL
  AND users.organization_name IS NOT NULL;

-- 2. Backfill organization_id on events from the creating user's organization
UPDATE events
SET organization_id = users.organization_id
FROM users
WHERE events.created_by = users.id
  AND events.organization_id IS NULL
  AND users.organization_id IS NOT NULL;

COMMENT ON TABLE users IS 'organization_id backfilled from organization_name via migration 006';
COMMENT ON TABLE events IS 'organization_id backfilled from creating user via migration 006';
