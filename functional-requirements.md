# Structura - Functional Requirements

## Overview

This document outlines the functional requirements for Structura, organized by module. Each requirement is labeled for easy reference and traceability.

---

## User Authentication Module

Description: Manages user account creation, login, logout, and access control to ensure only authenticated users can access the platform.

Requirements:
- UF1: Create user accounts with hashed passwords
- UF2: User login with valid credentials
- UF3: User logout functionality
- UF4: Prevent unauthenticated access to platform features
- UF5: Display error messages for invalid login attempts

---

## Role-Based Access Control Module

Description: Assigns and manages user roles (Organizer, Officer, Admin) with specific permissions to control access to system features based on user responsibilities.

Requirements:
- RF1: Assign exactly one role per user (Organizer, Officer, or Admin)
- RF2: Update user roles by Admin
- RF3: Enforce role-based permissions for all actions
- RF4: Deny unauthorized actions and display an appropriate message
- RF5: Display features and navigation based on the user's role

---

## Event Management Module

Description: Enables users to create, update, view, and manage event proposals throughout their lifecycle from proposal to completion or cancellation.

Requirements:
- EF1: Create event proposals with name, description, date, location, and status
- EF2: Update event proposals
- EF3: View event details with associated documents, checklists, and budget
- EF4: Delete event proposals
- EF5: Change event status (Proposed, Approved, Completed, Cancelled)

---

## Document Management Module

Description: Handles uploading, storing, viewing, and deleting documents associated with events, including permits, contracts, promotional materials, receipts, and financial records.

Requirements:
- DF1: Upload documents and link to events
- DF2: View all documents associated with an event
- DF3: Support document types (permits, contracts, promotional, receipts, financial)
- DF4: Delete documents
- DF5: Validate file format and size on upload

---

## Checklist Management Module

Description: Provides tools to create reusable checklist templates and manage event-specific checklists to track task completion and ensure event readiness.

Requirements:
- CF1: Create checklist templates
- CF2: Apply checklist templates to events
- CF3: Create custom checklists for events
- CF4: Add, modify, or remove checklist items
- CF5: Mark checklist items as complete
- CF6: Calculate and display completion percentage

---

## Budget Management Module

Description: Manages organizational budget, fund allocation to events, expenditure tracking, and financial oversight to ensure transparency and prevent over-spending.

Requirements:
- BF1: Maintain organizational budget with total available funds
- BF2: Allocate funds to events
- BF3: Record expenditures against events
- BF4: Display allocated budget, total expenditures, and remaining funds per event
- BF5: Prevent over-allocation of funds
- BF6: Require financial document for each expenditure

---

## Audit Trail Module

Description: Records and maintains an immutable log of all critical operations including budget allocations, expenditures, and status changes for accountability and transparency.

Requirements:
- AF1: Record user ID, action type, and timestamp for critical operations
- AF2: Display audit logs for budget allocations, expenditures, and status changes
- AF3: Prevent modification or deletion of audit log entries
- AF4: Maintain audit logs for role changes and user management actions
- AF5: Display last modified timestamp and user for events and budget records

---

Document Version: 1.0  
Last Updated: March 2026  
Total Functional Requirements: 30