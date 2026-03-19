# Structura — Flowcharts

All flowcharts are written in Mermaid. Use a Mermaid-compatible viewer (e.g. VS Code Mermaid Preview, mermaid.live) to render them.

---

## 1. App Navigation Flow (Dashboard → Login → Modules)

```mermaid
flowchart TD
    Start([User visits app]) --> Auth{Authenticated?}
    Auth -- No --> Login[Login Page]
    Login --> Credentials[Enter username & password]
    Credentials --> Validate{Valid credentials?}
    Validate -- No --> LoginErr[Show error message] --> Login
    Validate -- Yes --> Session[Create session] --> Dashboard

    Auth -- Yes --> Dashboard[Dashboard]

    Dashboard --> RoleCheck{User Role?}
    RoleCheck -- Organizer --> M1[Event Management]
    RoleCheck -- Organizer --> M4[Checklist Management]
    RoleCheck -- Organizer --> M5[Budget - View Only]

    RoleCheck -- Officer --> M1
    RoleCheck -- Officer --> M3[Document Management]
    RoleCheck -- Officer --> M4
    RoleCheck -- Officer --> M5b[Budget - Record Expenditure]

    RoleCheck -- Admin --> M1
    RoleCheck -- Admin --> M2[User & Role Management]
    RoleCheck -- Admin --> M3
    RoleCheck -- Admin --> M4
    RoleCheck -- Admin --> M5c[Budget - Full Access]
    RoleCheck -- Admin --> M6[Audit Trail]

    Dashboard --> Logout[Logout] --> Session2[Destroy session] --> Login
```

---

## 2. Authentication Flow

```mermaid
flowchart TD
    A([Start]) --> B[User enters username & password]
    B --> C{Fields empty?}
    C -- Yes --> D[Show validation error] --> B
    C -- No --> E[Send credentials to server]
    E --> F{User exists?}
    F -- No --> G[Return error: invalid credentials] --> B
    F -- Yes --> H{Password matches hash?}
    H -- No --> G
    H -- Yes --> I[Create iron-session]
    I --> J[Redirect to Dashboard]
    J --> K([End])
```

---

## 3. Event Management Flow

```mermaid
flowchart TD
    A([User opens Events]) --> B[View events list]
    B --> C{Action?}

    C -- Create --> D[Fill event form\nname, description, date, location]
    D --> E{Valid input?}
    E -- No --> F[Show inline errors] --> D
    E -- Yes --> G[Save event with status = Proposed]
    G --> H[Log audit entry] --> B

    C -- View --> I[Open event detail page\ndocuments, checklist, budget]
    I --> B

    C -- Edit --> J[Load event form with existing data]
    J --> K{Valid input?}
    K -- No --> L[Show inline errors] --> J
    K -- Yes --> M[Update event record]
    M --> N[Log audit entry] --> B

    C -- Change Status --> O{Authorized?\nOfficer or Admin}
    O -- No --> P[Show denied message] --> B
    O -- Yes --> Q[Select new status\nApproved / Completed / Cancelled]
    Q --> R[Update status] --> S[Log audit entry] --> B

    C -- Delete --> T{Confirm delete?}
    T -- No --> B
    T -- Yes --> U[Delete event record]
    U --> V[Log audit entry] --> B
```

---

## 4. Document Management Flow

```mermaid
flowchart TD
    A([User opens Event Documents]) --> B[View document list for event]
    B --> C{Action?}

    C -- Upload --> D[Select file + choose document type]
    D --> E{File valid?\nformat & size}
    E -- No --> F[Show validation error] --> D
    E -- Yes --> G[Upload file to Supabase Storage]
    G --> H[Save document record linked to event]
    H --> I[Show success message] --> B

    C -- View --> J[Open/download document] --> B

    C -- Delete --> K{Authorized?\nOfficer or Admin}
    K -- No --> L[Show denied message] --> B
    K -- Yes --> M{Confirm delete?}
    M -- No --> B
    M -- Yes --> N[Remove file from storage]
    N --> O[Delete document record] --> B
```

---

## 5. Checklist Management Flow

```mermaid
flowchart TD
    A([User opens Event Checklist]) --> B[View checklist with completion %]
    B --> C{Action?}

    C -- Apply Template --> D{Admin only\nfor creating templates}
    D --> E[Select template from list]
    E --> F[Copy template items to event checklist]
    F --> G[Show success] --> B

    C -- Create Custom --> H[Enter checklist items manually]
    H --> I[Save checklist linked to event] --> B

    C -- Add Item --> J[Enter item description]
    J --> K[Append item to checklist] --> B

    C -- Edit Item --> L[Modify item description]
    L --> M[Update item record] --> B

    C -- Remove Item --> N{Confirm remove?}
    N -- No --> B
    N -- Yes --> O[Delete item from checklist] --> B

    C -- Mark Complete --> P[Set is_completed = true\nrecord completed_at & user]
    P --> Q[Recalculate completion %] --> B
```

---

## 6. Budget Management Flow

```mermaid
flowchart TD
    A([User opens Budget]) --> B[View budget dashboard\ntotal, allocated, spent, remaining]
    B --> C{Action?}

    C -- Set Budget --> D{Admin only}
    D --> E[Enter total organizational funds]
    E --> F[Save budget record] --> B

    C -- Allocate Funds --> G{Admin only}
    G --> H[Select event + enter amount]
    H --> I{Amount exceeds\navailable funds?}
    I -- Yes --> J[Show over-allocation error] --> H
    I -- No --> K[Save allocation record]
    K --> L[Log audit entry] --> B

    C -- Record Expenditure --> M{Officer or Admin}
    M --> N[Enter amount, description,\nlink financial document]
    N --> O{Document attached?}
    O -- No --> P[Show error: document required] --> N
    O -- Yes --> Q[Save expenditure record]
    Q --> R[Log audit entry] --> B

    C -- View Summary --> S[Show per-event breakdown\nallocated / spent / remaining] --> B
```

---

## 7. Audit Trail Flow

```mermaid
flowchart TD
    A([Admin opens Audit Trail]) --> B[View audit log list\nuser, action, target, timestamp]
    B --> C{Filter logs?}
    C -- Yes --> D[Apply filter\nby action type or date]
    D --> E[Display filtered results] --> B
    C -- No --> B

    subgraph Auto-logging
        F([Any critical action occurs]) --> G{Action type?}
        G -- Login / Logout --> H[Record auth entry]
        G -- Event created/updated/deleted/status changed --> I[Record event entry]
        G -- Budget allocated / expenditure recorded --> J[Record budget entry]
        G -- Role assigned / updated --> K[Record role entry]
        H & I & J & K --> L[Write immutable record to audit_trail table]
    end
```

---

## 8. User & Role Management Flow

```mermaid
flowchart TD
    A([Admin opens User Management]) --> B[View all users with roles]
    B --> C{Action?}

    C -- Create User --> D[Enter username, email, password, role]
    D --> E{Valid input?}
    E -- No --> F[Show inline errors] --> D
    E -- Yes --> G[Hash password]
    G --> H[Save user record with assigned role]
    H --> I[Log audit entry] --> B

    C -- Update Role --> J[Select user + choose new role\nOrganizer / Officer / Admin]
    J --> K[Update user role in DB]
    K --> L[Log audit entry] --> B

    C -- View User --> M[Show user detail\nusername, email, role, created_at] --> B
```

---

Document Version: 1.0
Last Updated: March 2026
