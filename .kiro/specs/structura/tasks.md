# Implementation Plan: Structura

## Overview

This implementation plan follows a UI-first approach: build all pages, layouts, and components across every module before writing any backend logic. Placeholder handlers are used for buttons and actions that require backend. Once the full UI is complete, backend functionality is wired up module by module.

## Tasks

<!-- ============================================================ -->
<!-- PHASE 1: PROJECT SETUP                                        -->
<!-- ============================================================ -->

- [ ] 1. Project Setup
  - Initialize Next.js 14+ project with TypeScript and Tailwind CSS
  - Install and configure dependencies: iron-session, bcrypt, supabase-js
  - Set up environment variables (.env.local)
  - Configure Tailwind with custom colors and fonts from brand design
  - Set up Google Fonts: Yeseva One + Open Sans
  - _Requirements: 9.1, 9.2_

<!-- ============================================================ -->
<!-- PHASE 2: SHARED UI COMPONENTS                                 -->
<!-- ============================================================ -->

- [ ] 2. Design System and Shared Components
  - [ ] 2.1 Configure Tailwind theme
    - Add brand colors: #FDFDFC, #C4C8D3, #BDC0C7, #0F0F1A, #16162A, #4F46E8, #818CF8
    - Add font families: Yeseva One (headings), Open Sans (body)
    - _Requirements: 14.1_

  - [ ] 2.2 Build reusable UI primitives
    - Button component (primary, outline, ghost variants)
    - Input component (text, email, password)
    - Select/Dropdown component
    - Badge/pill component (status colors: green, amber, red, blue)
    - Card component
    - FilterTabs component (pill-shaped tab row)
    - StatCard component (icon + number + label)
    - ProgressBar component
    - _Requirements: 14.1, 14.2_

  - [ ] 2.3 Build Logo component
    - Hexagon icon + "Structura" wordmark
    - White variant for dark backgrounds
    - _Requirements: 14.1_

<!-- ============================================================ -->
<!-- PHASE 3: PUBLIC LANDING PAGE                                  -->
<!-- ============================================================ -->

- [ ] 3. Landing Page UI
  - [ ] 3.1 Build Navbar
    - Logo left, nav links center (Features, About, Contact), Sign In button right
    - Dark navy background (#16162A)
    - _Requirements: 14.1_

  - [ ] 3.2 Build Hero section
    - Dark navy bg with radial purple glow
    - "STUDENT ORGANIZATION PLATFORM" badge
    - Heading: "Manage without the chaos." with "chaos." in #818CF8
    - Subtext paragraph
    - "Get Started →" and "See Features" CTA buttons
    - _Requirements: 14.1_

  - [ ] 3.3 Build Features section
    - "WHAT STRUCTURA OFFERS" label + heading
    - 7-card grid (4 top, 3 bottom): emoji icon, title, description
    - _Requirements: 14.1_

  - [ ] 3.4 Build About section
    - Left-aligned layout
    - "WHY STRUCTURA" label + heading + two body paragraphs
    - _Requirements: 14.1_

  - [ ] 3.5 Build CTA / Pre-footer section
    - "Ready to get organized?" heading
    - "Get Started Now" button
    - _Requirements: 14.1_

  - [ ] 3.6 Build Footer
    - Logo + wordmark left, copyright text right
    - _Requirements: 14.1_

<!-- ============================================================ -->
<!-- PHASE 4: AUTH PAGES                                           -->
<!-- ============================================================ -->

- [ ] 4. Authentication Pages UI
  - [ ] 4.1 Build Sign In page
    - Logo-only navbar
    - "← Back to home" link
    - "Welcome Back!" heading
    - Email + Password fields
    - "Forgot password?" link (placeholder)
    - "Remember me for 30 days" checkbox
    - "Sign In" button (placeholder handler)
    - "Don't have an account? Sign Up" link
    - _Requirements: 1.2, 14.2_

  - [ ] 4.2 Build Register page — shared layout
    - Logo-only navbar
    - "← Back to home" link
    - "Create a new account" heading
    - Account type toggle: Student Organization / Administrative Office
    - Conditionally render student or employee form based on selection
    - _Requirements: 1.1, 14.2_

  - [ ] 4.3 Build Register — Student form
    - Personal Info section: First Name, Last Name, E-mail Address
    - Organization Details section: School (dropdown), Organization Name, Department/College, Your Role (dropdown), Student #
    - Password section: Set Password, Confirm Password
    - Terms checkbox + "Create Account" button (placeholder handler)
    - "Already have an account? Sign In" link
    - _Requirements: 1.1, 14.2_

  - [ ] 4.4 Build Register — Employee form
    - Personal Info section: First Name, Last Name, E-mail Address
    - Office Details section: School (dropdown), Office/Department Name, Position/Title, Employee #, Admin Access Code
    - Password section: Set Password, Confirm Password
    - Terms checkbox + "Create Account" button (placeholder handler)
    - "Already have an account? Sign In" link
    - _Requirements: 1.1, 14.2_

<!-- ============================================================ -->
<!-- PHASE 5: STUDENT PORTAL UI                                    -->
<!-- ============================================================ -->

- [ ] 5. Student Portal Layout
  - [ ] 5.1 Build Student sidebar layout
    - Logo + "Student" role badge (#4F46E8 pill)
    - Nav links: Dashboard, My Events, Documents, Checklists, Budget
    - Active state highlight
    - Bottom: avatar circle with initial, name + org, "← Log out" (placeholder)
    - _Requirements: 14.1, 14.4_

  - [ ] 5.2 Build Student Dashboard page
    - "Welcome Back, [User]!" heading
    - 4 stat cards: Organizations, Pending Reviews, Total Fund, Active Events (mock data)
    - "MY SUBMISSIONS" table: Event, Date, Status badge
    - "BUDGET OVERVIEW" panel: Allocated/Spent/Remaining rows + progress bar
    - _Requirements: 8.1, 14.1_

  - [ ] 5.3 Build My Events page
    - Page title + filter tabs: All, Pending, Approved, Returned, Completed
    - Table: Event Name, Date, Venue, Budget Req., Status badge, "View" action link
    - Mock data rows
    - _Requirements: 3.3, 14.1_

  - [ ] 5.4 Build Documents page
    - Page title + "+ Upload" button (placeholder) + filter tabs: All, Permits, Contracts, Receipts, Promotional
    - Drag & drop upload zone (UI only, no upload logic)
    - Table: File Name, Type, Event, Size, Uploaded, Status badge, "View" action link
    - Mock data rows
    - _Requirements: 4.2, 14.1_

  - [ ] 5.5 Build Checklists page
    - Page title + "+ New Checklist" button (placeholder)
    - 3-column card grid
    - Checklist card: event name, "X/Y done" badge, progress bar, checkbox items
    - Mock data card + empty placeholder cards
    - _Requirements: 5.6, 14.1_

  - [ ] 5.6 Build Budget page
    - Page title + "+ Add Expense" button (placeholder)
    - 3 stat cards: Allocated, Spent, Remaining (mock data)
    - Full-width progress bar + "X% of the budget used" label
    - "EXPENDITURES" table: Description, Event, Date, Amount, Receipt badge
    - Mock data rows
    - _Requirements: 7.1, 14.1_

<!-- ============================================================ -->
<!-- PHASE 6: SCHOOL ADMIN PORTAL UI                               -->
<!-- ============================================================ -->

- [ ] 6. School Admin Portal Layout
  - [ ] 6.1 Build Admin sidebar layout
    - Logo + "Office" role badge (teal pill)
    - Nav links: Dashboard, Submissions, Users, Budget, Audit Trail
    - Active state highlight
    - Bottom: teal avatar circle, "Admin / Office of Student Life", "← Log out" (placeholder)
    - _Requirements: 14.1, 14.4_

  - [ ] 6.2 Build Admin Dashboard page
    - "Admin Overview" heading
    - 4 stat cards: Organizations, Pending Reviews, Total Fund, Active Events (mock data)
    - "PENDING APPROVALS" table: Event, Org, Submitted, "View" action link
    - "FUND ALLOCATION" panel: Total fund/Allocated/Remaining rows + progress bar
    - _Requirements: 8.2, 14.1_

  - [ ] 6.3 Build Submissions page
    - Page title + filter tabs: All, Pending, Approved, Returned, Rejected
    - Table: Event Name, Organization, Date, Budget Req., Docs badge, Status badge, "Review" action link
    - Mock data rows
    - _Requirements: 3.4, 14.1_

  - [ ] 6.4 Build User Management page
    - Page title + "+ Add User" button (placeholder) + filter tabs: All, Organizer, Officer
    - Table: Name (avatar + initials), Organization, Role, Status badge, "Edit" action link
    - Mock data rows
    - _Requirements: 2.2, 14.1_

  - [ ] 6.5 Build Admin Budget page
    - Page title + "+ Allocate Funds" button (placeholder)
    - 3 stat cards: Total Fund, Allocated, Remaining (mock data)
    - Full-width progress bar + "X% of the budget used" label
    - "PER ORGANIZATION" table: Organization, Allocated, Spent, Remaining, Utilization badge
    - Mock data rows
    - _Requirements: 6.4, 14.1_

  - [ ] 6.6 Build Audit Trail page
    - Page title + filter tabs: All, Budget, Events, Documents
    - Log entry rows: bold action description + "By [user] · [date] · [time]" + category badge
    - Mock data rows
    - _Requirements: 18.2, 14.1_

<!-- ============================================================ -->
<!-- PHASE 7: UI CHECKPOINT                                        -->
<!-- ============================================================ -->

- [ ] 7. UI Checkpoint
  - All pages render without errors
  - Navigation works between all pages
  - Responsive layout on desktop and tablet
  - Mock data displays correctly in all tables and cards
  - Placeholder buttons are present but non-functional
  - Ask the user if questions arise before proceeding to backend

<!-- ============================================================ -->
<!-- PHASE 8: DATABASE AND TYPES                                   -->
<!-- ============================================================ -->

- [ ] 8. Database Schema and TypeScript Types
  - [ ] 8.1 Create database migration files
    - Tables: users, organizations, events, documents, checklist_templates, checklist_template_items, checklists, checklist_items, budget, allocations, expenditures, audit_trail
    - Indexes, foreign keys, constraints
    - _Requirements: 9.4, 16.2_

  - [ ] 8.2 Write property test for referential integrity
    - **Property 37: Referential Integrity Maintained**
    - _Requirements: 9.4_

  - [ ] 8.3 Create TypeScript types matching schema
    - Interfaces: User, Organization, Event, Document, Checklist, Budget, Allocation, Expenditure, AuditEntry
    - _Requirements: 3.4, 9.4_

<!-- ============================================================ -->
<!-- PHASE 9: AUTHENTICATION BACKEND                               -->
<!-- ============================================================ -->

- [ ] 9. Authentication Backend
  - [ ] 9.1 Implement password hashing with bcrypt
    - _Requirements: 1.5, 13.5_

  - [ ] 9.2 Write property test for password security
    - **Property 1: Password Security**
    - _Requirements: 1.1, 1.5, 13.5_

  - [ ] 9.3 Implement session management with iron-session
    - _Requirements: 1.2, 13.2_

  - [ ] 9.4 Write property test for session expiration
    - **Property 5: Session Expiration**
    - _Requirements: 13.2_

  - [ ] 9.5 Create AuthService (register, login, logout)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 9.6 Write property tests for authentication
    - **Property 2: Valid Credentials Grant Access**
    - **Property 3: Invalid Credentials Rejected**
    - _Requirements: 1.2, 1.3_

  - [ ] 9.7 Create authentication middleware for protected routes
    - _Requirements: 1.4_

  - [ ] 9.8 Wire up Sign In and Register pages to AuthService
    - Replace placeholder handlers with real API calls
    - Add loading states and error messages
    - _Requirements: 1.1, 1.2_

<!-- ============================================================ -->
<!-- PHASE 10: USER MANAGEMENT BACKEND                             -->
<!-- ============================================================ -->

- [ ] 10. User Management Backend
  - [ ] 10.1 Create UserService (CRUD, role updates)
    - _Requirements: 2.1, 2.2_

  - [ ] 10.2 Create RoleManager for permission checking
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [ ] 10.3 Write property tests for user management
    - **Property 7: Every User Has Exactly One Role**
    - **Property 8: Role Updates Persist**
    - **Property 9: Role-Based Permissions Enforced**
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 10.4 Create API routes for user management
    - GET /api/users, PATCH /api/users/[id]/role
    - _Requirements: 2.2_

  - [ ] 10.5 Wire up User Management page to API
    - Replace mock data with real users
    - Wire "+ Add User" and "Edit" actions
    - _Requirements: 2.2_

<!-- ============================================================ -->
<!-- PHASE 11: EVENT MANAGEMENT BACKEND                            -->
<!-- ============================================================ -->

- [ ] 11. Event Management Backend
  - [ ] 11.1 Create EventService (CRUD, status transitions)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 17.1, 17.2_

  - [ ] 11.2 Write property tests for event management
    - **Property 10–15: Event lifecycle properties**
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 17.1, 17.2_

  - [ ] 11.3 Create API routes for events
    - POST/GET /api/events, GET/PATCH/DELETE /api/events/[id]
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ] 11.4 Wire up My Events and Submissions pages to API
    - Replace mock data with real events
    - Wire "View", "Review", and filter tabs
    - _Requirements: 3.3, 3.4_

<!-- ============================================================ -->
<!-- PHASE 12: DOCUMENT MANAGEMENT BACKEND                         -->
<!-- ============================================================ -->

- [ ] 12. Document Management Backend
  - [ ] 12.1 Create StorageManager (Supabase Storage upload/delete)
    - _Requirements: 4.1, 4.5, 9.5_

  - [ ] 12.2 Create DocumentService (upload, list, delete)
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 12.3 Write property tests for document management
    - **Property 16–20: Document properties**
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 12.4 Create API routes for documents
    - POST/GET /api/events/[id]/documents, DELETE /api/documents/[id]
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 12.5 Wire up Documents page to API
    - Replace mock data, enable drag & drop upload, wire "View" action
    - _Requirements: 4.1, 4.2_

<!-- ============================================================ -->
<!-- PHASE 13: CHECKLIST BACKEND                                   -->
<!-- ============================================================ -->

- [ ] 13. Checklist Backend
  - [ ] 13.1 Create ChecklistTemplateService and ChecklistService
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 13.2 Write property tests for checklists
    - **Property 21–25: Checklist properties**
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.7, 5.8_

  - [ ] 13.3 Create API routes for checklists
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [ ] 13.4 Wire up Checklists page to API
    - Replace mock data, enable "+ New Checklist", wire checkbox toggles
    - _Requirements: 5.4, 5.5_

<!-- ============================================================ -->
<!-- PHASE 14: BUDGET BACKEND                                      -->
<!-- ============================================================ -->

- [ ] 14. Budget Backend
  - [ ] 14.1 Create BudgetService, AllocationService, ExpenditureService
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

  - [ ] 14.2 Write property tests for budget
    - **Property 26–32: Budget properties**
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

  - [ ] 14.3 Create API routes for budget
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 14.4 Wire up Student Budget and Admin Budget pages to API
    - Replace mock data, enable "+ Add Expense" and "+ Allocate Funds"
    - _Requirements: 6.2, 6.3, 7.1_

<!-- ============================================================ -->
<!-- PHASE 15: AUDIT TRAIL BACKEND                                 -->
<!-- ============================================================ -->

- [ ] 15. Audit Trail Backend
  - [ ] 15.1 Create AuditService (log, retrieve)
    - _Requirements: 8.3, 18.1, 18.2_

  - [ ] 15.2 Integrate audit logging into all services
    - _Requirements: 3.2, 8.3, 18.1_

  - [ ] 15.3 Write property tests for audit trail
    - **Property 33–35: Audit properties**
    - _Requirements: 8.3, 18.1, 18.2, 18.3_

  - [ ] 15.4 Create API routes for audit trail
    - _Requirements: 18.2_

  - [ ] 15.5 Wire up Audit Trail page to API
    - Replace mock data, wire filter tabs
    - _Requirements: 18.2_

<!-- ============================================================ -->
<!-- PHASE 16: REAL-TIME AND POLISH                                -->
<!-- ============================================================ -->

- [ ] 16. Real-time Subscriptions
  - [ ] 16.1 Create RealtimeService for Supabase subscriptions
    - _Requirements: 10.3_

  - [ ] 16.2 Subscribe to event and budget updates in UI
    - _Requirements: 10.1, 10.2_

- [ ] 17. Integration and Polish
  - [ ] 17.1 Add loading states to all async operations
    - _Requirements: 12.2, 14.2_

  - [ ] 17.2 Add success/error toast notifications
    - _Requirements: 14.2_

  - [ ] 17.3 Implement client-side form validation
    - _Requirements: 11.1, 11.2, 14.2_

  - [ ] 17.4 Add confirmation dialogs for destructive actions
    - _Requirements: 14.3_

  - [ ] 17.5 Optimize performance (pagination, query optimization)
    - _Requirements: 12.1, 12.3_

<!-- ============================================================ -->
<!-- PHASE 17: INTEGRATION TESTS AND FINAL CHECKPOINT             -->
<!-- ============================================================ -->

- [ ] 18. Integration Tests
  - [ ] 18.1 Write integration tests for auth flow
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 18.2 Write integration tests for event management flow
    - _Requirements: 3.1, 4.1, 5.2, 6.2, 6.3_

  - [ ] 18.3 Write integration tests for role-based access
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [ ] 19. Final Checkpoint
  - Run all tests (unit, property, integration)
  - Verify all requirements are met
  - Test complete user journeys for each role
  - Confirm audit trail works for all operations
  - Ask the user if questions arise
