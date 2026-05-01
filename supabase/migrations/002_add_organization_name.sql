-- Migration: Add organization_name to users table
-- Each student user belongs to one organization they name at registration.
-- Admins and officers leave this null (they belong to an office, not a student org).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN users.organization_name IS 'Student organization name, freely entered at registration. Null for admin/officer accounts.';
