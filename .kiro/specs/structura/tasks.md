# Implementation Plan: Structura

## Overview

This implementation plan breaks down the Structura platform into discrete, incremental tasks. The approach follows a bottom-up strategy: starting with foundational infrastructure (database, authentication), then building core features (events, documents, checklists, budget), and finally integrating everything with the UI. Each task builds on previous work, ensuring no orphaned code.

## Tasks

- [ ] 1. Project Setup and Infrastructure
  - Initialize Next.js 14+ project with TypeScript and Tailwind CSS
  - Configure Supabase client and environment variables
  - Set up database schema and migrations
  - Configure iron-session for authentication
  - Set up testing framework (Jest/Vitest and fast-check)
  - _Requirements: 9.1, 9.2, 13.1_

- [ ] 2. Database Schema and Migrations
  - [ ] 2.1 Create database migration files for all tables
    - Create users, events, documents, checklist_templates, checklist_template_items, checklists, checklist_items, budget, allocations, expenditures, audit_trail, organization tables
    - Add indexes for performance optimization
    - Set up foreign key constraints for referential integrity
    - _Requirements: 9.4, 16.2_
  
  - [ ] 2.2 Write property test for referential integrity
    - **Property 37: Referential Integrity Maintained**
    - **Validates: Requirements 9.4**
  
  - [ ] 2.3 Create TypeScript types matching database schema
    - Define interfaces for User, Event, Document, Checklist, Budget, etc.
    - Export types for use across the application
    - _Requirements: 3.4, 9.4_

- [ ] 3. Authentication System
  - [ ] 3.1 Implement password hashing with bcrypt
    - Create PasswordHasher service with hash() and verify() methods
    - _Requirements: 1.5, 13.5_
  
  - [ ] 3.2 Write property test for password security
    - **Property 1: Password Security**
    - **Validates: Requirements 1.1, 1.5, 13.5**
  
  - [ ] 3.3 Implement session management with iron-session
    - Create SessionManager with createSession(), getSession(), destroySession()
    - Configure session options (cookie name, password, TTL)
    - _Requirements: 1.2, 13.2_
  
  - [ ] 3.4 Write property test for session expiration
    - **Property 5: Session Expiration**
    - **Validates: Requirements 13.2**
  
  - [ ] 3.5 Create AuthService for registration and login
    - Implement register() method with password hashing and user creation
    - Implement login() method with credential verification and session creation
    - Implement logout() method with session destruction
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 3.6 Write property tests for authentication
    - **Property 2: Valid Credentials Grant Access**
    - **Property 3: Invalid Credentials Rejected**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ] 3.7 Write unit tests for authentication edge cases
    - Test registration with duplicate email
    - Test login with non-existent user
    - Test logout invalidates session
    - _Requirements: 1.1, 1.2, 1.3, 13.3_

- [ ] 4. Authorization Middleware
  - [ ] 4.1 Create RoleManager for permission checking
    - Implement hasPermission() to check role-based permissions
    - Define permission matrix for each role (organizer, officer, admin)
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 4.2 Create authentication middleware for Next.js
    - Check for valid session on protected routes
    - Redirect unauthenticated users to login
    - Attach user info to request context
    - _Requirements: 1.4_
  
  - [ ] 4.3 Write property test for role-based permissions
    - **Property 9: Role-Based Permissions Enforced**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
  
  - [ ] 4.4 Write property test for unauthenticated access
    - **Property 4: Unauthenticated Access Denied**
    - **Validates: Requirements 1.4**

- [ ] 5. Checkpoint - Authentication Complete
  - Ensure all authentication tests pass
  - Verify users can register, login, and logout
  - Confirm middleware protects routes correctly
  - Ask the user if questions arise

- [ ] 6. User Management
  - [ ] 6.1 Create UserService for CRUD operations
    - Implement createUser(), getUserById(), getUserByEmail()
    - Implement updateUserRole() for admins
    - Implement listUsers() for admin dashboard
    - _Requirements: 2.1, 2.2_
  
  - [ ] 6.2 Write property tests for user management
    - **Property 7: Every User Has Exactly One Role**
    - **Property 8: Role Updates Persist**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ] 6.3 Write unit tests for user operations
    - Test user creation with all roles
    - Test role updates by admin
    - Test unauthorized role updates rejected
    - _Requirements: 2.1, 2.2, 2.6_

- [ ] 7. Event Management
  - [ ] 7.1 Create EventService for CRUD operations
    - Implement createEvent() with unique ID generation
    - Implement getEventById() with related data loading
    - Implement updateEvent() with audit logging
    - Implement deleteEvent() with cascade deletion
    - Implement listEvents() with filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ] 7.2 Create EventStatusManager for lifecycle management
    - Implement canTransition() to validate status changes
    - Implement transitionStatus() to update event status
    - Handle fund return on cancellation
    - _Requirements: 17.1, 17.2, 17.4_
  
  - [ ] 7.3 Write property tests for event management
    - **Property 10: Event Creation Assigns Unique ID**
    - **Property 11: Event Updates Persist and Audit**
    - **Property 12: Event Retrieval Includes Related Data**
    - **Property 13: Event Deletion Cascades**
    - **Property 14: Event Status Lifecycle**
    - **Property 15: Event Cancellation Returns Funds**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 17.1, 17.2, 17.4**
  
  - [ ] 7.4 Write unit tests for event operations
    - Test event creation by different roles
    - Test event updates with audit trail
    - Test event deletion removes related data
    - Test status transitions
    - _Requirements: 3.1, 3.2, 3.5, 17.1, 17.2_

- [ ] 8. Document Management
  - [ ] 8.1 Create StorageManager for Supabase Storage
    - Implement uploadFile() to store files in Supabase Storage
    - Implement deleteFile() to remove files
    - Implement getPublicUrl() to generate file URLs
    - _Requirements: 4.1, 4.5, 9.5_
  
  - [ ] 8.2 Create FileValidator for input validation
    - Implement validateFileType() to check allowed types
    - Implement validateFileSize() to enforce 10MB limit
    - _Requirements: 4.4, 12.4_
  
  - [ ] 8.3 Create DocumentService for document operations
    - Implement uploadDocument() with file validation and storage
    - Implement getDocument() to retrieve document metadata
    - Implement listDocumentsByEvent() to get all event documents
    - Implement deleteDocument() with storage cleanup
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ] 8.4 Write property tests for document management
    - **Property 16: Document Upload and Storage**
    - **Property 17: Document Retrieval by Event**
    - **Property 18: Document Type Validation**
    - **Property 19: File Validation**
    - **Property 20: Document Deletion Cleanup**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 9.5, 12.4**
  
  - [ ] 8.5 Write unit tests for document operations
    - Test document upload with valid files
    - Test document upload with invalid file types
    - Test document upload with oversized files
    - Test document deletion
    - _Requirements: 4.1, 4.4, 4.5_

- [ ] 9. Checkpoint - Core Entities Complete
  - Ensure all user, event, and document tests pass
  - Verify CRUD operations work correctly
  - Confirm authorization is enforced
  - Ask the user if questions arise

- [ ] 10. Checklist System
  - [ ] 10.1 Create ChecklistTemplateService
    - Implement createTemplate() to store templates with items
    - Implement getTemplate() to retrieve template with items
    - Implement listTemplates() for template selection
    - Implement updateTemplate() and deleteTemplate()
    - _Requirements: 5.1_
  
  - [ ] 10.2 Create ChecklistService for event checklists
    - Implement createChecklistFromTemplate() to copy template items
    - Implement createCustomChecklist() for custom items
    - Implement getChecklistByEvent() to retrieve checklist with items
    - Implement addItem(), removeItem(), updateItem() for modifications
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 10.3 Create ChecklistItemService for item operations
    - Implement toggleComplete() to mark items complete/incomplete
    - Implement getCompletionPercentage() to calculate progress
    - _Requirements: 5.5, 5.7, 5.8_
  
  - [ ] 10.4 Write property tests for checklist system
    - **Property 21: Template Creation and Storage**
    - **Property 22: Template Application Copies Items**
    - **Property 23: Checklist Independence from Template**
    - **Property 24: Checklist Item Completion**
    - **Property 25: Checklist Completion Calculation**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.7, 5.8**
  
  - [ ] 10.5 Write unit tests for checklist operations
    - Test template creation and retrieval
    - Test applying template to event
    - Test modifying event checklist doesn't affect template
    - Test completion percentage calculation
    - _Requirements: 5.1, 5.3, 5.4, 5.7_

- [ ] 11. Budget Management
  - [ ] 11.1 Create BudgetService for organizational budget
    - Implement getOrganizationalBudget() to retrieve budget
    - Implement updateTotalFunds() to modify total funds
    - Implement getAvailableFunds() to calculate available funds
    - Implement getAllocatedFunds() to sum allocations
    - _Requirements: 6.1, 6.4, 16.1, 16.2_
  
  - [ ] 11.2 Create AllocationService for fund allocation
    - Implement allocateFunds() with over-allocation prevention
    - Implement deallocateFunds() to return funds
    - Implement getEventAllocation() to retrieve allocation
    - _Requirements: 6.2, 6.5_
  
  - [ ] 11.3 Create ExpenditureService for spending tracking
    - Implement recordExpenditure() with document requirement
    - Implement getEventExpenditures() to list expenditures
    - Implement getTotalSpent() to sum expenditures
    - Implement getRemainingFunds() to calculate remaining budget
    - _Requirements: 6.3, 7.1, 7.2, 7.3_
  
  - [ ] 11.4 Write property tests for budget management
    - **Property 26: Single Organizational Budget**
    - **Property 27: Budget Allocation Reduces Available Funds**
    - **Property 28: Expenditure Reduces Event Funds**
    - **Property 29: Budget Calculations Correct**
    - **Property 30: Over-Allocation Prevention**
    - **Property 31: Expenditure Requires Documentation**
    - **Property 32: Over-Budget Warning**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 16.2**
  
  - [ ] 11.5 Write unit tests for budget operations
    - Test fund allocation reduces available funds
    - Test over-allocation is rejected
    - Test expenditure recording
    - Test expenditure requires document
    - Test remaining funds calculation
    - _Requirements: 6.2, 6.3, 6.5, 7.2, 7.3_

- [ ] 12. Audit Trail System
  - [ ] 12.1 Create AuditService for logging
    - Implement logAction() to record audit entries
    - Implement getAuditTrail() to retrieve entity history
    - Implement getUserActions() to retrieve user history
    - _Requirements: 8.3, 18.1, 18.2_
  
  - [ ] 12.2 Create AuditLogger for specific operations
    - Implement logBudgetAllocation() for allocations
    - Implement logExpenditure() for expenditures
    - Implement logEventStatusChange() for status changes
    - Implement logRoleChange() for role updates
    - _Requirements: 18.3_
  
  - [ ] 12.3 Integrate audit logging into services
    - Add audit logging to EventService.updateEvent()
    - Add audit logging to AllocationService.allocateFunds()
    - Add audit logging to ExpenditureService.recordExpenditure()
    - Add audit logging to UserService.updateUserRole()
    - _Requirements: 3.2, 8.3, 18.1_
  
  - [ ] 12.4 Write property tests for audit trail
    - **Property 33: Critical Operations Logged**
    - **Property 34: Audit Log Immutability**
    - **Property 35: Audit Trail Retrieval**
    - **Validates: Requirements 8.3, 18.1, 18.2, 18.3, 18.4, 18.5**
  
  - [ ] 12.5 Write unit tests for audit operations
    - Test audit entries are created for critical operations
    - Test audit entries cannot be modified
    - Test audit trail retrieval
    - _Requirements: 18.1, 18.2, 18.4_

- [ ] 13. Checkpoint - Backend Services Complete
  - Ensure all backend service tests pass
  - Verify budget calculations are correct
  - Confirm audit logging works for all operations
  - Ask the user if questions arise

- [ ] 14. Input Validation
  - [ ] 14.1 Create validation utilities
    - Implement validateRequiredFields() for form validation
    - Implement validateEmail() for email format
    - Implement validateDate() for date format
    - Implement sanitizeInput() to prevent injection attacks
    - _Requirements: 11.1, 11.2, 11.4, 13.4_
  
  - [ ] 14.2 Write property tests for validation
    - **Property 40: Required Field Validation**
    - **Property 41: Type and Format Validation**
    - **Property 42: Validation Error Messages**
    - **Property 43: Input Sanitization**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 13.4**
  
  - [ ] 14.3 Write unit tests for validation
    - Test required field validation
    - Test email format validation
    - Test date format validation
    - Test input sanitization
    - _Requirements: 11.1, 11.2, 11.4_

- [ ] 15. Error Handling
  - [ ] 15.1 Create error handling utilities
    - Define ErrorResponse interface
    - Create error formatting functions
    - Implement error logging with context
    - _Requirements: 9.3, 15.2_
  
  - [ ] 15.2 Add error handling to all services
    - Wrap database operations in try-catch
    - Use transactions for multi-step operations
    - Return user-friendly error messages
    - _Requirements: 9.3_
  
  - [ ] 15.3 Write property tests for error handling
    - **Property 38: Error Handling Maintains Consistency**
    - **Property 39: Error Logging**
    - **Validates: Requirements 9.3, 15.2**

- [ ] 16. API Routes and Server Actions
  - [ ] 16.1 Create authentication API routes
    - POST /api/auth/register for user registration
    - POST /api/auth/login for user login
    - POST /api/auth/logout for user logout
    - GET /api/auth/me for current user info
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 16.2 Create user management API routes
    - GET /api/users for listing users (admin only)
    - PATCH /api/users/[id]/role for role updates (admin only)
    - _Requirements: 2.2_
  
  - [ ] 16.3 Create event API routes
    - POST /api/events for event creation
    - GET /api/events for listing events
    - GET /api/events/[id] for event details
    - PATCH /api/events/[id] for event updates
    - DELETE /api/events/[id] for event deletion
    - PATCH /api/events/[id]/status for status changes
    - _Requirements: 3.1, 3.2, 3.5, 17.2_
  
  - [ ] 16.4 Create document API routes
    - POST /api/events/[id]/documents for document upload
    - GET /api/events/[id]/documents for listing documents
    - DELETE /api/documents/[id] for document deletion
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ] 16.5 Create checklist API routes
    - POST /api/checklist-templates for template creation (admin only)
    - GET /api/checklist-templates for listing templates
    - POST /api/events/[id]/checklist for checklist creation
    - PATCH /api/checklist-items/[id] for item updates
    - POST /api/checklists/[id]/items for adding items
    - DELETE /api/checklist-items/[id] for removing items
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [ ] 16.6 Create budget API routes
    - GET /api/budget for organizational budget
    - PATCH /api/budget for updating total funds (admin only)
    - POST /api/events/[id]/allocation for fund allocation (admin only)
    - POST /api/events/[id]/expenditures for recording expenditures
    - GET /api/events/[id]/expenditures for listing expenditures
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 16.7 Create audit API routes
    - GET /api/audit/[entityType]/[entityId] for entity audit trail
    - GET /api/audit/users/[userId] for user actions
    - _Requirements: 18.2_

- [ ] 17. Real-time Subscriptions
  - [ ] 17.1 Create RealtimeService for Supabase subscriptions
    - Implement subscribeToTable() for generic table subscriptions
    - Implement unsubscribe() for cleanup
    - _Requirements: 10.3_
  
  - [ ] 17.2 Create EventSubscriber for event updates
    - Implement subscribeToEvent() for single event updates
    - Implement subscribeToAllEvents() for event list updates
    - _Requirements: 10.1_
  
  - [ ] 17.3 Create BudgetSubscriber for budget updates
    - Implement subscribeToBudget() for budget changes
    - _Requirements: 10.2_

- [ ] 18. UI Components - Authentication
  - [ ] 18.1 Create login page with Tailwind CSS
    - Email and password input fields
    - Login button with loading state
    - Link to registration page
    - Error message display
    - _Requirements: 1.2, 1.3, 14.2_
  
  - [ ] 18.2 Create registration page with Tailwind CSS
    - Email, username, and password input fields
    - Role selection (default to organizer)
    - Register button with loading state
    - Link to login page
    - Error message display
    - _Requirements: 1.1, 14.2_
  
  - [ ] 18.3 Create navigation component
    - Display organization name
    - User menu with logout option
    - Role-based navigation links
    - _Requirements: 14.1, 16.4_

- [ ] 19. UI Components - Dashboard
  - [ ] 19.1 Create dashboard layout with Tailwind CSS
    - Responsive sidebar navigation
    - Main content area
    - Header with user info
    - _Requirements: 14.1, 14.4_
  
  - [ ] 19.2 Create organizer dashboard
    - List of user's events
    - Create event button
    - Event status indicators
    - _Requirements: 3.1, 8.1_
  
  - [ ] 19.3 Create officer dashboard
    - List of all events
    - Budget overview
    - Document management access
    - _Requirements: 8.2_
  
  - [ ] 19.4 Create admin dashboard
    - User management section
    - Budget management section
    - Organization settings
    - Audit log viewer
    - _Requirements: 2.2, 6.1, 8.2, 18.2_

- [ ] 20. UI Components - Events
  - [ ] 20.1 Create event list component with Tailwind CSS
    - Display events in card layout
    - Show event name, date, status
    - Filter by status
    - Search by name
    - _Requirements: 3.3, 14.1_
  
  - [ ] 20.2 Create event form component
    - Input fields for name, description, date, location
    - Checklist template selection
    - Submit button with validation
    - Error message display
    - _Requirements: 3.1, 5.2, 11.1, 14.2_
  
  - [ ] 20.3 Create event detail page
    - Display event information
    - Show associated documents
    - Display checklist with completion status
    - Show budget allocation and spending
    - Status change buttons (for authorized users)
    - _Requirements: 3.3, 4.2, 5.6, 7.1, 17.5_
  
  - [ ] 20.4 Integrate real-time updates for events
    - Subscribe to event changes
    - Update UI when event data changes
    - Show connection status indicator
    - _Requirements: 10.1, 10.5_

- [ ] 21. UI Components - Documents
  - [ ] 21.1 Create document upload component with Tailwind CSS
    - File input with drag-and-drop
    - Document type selection
    - Upload progress indicator
    - File size and type validation
    - _Requirements: 4.1, 4.4, 14.2_
  
  - [ ] 21.2 Create document list component
    - Display documents in table format
    - Show file name, type, upload date, uploader
    - Download and delete buttons
    - _Requirements: 4.2, 8.4_

- [ ] 22. UI Components - Checklists
  - [ ] 22.1 Create checklist template form (admin only)
    - Template name input
    - Dynamic item list with add/remove
    - Save button
    - _Requirements: 5.1_
  
  - [ ] 22.2 Create checklist component for events
    - Display checklist items with checkboxes
    - Show completion percentage
    - Add/edit/remove item buttons
    - Mark items complete/incomplete
    - Show "Event Ready" indicator when 100% complete
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 23. UI Components - Budget
  - [ ] 23.1 Create budget overview component
    - Display total funds, allocated funds, available funds
    - Visual progress bar for allocation
    - _Requirements: 6.4, 8.2_
  
  - [ ] 23.2 Create fund allocation form (admin only)
    - Event selection
    - Amount input with validation
    - Allocate button
    - Show available funds
    - _Requirements: 6.2, 6.5_
  
  - [ ] 23.3 Create expenditure form
    - Amount input
    - Description input
    - Document upload/selection
    - Record button
    - _Requirements: 7.2_
  
  - [ ] 23.4 Create event financial summary component
    - Display allocated budget
    - Display total expenditures
    - Display remaining funds
    - Show over-budget warning if applicable
    - List all expenditures with documents
    - _Requirements: 7.1, 7.4, 7.5, 8.4_
  
  - [ ] 23.5 Integrate real-time updates for budget
    - Subscribe to budget changes
    - Update UI when allocations or expenditures change
    - _Requirements: 10.2_

- [ ] 24. UI Components - Organization
  - [ ] 24.1 Create organization settings page (admin only)
    - Organization name, description, contact email inputs
    - Update total funds input
    - Save button
    - _Requirements: 16.3, 16.5_
  
  - [ ] 24.2 Initialize organization on first admin login
    - Create organization record with default values
    - Initialize budget to zero
    - _Requirements: 16.1_

- [ ] 25. Checkpoint - UI Complete
  - Ensure all UI components render correctly
  - Verify responsive design on desktop and tablet
  - Test user flows for each role
  - Ask the user if questions arise

- [ ] 26. Integration and Polish
  - [ ] 26.1 Add loading states to all async operations
    - Show spinners during API calls
    - Disable buttons during submission
    - _Requirements: 12.2, 14.2_
  
  - [ ] 26.2 Add success/error toast notifications
    - Show success messages for completed actions
    - Show error messages for failed operations
    - _Requirements: 14.2_
  
  - [ ] 26.3 Implement form validation on client side
    - Validate required fields before submission
    - Show inline error messages
    - Prevent submission of invalid forms
    - _Requirements: 11.1, 11.2, 14.2_
  
  - [ ] 26.4 Add confirmation dialogs for destructive actions
    - Confirm before deleting events
    - Confirm before deleting documents
    - Confirm before cancelling events
    - _Requirements: 14.3_
  
  - [ ] 26.5 Optimize performance
    - Add database query optimization
    - Implement pagination for large lists
    - Add caching where appropriate
    - _Requirements: 12.1, 12.3_

- [ ] 27. Integration Tests
  - [ ] 27.1 Write integration tests for authentication flow
    - Test complete registration → login → logout flow
    - Test session persistence across requests
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 27.2 Write integration tests for event management flow
    - Test create event → upload document → add checklist → allocate budget → record expenditure
    - Test event status transitions
    - _Requirements: 3.1, 4.1, 5.2, 6.2, 6.3_
  
  - [ ] 27.3 Write integration tests for role-based access
    - Test organizer can create events but not allocate budget
    - Test officer can upload documents and view budget
    - Test admin can perform all operations
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [ ] 28. Final Checkpoint - Complete System
  - Run all tests (unit, property, integration)
  - Verify all requirements are met
  - Test complete user journeys for each role
  - Ensure audit trail is working for all operations
  - Confirm real-time updates work correctly
  - Ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows a bottom-up approach: infrastructure → services → API → UI
- Real-time features are implemented after core functionality is working
- All services include error handling and audit logging
