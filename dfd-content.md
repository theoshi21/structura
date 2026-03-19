# Structura — DFD Content Reference

This document lists all entities, processes, data stores, and data flows for every DFD level.
Use this as a direct reference when drawing manually.

---

## External Entities (used across all levels)

| ID | Entity | Description |
|----|--------|-------------|
| E1 | Organizer | Creates events, manages checklists, views budget info |
| E2 | Officer | Manages documents, records expenditures, approves events |
| E3 | Admin | Full access — manages users, roles, budget, templates, audit logs |

> Note: In diagrams, Organizer, Officer, and Admin can be drawn as separate rectangles or grouped as "User" at Level 0.

---

## Data Stores (used across Level 1 and Level 2)

| ID | Table Name | Key Columns |
|----|------------|-------------|
| D1 | users | id, email, username, password_hash, role, created_at, updated_at |
| D2 | events | id, name, description, event_date, location, status, created_by, created_at, updated_at |
| D3 | documents | id, event_id, file_name, file_path, file_size, file_type, document_type, uploaded_by, uploaded_at |
| D4 | checklists | id, event_id, created_from_template, created_at |
| D4a | checklist_items | id, checklist_id, description, is_completed, completed_at, completed_by, order_index, created_at |
| D5 | checklist_templates | id, name, created_by, created_at, updated_at |
| D5a | checklist_template_items | id, template_id, description, order_index, created_at |
| D6 | budget | id, total_funds, updated_by, updated_at *(single-row org budget)* |
| D6a | allocations | id, event_id, amount, allocated_by, allocated_at |
| D6b | expenditures | id, event_id, amount, description, document_id, recorded_by, recorded_at |
| D7 | audit_trail | id, action, entity_type, entity_id, user_id, details (JSONB), created_at |
| D8 | organization | id, name, description, contact_email, created_at, updated_at |

---

---

# LEVEL 0 — Context Diagram

## Single Process
| ID | Process |
|----|---------|
| 0 | Structura System |

## Entities
- E1 Organizer
- E2 Officer
- E3 Admin

## Data Flows

| From | Data | To |
|------|------|----|
| E1 Organizer | registration data, login credentials, event form data, checklist actions | 0 Structura System |
| E2 Officer | login credentials, document upload, expenditure data, event status update | 0 Structura System |
| E3 Admin | login credentials, user role assignment, budget amount, checklist template data | 0 Structura System |
| 0 Structura System | session token, event details, checklist status, budget summary | E1 Organizer |
| 0 Structura System | session token, event details, document list, budget dashboard | E2 Officer |
| 0 Structura System | session token, user list, audit logs, full budget dashboard | E3 Admin |
| 0 Structura System | error / denial message | E1, E2, E3 (on invalid action) |

---

---

# LEVEL 1 — Major Processes

## Processes

| ID | Process |
|----|---------|
| 1.0 | Manage Authentication |
| 2.0 | Manage Events |
| 3.0 | Manage Documents |
| 4.0 | Manage Checklists |
| 5.0 | Manage Budget |
| 6.0 | Manage Audit Trail |
| 7.0 | Manage Users & Roles |

---

## Level 1 Data Flows

### 1.0 Manage Authentication
| From | Data | To |
|------|------|----|
| E1 / E2 / E3 | registration data (username, email, password) | 1.0 |
| E1 / E2 / E3 | login credentials (username, password) | 1.0 |
| E1 / E2 / E3 | logout request | 1.0 |
| 1.0 | hashed password, user record | D1 Users |
| D1 Users | stored user record | 1.0 |
| 1.0 | session token | E1 / E2 / E3 |
| 1.0 | error message (invalid credentials) | E1 / E2 / E3 |
| 1.0 | audit entry (login/logout action) | 6.0 Manage Audit Trail |

---

### 2.0 Manage Events
| From | Data | To |
|------|------|----|
| E1 / E2 / E3 | event form data (name, description, date, location) | 2.0 |
| E1 / E2 / E3 | event update data | 2.0 |
| E1 / E2 / E3 | delete request (event_id) | 2.0 |
| E2 / E3 | status change request (event_id, new status) | 2.0 |
| E1 / E2 / E3 | view event request (event_id) | 2.0 |
| 2.0 | event record (write) | D2 Events |
| D2 Events | event record (read) | 2.0 |
| 2.0 | event details (name, status, date, documents, checklist, budget) | E1 / E2 / E3 |
| 2.0 | error message (unauthorized) | E1 / E2 / E3 |
| 2.0 | audit entry (create/update/delete/status change) | 6.0 Manage Audit Trail |

---

### 3.0 Manage Documents
| From | Data | To |
|------|------|----|
| E2 / E3 | document file + metadata (event_id, file_type) | 3.0 |
| E2 / E3 | delete request (document_id) | 3.0 |
| E1 / E2 / E3 | view documents request (event_id) | 3.0 |
| 3.0 | document record (write) | D3 Documents |
| D3 Documents | document list (read) | 3.0 |
| D2 Events | event record (read, to verify event exists) | 3.0 |
| 3.0 | document list with types and dates | E1 / E2 / E3 |
| 3.0 | validation error (invalid file type/size) | E2 / E3 |

---

### 4.0 Manage Checklists
| From | Data | To |
|------|------|----|
| E3 | template data (name, items) | 4.0 |
| E1 / E2 / E3 | apply template request (event_id, template_id) | 4.0 |
| E1 / E2 / E3 | custom checklist data (event_id, items) | 4.0 |
| E1 / E2 / E3 | item action (add/modify/remove item) | 4.0 |
| E1 / E2 / E3 | mark complete request (item_id) | 4.0 |
| E1 / E2 / E3 | view checklist request (event_id) | 4.0 |
| 4.0 | checklist record (write) | D4 Checklists |
| D4 Checklists | checklist items + status (read) | 4.0 |
| 4.0 | template record (write) | D5 Checklist Templates |
| D5 Checklist Templates | template items (read) | 4.0 |
| D2 Events | event record (read) | 4.0 |
| 4.0 | checklist with completion percentage | E1 / E2 / E3 |

---

### 5.0 Manage Budget
| From | Data | To |
|------|------|----|
| E3 | budget amount (set/update org budget) | 5.0 |
| E3 | allocation data (event_id, amount) | 5.0 |
| E2 / E3 | expenditure data (event_id, amount, document_id) | 5.0 |
| E1 / E2 / E3 | view budget request | 5.0 |
| 5.0 | budget record (write) | D6 budget |
| 5.0 | allocation record (write) | D6a allocations |
| 5.0 | expenditure record (write) | D6b expenditures |
| D6 budget | total_funds (read) | 5.0 |
| D6a allocations | allocation data (read) | 5.0 |
| D6b expenditures | expenditure data (read) | 5.0 |
| D2 events | event record (read) | 5.0 |
| D3 documents | financial document (read, required for expenditure) | 5.0 |
| 5.0 | budget summary (allocated, spent, remaining) | E1 / E2 / E3 |
| 5.0 | error message (over-allocation) | E3 |
| 5.0 | audit entry (allocation/expenditure) | 6.0 Manage Audit Trail |

---

### 6.0 Manage Audit Trail
| From | Data | To |
|------|------|----|
| 1.0 / 2.0 / 5.0 / 7.0 | audit entry (user_id, action_type, target_id, timestamp) | 6.0 |
| E3 | view audit log request | 6.0 |
| 6.0 | audit record (write) | D7 Audit Log |
| D7 Audit Log | audit records (read) | 6.0 |
| 6.0 | audit log list (user, action, timestamp) | E3 |

---

### 7.0 Manage Users & Roles
| From | Data | To |
|------|------|----|
| E3 | new user data (username, email, password, role) | 7.0 |
| E3 | role update (user_id, new_role) | 7.0 |
| E3 | view users request | 7.0 |
| 7.0 | user record (write) | D1 Users |
| D1 Users | user list (read) | 7.0 |
| 7.0 | user list with roles | E3 |
| 7.0 | role permission check result | 2.0 / 3.0 / 4.0 / 5.0 |
| 7.0 | audit entry (role change) | 6.0 Manage Audit Trail |

---

---

# LEVEL 2 — Sub-Process Detail

---

## 1.0 Manage Authentication → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 1.1 | Register User |
| 1.2 | Validate Credentials |
| 1.3 | Create Session |
| 1.4 | Destroy Session |

### Data Flows

| From | Data | To |
|------|------|----|
| E1 / E2 / E3 | registration data (username, email, password) | 1.1 Register User |
| 1.1 | hashed password + user record | D1 Users |
| 1.1 | registration confirmation | E1 / E2 / E3 |
| E1 / E2 / E3 | login credentials (username, password) | 1.2 Validate Credentials |
| D1 Users | stored user record | 1.2 |
| 1.2 | valid user data | 1.3 Create Session |
| 1.2 | error message (invalid credentials) | E1 / E2 / E3 |
| 1.3 | session token | E1 / E2 / E3 |
| E1 / E2 / E3 | logout request | 1.4 Destroy Session |
| 1.4 | session invalidated confirmation | E1 / E2 / E3 |

---

## 2.0 Manage Events → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 2.1 | Create Event Proposal |
| 2.2 | Update Event Proposal |
| 2.3 | Delete Event Proposal |
| 2.4 | Change Event Status |
| 2.5 | View Event Details |

### Data Flows

| From | Data | To |
|------|------|----|
| E1 / E2 / E3 | event form data (name, description, date, location) | 2.1 Create Event Proposal |
| 2.1 | new event record (status = Proposed) | D2 Events |
| 2.1 | event_id, action = created | D7 Audit Log |
| 2.1 | event confirmation | E1 / E2 / E3 |
| E1 / E2 / E3 | updated event data (event_id + fields) | 2.2 Update Event Proposal |
| D2 Events | existing event record | 2.2 |
| 2.2 | updated event record | D2 Events |
| 2.2 | event_id, action = updated | D7 Audit Log |
| 2.2 | update confirmation | E1 / E2 / E3 |
| E1 / E2 / E3 | delete request (event_id) | 2.3 Delete Event Proposal |
| D2 Events | event record | 2.3 |
| 2.3 | deleted event record | D2 Events |
| 2.3 | event_id, action = deleted | D7 Audit Log |
| 2.3 | deletion confirmation | E1 / E2 / E3 |
| E2 / E3 | status change request (event_id, new status) | 2.4 Change Event Status |
| D2 Events | current event record | 2.4 |
| 2.4 | updated status | D2 Events |
| 2.4 | event_id, action = status changed | D7 Audit Log |
| 2.4 | status update confirmation | E2 / E3 |
| E1 / E2 / E3 | view request (event_id) | 2.5 View Event Details |
| D2 Events | event record | 2.5 |
| 2.5 | full event details (name, status, date, location) | E1 / E2 / E3 |

---

## 3.0 Manage Documents → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 3.1 | Validate File |
| 3.2 | Upload Document |
| 3.3 | Link Document to Event |
| 3.4 | View Documents |
| 3.5 | Delete Document |

### Data Flows

| From | Data | To |
|------|------|----|
| E2 / E3 | document file + metadata (event_id, file_type) | 3.1 Validate File |
| 3.1 | validation error (invalid type/size) | E2 / E3 |
| 3.1 | validated file + metadata | 3.2 Upload Document |
| 3.2 | file stored in storage | D3 Documents |
| 3.2 | file_url + metadata | 3.3 Link Document to Event |
| D2 Events | event record (verify event exists) | 3.3 |
| 3.3 | document record with event_id | D3 Documents |
| 3.3 | upload confirmation | E2 / E3 |
| E1 / E2 / E3 | view documents request (event_id) | 3.4 View Documents |
| D3 Documents | document list for event | 3.4 |
| 3.4 | document list (name, type, date) | E1 / E2 / E3 |
| E2 / E3 | delete request (document_id) | 3.5 Delete Document |
| D3 Documents | document record | 3.5 |
| 3.5 | removed document record | D3 Documents |
| 3.5 | deletion confirmation | E2 / E3 |

---

## 4.0 Manage Checklists → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 4.1 | Create Checklist Template |
| 4.2 | Apply Template to Event |
| 4.3 | Create Custom Checklist |
| 4.4 | Add / Modify / Remove Checklist Item |
| 4.5 | Mark Item as Complete |
| 4.6 | Calculate Completion Percentage |

### Data Flows

| From | Data | To |
|------|------|----|
| E3 | template data (name, items) | 4.1 Create Checklist Template |
| 4.1 | template record | D5 Checklist Templates |
| 4.1 | template confirmation | E3 |
| E1 / E2 / E3 | apply template request (event_id, template_id) | 4.2 Apply Template to Event |
| D5 Checklist Templates | template items | 4.2 |
| D2 Events | event record | 4.2 |
| 4.2 | copied checklist items | D4 Checklists |
| 4.2 | checklist applied confirmation | E1 / E2 / E3 |
| E1 / E2 / E3 | custom checklist data (event_id, items) | 4.3 Create Custom Checklist |
| D2 Events | event record | 4.3 |
| 4.3 | new checklist record | D4 Checklists |
| 4.3 | checklist created confirmation | E1 / E2 / E3 |
| E1 / E2 / E3 | item action (add/modify/remove, item data) | 4.4 Add / Modify / Remove Checklist Item |
| D4 Checklists | existing checklist | 4.4 |
| 4.4 | updated checklist | D4 Checklists |
| 4.4 | item update confirmation | E1 / E2 / E3 |
| E1 / E2 / E3 | mark complete request (item_id) | 4.5 Mark Item as Complete |
| D4 Checklists | checklist item | 4.5 |
| 4.5 | updated item (is_complete = true, completed_at) | D4 Checklists |
| 4.5 | updated item status | 4.6 Calculate Completion Percentage |
| D4 Checklists | all items for event | 4.6 |
| 4.6 | completion percentage | E1 / E2 / E3 |

---

## 5.0 Manage Budget → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 5.1 | Set Organizational Budget |
| 5.2 | Allocate Funds to Event |
| 5.3 | Record Expenditure |
| 5.4 | Calculate Remaining Funds |
| 5.5 | View Budget Dashboard |

### Data Flows

| From | Data | To |
|------|------|----|
| E3 | budget amount (total_funds) | 5.1 Set Organizational Budget |
| 5.1 | budget record (total_funds) | D6 budget |
| 5.1 | budget set confirmation | E3 |
| E3 | allocation data (event_id, amount) | 5.2 Allocate Funds to Event |
| D6 budget | current total_funds | 5.2 |
| D6a allocations | existing allocations (sum) | 5.2 |
| D2 events | event record | 5.2 |
| 5.2 | new allocation record | D6a allocations |
| 5.2 | allocation_amount, event_id | 5.4 Calculate Remaining Funds |
| 5.2 | error message (over-allocation) | E3 |
| 5.2 | audit entry (allocation) | D7 audit_trail |
| 5.2 | allocation confirmation | E3 |
| E2 / E3 | expenditure data (event_id, amount, description, document_id) | 5.3 Record Expenditure |
| D3 documents | financial document (verify exists) | 5.3 |
| D6a allocations | event allocation record | 5.3 |
| 5.3 | new expenditure record | D6b expenditures |
| 5.3 | expenditure_amount, event_id | 5.4 Calculate Remaining Funds |
| 5.3 | audit entry (expenditure) | D7 audit_trail |
| 5.3 | expenditure confirmation | E2 / E3 |
| 5.2 / 5.3 | allocation and expenditure data | 5.4 Calculate Remaining Funds |
| D6 budget | total_funds | 5.4 |
| D6a allocations | all allocation amounts | 5.4 |
| D6b expenditures | all expenditure amounts per event | 5.4 |
| 5.4 | computed remaining funds | 5.5 View Budget Dashboard |
| E1 / E2 / E3 | view budget request | 5.5 View Budget Dashboard |
| D6 budget | total_funds | 5.5 |
| D6a allocations | allocation records | 5.5 |
| D6b expenditures | expenditure records | 5.5 |
| 5.5 | budget summary (total, allocated, spent, remaining) | E1 / E2 / E3 |
| 5.5 | over-budget warning | E2 / E3 |

---

## 6.0 Manage Audit Trail → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 6.1 | Record Audit Entry |
| 6.2 | View Audit Logs |

### Data Flows

| From | Data | To |
|------|------|----|
| 1.0 / 2.0 / 5.0 / 7.0 | audit entry (user_id, action_type, target_id, timestamp) | 6.1 Record Audit Entry |
| 6.1 | immutable audit record | D7 Audit Log |
| E3 | view audit log request (filter: optional) | 6.2 View Audit Logs |
| D7 Audit Log | all audit records | 6.2 |
| 6.2 | audit log list (user, action, target, timestamp) | E3 |

---

## 7.0 Manage Users & Roles → Level 2

### Sub-Processes
| ID | Sub-Process |
|----|-------------|
| 7.1 | Create User Account |
| 7.2 | Assign Role to User |
| 7.3 | Update User Role |
| 7.4 | View All Users |
| 7.5 | Enforce Role Permissions |

### Data Flows

| From | Data | To |
|------|------|----|
| E3 | new user data (username, email, password, role) | 7.1 Create User Account |
| 7.1 | user record (hashed password, role) | D1 Users |
| 7.1 | account creation confirmation | E3 |
| 7.1 | audit entry (user created) | D7 Audit Log |
| E3 | role assignment (user_id, role) | 7.2 Assign Role to User |
| D1 Users | user record | 7.2 |
| 7.2 | updated role | D1 Users |
| 7.2 | role assigned confirmation | E3 |
| 7.2 | audit entry (role assigned) | D7 Audit Log |
| E3 | role update (user_id, new_role) | 7.3 Update User Role |
| D1 Users | current user record | 7.3 |
| 7.3 | updated user record | D1 Users |
| 7.3 | audit entry (role updated) | D7 Audit Log |
| 7.3 | update confirmation | E3 |
| E3 | view users request | 7.4 View All Users |
| D1 Users | all user records | 7.4 |
| 7.4 | user list (username, email, role) | E3 |
| 2.0 / 3.0 / 4.0 / 5.0 | permission check request (user_id, action) | 7.5 Enforce Role Permissions |
| D1 Users | user role | 7.5 |
| 7.5 | permission granted / denied | 2.0 / 3.0 / 4.0 / 5.0 |
| 7.5 | denial message | E1 / E2 / E3 |

---

Document Version: 1.0
Last Updated: March 2026
