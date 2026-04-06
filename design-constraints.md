# Structura — Design Constraints

**Document Version**: 1.0
**Last Updated**: April 2026

---

## Overview

This document defines the design constraints for the Structura platform. Design constraints are conditions the system must conform to — they are not negotiable and are imposed by the chosen technology stack, architecture decisions, and project requirements.

---

## Technology Stack

- DC-01: The system shall be built using Next.js 14+ with TypeScript as the primary framework.
- DC-02: The system shall use Tailwind CSS for all UI styling.
- DC-03: The system shall use Supabase PostgreSQL as the sole database.
- DC-04: The system shall use Supabase Storage for all file storage.
- DC-05: The system shall use iron-session and bcrypt for authentication and password hashing.
- DC-06: The system shall be deployed exclusively on Vercel.

---

## Architecture

- DC-07: The system shall follow the Next.js App Router architecture using Server Components and API Routes.
- DC-08: The system shall use stateless session management via encrypted cookies — no server-side session storage.
- DC-09: All database access shall go through server-side API routes or server actions — never directly from the client.
- DC-10: The system shall use environment variables for all credentials and API keys.

---

## Security

- DC-11: All passwords shall be hashed using bcrypt before storage — plaintext passwords shall never be stored.
- DC-12: All communication between the client and server shall occur over HTTPS.
- DC-13: Access to all platform features shall require an authenticated session.
- DC-14: All user inputs shall be validated on both the client and server side.

---

## Data

- DC-15: The audit trail table shall be immutable — no updates or deletions are permitted after an entry is created.
- DC-16: The system shall maintain a single organizational budget record at all times.
- DC-17: Each event shall have at most one checklist and one budget allocation.

---

## File Constraints

- DC-21: Each uploaded file shall not exceed 10 MB in size.
- DC-22: The system shall only accept files in PDF, DOCX, PNG, and XLSX formats.

---

## User Interface

- DC-18: The system shall use a role-based navigation structure — each role (Organizer, Officer, Admin) sees only the features relevant to their role.
- DC-19: The system shall provide feedback for all user actions, including success, error, and loading states.
- DC-20: The UI shall not support mobile screen sizes — desktop and tablet only (minimum 768px width).

---

Document Version: 1.0
Last Updated: April 2026
