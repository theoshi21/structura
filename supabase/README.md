# Supabase Database Migrations

This directory contains SQL migration files for the Structura database schema.

## Migration Files

### 001_initial_schema.sql

Creates the complete database schema including:

**Tables:**
- `users` - User accounts with authentication and role-based access control
- `organizations` - Organization metadata (single record)
- `events` - Event proposals and lifecycle management
- `documents` - Document files associated with events
- `checklist_templates` - Reusable checklist templates
- `checklist_template_items` - Items within checklist templates
- `checklists` - Event-specific checklists
- `checklist_items` - Individual tasks within checklists
- `budget` - Organizational budget (single record)
- `allocations` - Fund allocations to events
- `expenditures` - Actual spending recorded against events
- `audit_trail` - Immutable log of critical operations

**Features:**
- UUID primary keys using `uuid-ossp` extension
- Foreign key constraints with appropriate cascade/set null behavior
- Check constraints for enum-like fields (role, status, document_type)
- Performance indexes on frequently queried columns
- Table comments for documentation

## Running Migrations

### Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `001_initial_schema.sql`
4. Paste and execute the SQL

### Manual PostgreSQL

If you're using a standalone PostgreSQL database:

```bash
psql -U your_username -d your_database -f supabase/migrations/001_initial_schema.sql
```

## Schema Validation

The database schema has been validated with property-based tests to ensure:

- **Referential Integrity**: All foreign key relationships are properly maintained
- **Cascade Deletes**: Parent record deletion properly cascades to child records
- **No Orphaned Records**: Related data cannot exist without parent records

See `lib/database.test.ts` for the property-based tests.

## TypeScript Types

TypeScript interfaces matching this schema are defined in `types/index.ts`. These types provide:

- Type safety for database operations
- IntelliSense support in IDEs
- Compile-time validation of data structures
- Input/output type definitions for API endpoints

## Requirements Validation

This schema satisfies the following requirements:

- **Requirement 9.4**: Data persistence with referential integrity
- **Requirement 16.2**: Single organizational budget per deployment
- **Requirement 3.4**: TypeScript types matching schema

## Notes

- The schema uses `ON DELETE CASCADE` for child records that should be deleted with their parent
- The schema uses `ON DELETE SET NULL` for optional foreign keys where the relationship can be broken
- All timestamp fields use `TIMESTAMP DEFAULT NOW()` for automatic timestamping
- The `audit_trail` table is designed to be append-only (no updates or deletes)
