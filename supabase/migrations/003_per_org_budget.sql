-- Migration: Per-organization budget model
-- Replaces the single global budget with one budget record per organization.
-- Allocations are now scoped to an organization so over-allocation is checked per org.
-- Events are linked to an organization so the system knows which org's budget to check.

-- 1. Add organization_id to the budget table
ALTER TABLE budget
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Add organization_id to the allocations table
ALTER TABLE allocations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Add organization_id to the events table
--    (links an event to the org that created it, derived from the creator's organization_name)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 4. Indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_budget_org ON budget(organization_id);
CREATE INDEX IF NOT EXISTS idx_allocations_org ON allocations(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);

-- 5. Add a unique constraint so each org has at most one budget record
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_org_unique ON budget(organization_id)
  WHERE organization_id IS NOT NULL;

COMMENT ON COLUMN budget.organization_id IS 'The organization this budget belongs to. One budget record per organization.';
COMMENT ON COLUMN allocations.organization_id IS 'The organization this allocation belongs to. Used to enforce per-org budget limits.';
COMMENT ON COLUMN events.organization_id IS 'The organization that owns this event.';
