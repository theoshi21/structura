# DFD (Data Flow Diagram) Guide

## What is a DFD?

A Data Flow Diagram shows how data moves through a system. It does NOT show logic, decisions, or timing — only the flow of data between processes, entities, and storage.

---

## Symbols

| Symbol | Shape | Represents |
|--------|-------|------------|
| External Entity | Rectangle | A person or system outside your system that sends or receives data (e.g., Organizer, Admin) |
| Process | Circle or rounded rectangle | A function that transforms or acts on data (e.g., "Validate Login") |
| Data Store | Open-ended rectangle (two horizontal lines) | Where data is held at rest (e.g., a database table) |
| Data Flow | Arrow with label | Data moving from one element to another (e.g., "login credentials") |

---

## DFD Levels

### Level 0 — Context Diagram
- The entire system is ONE process bubble
- Show all external entities around it
- Draw arrows for high-level inputs and outputs only
- No data stores at this level

Example:
```
[Organizer] --event form data--> (Structura System) --event confirmation--> [Organizer]
[Admin]     --budget amount-->   (Structura System)
```

---

### Level 1 DFD
- Explode the single bubble into major processes (one per module)
- Number them: 1.0, 2.0, 3.0, etc.
- Introduce data stores
- Show flows between processes and data stores

Example processes for Structura:
```
1.0 Manage Authentication
2.0 Manage Events
3.0 Manage Documents
4.0 Manage Checklists
5.0 Manage Budget
6.0 Manage Audit Trail
7.0 Manage Users & Roles
```

---

### Level 2 DFD
- Explode each Level 1 process into sub-processes
- Number them: 2.1, 2.2, 2.3, etc.
- Show more detailed data flows and which data stores each sub-process reads/writes
- One Level 2 diagram per Level 1 process

---

## Rules to Follow

1. Every data flow must come from or go to a process — data cannot flow directly between two entities or two data stores
2. Label every arrow with the name of the data being passed
3. Every process must have at least one input and one output
4. Data stores are only accessed by processes, never by external entities directly
5. Keep each diagram focused — don't mix levels on the same diagram
6. Number processes consistently across levels (2.0 at Level 1 becomes 2.1, 2.2... at Level 2)

---

## Step-by-Step: How to Draw a Level 2 DFD

1. Pick one Level 1 process (e.g., `2.0 Manage Events`)
2. List all the sub-functions it performs (create, update, delete, change status)
3. Identify which external entities interact with those sub-functions
4. Identify which data stores are read or written
5. Draw each sub-process as a bubble, numbered (2.1, 2.2, ...)
6. Draw arrows between entities, processes, and data stores
7. Label every arrow with the data being passed

---

## Structura: Suggested Level 2 Breakdown

### 1.0 Manage Authentication
| # | Sub-Process |
|---|-------------|
| 1.1 | Validate Credentials |
| 1.2 | Create Session |
| 1.3 | Destroy Session |
| 1.4 | Hash Password |

Data stores used: `D1 Users`

---

### 2.0 Manage Events
| # | Sub-Process |
|---|-------------|
| 2.1 | Create Event Proposal |
| 2.2 | Update Event Proposal |
| 2.3 | Delete Event Proposal |
| 2.4 | Change Event Status |
| 2.5 | View Event Details |

Data stores used: `D2 Events`, `D7 Audit Log`

---

### 3.0 Manage Documents
| # | Sub-Process |
|---|-------------|
| 3.1 | Upload Document |
| 3.2 | Validate File |
| 3.3 | Link Document to Event |
| 3.4 | View Documents |
| 3.5 | Delete Document |

Data stores used: `D3 Documents`, `D2 Events`

---

### 4.0 Manage Checklists
| # | Sub-Process |
|---|-------------|
| 4.1 | Create Checklist Template |
| 4.2 | Apply Template to Event |
| 4.3 | Create Custom Checklist |
| 4.4 | Add / Modify / Remove Checklist Item |
| 4.5 | Mark Item as Complete |
| 4.6 | Calculate Completion Percentage |

Data stores used: `D4 Checklists`, `D5 Checklist Templates`, `D2 Events`

---

### 5.0 Manage Budget
| # | Sub-Process |
|---|-------------|
| 5.1 | Set Organizational Budget |
| 5.2 | Allocate Funds to Event |
| 5.3 | Record Expenditure |
| 5.4 | Calculate Remaining Funds |
| 5.5 | View Budget Dashboard |

Data stores used: `D6 Budget`, `D2 Events`, `D3 Documents`, `D7 Audit Log`

---

### 6.0 Manage Audit Trail
| # | Sub-Process |
|---|-------------|
| 6.1 | Record Audit Entry |
| 6.2 | View Audit Logs |

Data stores used: `D7 Audit Log`

---

### 7.0 Manage Users & Roles
| # | Sub-Process |
|---|-------------|
| 7.1 | Create User Account |
| 7.2 | Assign Role to User |
| 7.3 | Update User Role |
| 7.4 | View All Users |
| 7.5 | Enforce Role Permissions |

Data stores used: `D1 Users`

---

## Data Stores Reference

| ID | Name | Contents |
|----|------|----------|
| D1 | Users | user ID, username, email, hashed password, role |
| D2 | Events | event ID, name, description, date, location, status, creator |
| D3 | Documents | document ID, event ID, file type, file URL, upload date, uploader |
| D4 | Checklists | checklist ID, event ID, items, completion status |
| D5 | Checklist Templates | template ID, name, default items |
| D6 | Budget | org budget, allocations per event, expenditures per event |
| D7 | Audit Log | log ID, user ID, action type, target record, timestamp |

---

## Tips for Drawing Manually

- Use a pencil first — DFDs often need rearranging
- Keep external entities on the edges of the page
- Group related processes near their shared data store
- Avoid crossing arrows where possible — reroute for clarity
- Use consistent arrow styles (straight or curved, pick one)
- Write data labels close to the middle of the arrow

---

Document Version: 1.0
Last Updated: March 2026
