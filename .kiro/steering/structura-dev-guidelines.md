---
inclusion: always
---

# Structura Development Guidelines

## General Principles

- Keep the codebase simple, clean, and organized
- Avoid over-engineering — build only what is needed
- Use consistent naming conventions across files, components, and database tables
- Keep components small and focused on a single responsibility
- Write readable code over clever code

## Development Order

Always follow this order:

1. Build the entire UI for all modules first (pages, layouts, components, forms)
2. Use placeholder handlers for buttons and actions that require backend logic
3. Once the full UI is complete, wire up each module's functionality one at a time (API routes, server actions, database calls)
4. Replace placeholders with real functionality as each module is implemented

The complete UI must be finished before any backend logic is written. This means all pages, navigation, forms, and layouts across every module should be in place — with placeholder buttons and mock states where needed — before moving on to functionality.

## Project Structure

Keep the folder structure flat and predictable:

- `app/` — Next.js pages and layouts
- `components/` — Reusable UI components
- `lib/` — Services, utilities, and database logic
- `types/` — TypeScript interfaces and types
- `public/` — Static assets

## Tech Stack

- Framework: Next.js 14+ with TypeScript
- Styling: Tailwind CSS
- Database: Supabase PostgreSQL
- Storage: Supabase Storage
- Authentication: iron-session + bcrypt
- Deployment: Vercel

## UI Guidelines

- Use Tailwind CSS utility classes — avoid custom CSS unless necessary
- Keep layouts responsive for desktop and tablet
- Use consistent spacing, colors, and typography throughout
- Provide clear feedback for all user actions (success, error, loading states)
- Keep forms simple with inline validation messages

## Code Guidelines

- Always validate inputs on both client and server side
- Use TypeScript types for all data models
- Handle errors gracefully and return user-friendly messages
- Never expose sensitive data (passwords, secrets) in responses
- Use environment variables for all credentials and API keys
- Always add a comment to every function describing what it does
