# Structura - Use Case Diagram

## Actors

| Actor | Description |
|-------|-------------|
| **Organizer** | Creates and manages event proposals; tracks checklists and views budget info for their events |
| **Officer** | Elevated role; manages documents, records expenditures, and oversees event and budget data |
| **Admin** | Full system access; manages users, roles, organizational budget, checklist templates, and audit logs |
| **System** | Automated actor; handles session timeouts, real-time sync, event lifecycle transitions, and audit logging |

---

## Use Cases by Module

### Authentication
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| Register account | ✓ | ✓ | ✓ |
| Log in | ✓ | ✓ | ✓ |
| Log out | ✓ | ✓ | ✓ |
| View error on invalid login | ✓ | ✓ | ✓ |

---

### Role-Based Access Control
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| View role-restricted navigation | ✓ | ✓ | ✓ |
| Assign/update user roles | | | ✓ |
| View all users | | | ✓ |
| Receive denial message on unauthorized action | ✓ | ✓ | ✓ |

---

### Event Management
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| Create event proposal | ✓ | ✓ | ✓ |
| View event details | ✓ | ✓ | ✓ |
| Update event proposal | ✓ | ✓ | ✓ |
| Delete event proposal | ✓ | ✓ | ✓ |
| Change event status (Approve) | | ✓ | ✓ |
| Change event status (Cancel/Complete) | | ✓ | ✓ |

---

### Document Management
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| View documents for an event | ✓ | ✓ | ✓ |
| Upload document to an event | | ✓ | ✓ |
| Delete document | | ✓ | ✓ |

---

### Checklist Management
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| View event checklist | ✓ | ✓ | ✓ |
| Apply checklist template to event | ✓ | ✓ | ✓ |
| Create custom checklist for event | ✓ | ✓ | ✓ |
| Add / modify / remove checklist items | ✓ | ✓ | ✓ |
| Mark checklist item as complete | ✓ | ✓ | ✓ |
| View checklist completion percentage | ✓ | ✓ | ✓ |
| Create checklist template | | | ✓ |
| Manage checklist templates | | | ✓ |

---

### Budget Management
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| View event budget summary | ✓ | ✓ | ✓ |
| View organizational budget dashboard | | ✓ | ✓ |
| Record expenditure against event | | ✓ | ✓ |
| Allocate funds to event | | | ✓ |
| Set / update organizational budget | | | ✓ |

---

### Audit Trail
| Use Case | Organizer | Officer | Admin |
|----------|-----------|---------|-------|
| View last modified info on events/budgets | ✓ | ✓ | ✓ |
| View full audit logs | | | ✓ |

---

### System (Automated)
| Use Case | System |
|----------|--------|
| Hash passwords on registration | ✓ |
| Invalidate session on logout / timeout | ✓ |
| Record audit log entry on critical actions | ✓ |
| Transition event status on date passing | ✓ |
| Return allocated funds on event cancellation | ✓ |
| Sync real-time data updates to all users | ✓ |
| Validate file format and size on upload | ✓ |

---

## Actor–Use Case Summary

```
Organizer
 ├── Authentication (register, login, logout)
 ├── Event Management (create, view, update, delete)
 ├── Checklist Management (apply template, create custom, manage items, mark complete)
 └── Budget (view event budget summary)

Officer  ⊃ Organizer +
 ├── Document Management (upload, view, delete)
 ├── Event Management (approve, cancel, complete events)
 ├── Budget (view org dashboard, record expenditures)
 └── Audit Trail (view last modified info)

Admin  ⊃ Officer +
 ├── Role Management (assign/update roles, view users)
 ├── Checklist Templates (create, manage)
 ├── Budget (allocate funds, set org budget)
 └── Audit Trail (view full audit logs)

System (automated)
 ├── Security (password hashing, session management)
 ├── Audit Logging (record all critical actions)
 ├── Event Lifecycle (auto status transitions, fund returns)
 ├── Real-Time Sync (push updates to all active users)
 └── Validation (file type/size checks)
```

---

Document Version: 1.0
Last Updated: March 2026
