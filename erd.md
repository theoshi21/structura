# Structura — Entity Relationship Diagram

## Tables & Attributes

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| username | VARCHAR(100) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | NOT NULL, CHECK IN ('organizer', 'officer', 'admin') |
| organization_name | VARCHAR(255) | NULL — student org name, freely entered at registration |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

> `organization_name` is populated for organizer/officer accounts at registration. Admin/officer accounts from the school office leave this null.

---

### organizations
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| contact_email | VARCHAR(255) | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

> Created by admins. Students select their organization from this list at registration.

---

### events
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| event_date | DATE | NOT NULL |
| location | VARCHAR(255) | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'proposed', CHECK IN ('proposed', 'approved', 'completed', 'cancelled') |
| created_by | UUID | FK → users(id) ON DELETE SET NULL |
| organization_id | UUID | FK → organizations(id) ON DELETE SET NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

> `organization_id` links the event to the organization that created it, enabling per-org budget enforcement.

---

### documents
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| event_id | UUID | FK → events(id) ON DELETE CASCADE |
| file_name | VARCHAR(255) | NOT NULL |
| file_path | VARCHAR(500) | NOT NULL |
| file_size | INTEGER | NOT NULL |
| file_type | VARCHAR(100) | NOT NULL |
| document_type | VARCHAR(50) | NOT NULL, CHECK IN ('permit', 'contract', 'promotional', 'receipt', 'financial') |
| uploaded_by | UUID | FK → users(id) ON DELETE SET NULL |
| uploaded_at | TIMESTAMP | DEFAULT NOW() |

---

### checklist_templates
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| created_by | UUID | FK → users(id) ON DELETE SET NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

---

### checklist_template_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| template_id | UUID | FK → checklist_templates(id) ON DELETE CASCADE |
| description | TEXT | NOT NULL |
| order_index | INTEGER | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### checklists
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| event_id | UUID | UNIQUE, FK → events(id) ON DELETE CASCADE |
| created_from_template | UUID | FK → checklist_templates(id) ON DELETE SET NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### checklist_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| checklist_id | UUID | FK → checklists(id) ON DELETE CASCADE |
| description | TEXT | NOT NULL |
| is_completed | BOOLEAN | DEFAULT FALSE |
| completed_at | TIMESTAMP | |
| completed_by | UUID | FK → users(id) ON DELETE SET NULL |
| order_index | INTEGER | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### budget
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| organization_id | UUID | UNIQUE, FK → organizations(id) ON DELETE CASCADE |
| total_funds | DECIMAL(12,2) | NOT NULL, DEFAULT 0 |
| updated_by | UUID | FK → users(id) ON DELETE SET NULL |
| updated_at | TIMESTAMP | DEFAULT NOW() |

> One record per organization. The admin sets the total budget for each org. Enforced by a unique index on `organization_id`.

---

### allocations
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| event_id | UUID | UNIQUE, FK → events(id) ON DELETE CASCADE |
| organization_id | UUID | FK → organizations(id) ON DELETE CASCADE |
| amount | DECIMAL(12,2) | NOT NULL |
| allocated_by | UUID | FK → users(id) ON DELETE SET NULL |
| allocated_at | TIMESTAMP | DEFAULT NOW() |

> Each event has at most one allocation. `organization_id` is used to enforce that the allocation does not exceed the org's available budget.

---

### expenditures
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| event_id | UUID | FK → events(id) ON DELETE CASCADE |
| amount | DECIMAL(12,2) | NOT NULL |
| description | TEXT | NOT NULL |
| document_id | UUID | FK → documents(id) ON DELETE SET NULL |
| recorded_by | UUID | FK → users(id) ON DELETE SET NULL |
| recorded_at | TIMESTAMP | DEFAULT NOW() |

> Every expenditure must reference a supporting document (receipt or financial record).

---

### audit_trail
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | NOT NULL |
| user_id | UUID | FK → users(id) ON DELETE SET NULL |
| details | JSONB | |
| created_at | TIMESTAMP | DEFAULT NOW() |

> Immutable — no UPDATE or DELETE allowed on this table.

---

## Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| users → events | One-to-Many | A user can create many events |
| organizations → events | One-to-Many | An organization owns many events |
| events → documents | One-to-Many | An event can have many documents |
| users → documents | One-to-Many | A user can upload many documents |
| checklist_templates → checklist_template_items | One-to-Many | A template has many items |
| users → checklist_templates | One-to-Many | A user (admin) can create many templates |
| events → checklists | One-to-One | Each event has at most one checklist |
| checklist_templates → checklists | One-to-Many | A template can be applied to many event checklists |
| checklists → checklist_items | One-to-Many | A checklist has many items |
| users → checklist_items | One-to-Many | A user can complete many checklist items |
| organizations → budget | One-to-One | Each organization has exactly one budget record |
| events → allocations | One-to-One | Each event has at most one budget allocation |
| organizations → allocations | One-to-Many | An org's budget is split into many event allocations |
| events → expenditures | One-to-Many | An event can have many expenditures |
| documents → expenditures | One-to-Many | A document can support many expenditures |
| users → audit_trail | One-to-Many | A user's actions are logged in many audit entries |

---

## ERD Notation (for manual drawing)

```
users ||--o{ events               : "creates"
users ||--o{ documents            : "uploads"
users ||--o{ checklist_templates  : "creates"
users ||--o{ checklist_items      : "completes"
users ||--o{ audit_trail          : "generates"
users ||--o{ allocations          : "allocates"
users ||--o{ expenditures         : "records"

organizations ||--o{ events       : "owns"
organizations ||--|| budget       : "has one"
organizations ||--o{ allocations  : "funds via"

events ||--o{ documents           : "has"
events ||--|| checklists          : "has one"
events ||--|| allocations         : "has one"
events ||--o{ expenditures        : "has"

checklist_templates ||--o{ checklist_template_items : "contains"
checklist_templates ||--o{ checklists               : "applied to"

checklists ||--o{ checklist_items : "contains"

documents ||--o{ expenditures     : "supports"
```

> Notation: `||` = exactly one, `o{` = zero or many, `||--||` = one-to-one

---

## Indexes

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| idx_users_email | users | email | Fast login lookup |
| idx_users_role | users | role | Filter users by role |
| idx_events_created_by | events | created_by | Filter events by creator |
| idx_events_status | events | status | Filter events by status |
| idx_events_event_date | events | event_date | Filter events by date range |
| idx_events_org | events | organization_id | Filter events by organization |
| idx_documents_event_id | documents | event_id | Fetch documents per event |
| idx_documents_document_type | documents | document_type | Filter documents by type |
| idx_checklist_template_items_template_id | checklist_template_items | template_id | Fetch items per template |
| idx_checklist_items_checklist_id | checklist_items | checklist_id | Fetch items per checklist |
| idx_checklist_items_completed | checklist_items | is_completed | Filter completed items |
| idx_allocations_event_id | allocations | event_id | Fetch allocation per event |
| idx_allocations_org | allocations | organization_id | Fetch allocations per org |
| idx_budget_org | budget | organization_id | Fetch budget per org |
| idx_budget_org_unique | budget | organization_id | Enforce one budget per org |
| idx_expenditures_event_id | expenditures | event_id | Fetch expenditures per event |
| idx_audit_trail_entity | audit_trail | entity_type, entity_id | Fetch audit logs per entity |
| idx_audit_trail_user | audit_trail | user_id | Fetch audit logs per user |
| idx_audit_trail_created_at | audit_trail | created_at | Sort audit logs by time |

---

## Migration History

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Initial schema — all core tables |
| `002_add_organization_name.sql` | Added `organization_name` to `users` for student org display |
| `003_per_org_budget.sql` | Added `organization_id` to `budget`, `allocations`, and `events` for per-org budget model |

---

Document Version: 1.3
Last Updated: May 2026
