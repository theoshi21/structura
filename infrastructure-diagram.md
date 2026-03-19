# Structura - Network / Infrastructure Diagram

## Overview

This document describes the infrastructure setup and deployment process for the Structura platform.

## Network Diagram

```mermaid
graph TB
    subgraph Users
        A[Organizer]
        B[Officer]
        C[Admin]
    end

    subgraph GitHub
        D[Repository]
        E[CI/CD Pipeline]
    end

    subgraph Vercel
        F[Next.js App + API Routes]
    end

    subgraph Supabase
        I[PostgreSQL Database]
        J[Supabase Storage]
    end

    A & B & C -->|HTTPS| F
    D -->|Push to main| E
    E -->|Auto Deploy| F
    F -->|Queries| I
    F -->|File Upload/Download| J
```

## Deployment Setup Process

```mermaid
flowchart LR
    A[1. Supabase Setup] --> B[2. GitHub Setup] --> C[3. Vercel Setup] --> D[Live]

    A --> A1[Create Supabase project]
    A --> A2[Setup database schemas]
    A --> A3[Configure Storage bucket]
    A --> A4[Setup and Copy API keys]

    B --> B1[Create GitHub repository]
    B --> B2[Push project code]
    B --> B3[Add environment variables to repo]

    C --> C1[Connect GitHub repo to Vercel]
    C --> C2[Add environment variables to Vercel]
    C --> C3[Deploy]
```

## Components

- Users — Organizers, Officers, and Admins access the platform via browser over HTTPS
- GitHub — Source code repository; CI/CD pipeline auto-deploys to Vercel on every push to main
- Vercel — Hosts the Next.js application and API routes
- Supabase PostgreSQL — Stores all application data (users, events, documents, checklists, budgets)
- Supabase Storage — Stores uploaded files (permits, contracts, receipts, financial documents)

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_ANON_KEY | Supabase public API key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (server-side only) |
| SESSION_SECRET | Secret key for iron-session cookie encryption |
