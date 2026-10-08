# TaskFlow

> Enterprise-grade B2B team productivity and task management SaaS platform.

---

## 1. Product Overview

**TaskFlow** is a multi-tenant B2B SaaS platform engineered for agile software teams, creative agencies, and high-velocity startups. Built with a dark-mode design system inspired by Linear and Notion, TaskFlow transforms basic task tracking into an organized team operating system with strict workspace data isolation, granular role-based access control (RBAC), task activity audit logging, interactive comment threads, in-app notifications, and automated transactional Gmail updates.

---

## 2. Key Features

- **Multi-Tenant Workspaces**: Complete workspace isolation where all tasks, members, audit trails, and comments belong strictly to an organization.
- **Team Roles & Permissions (RBAC)**:
  - `OWNER`: Full administrative control, workspace settings, role modifications, member deletion.
  - `ADMIN`: Member invitation, task management across the team, member seat management.
  - `MEMBER`: Authorized creation, execution, and updating of assigned deliverables.
- **Task Activity Audit History**: Complete chronological log of state changes (task created, assigned, reassigned, priority changed, status moved, due date updated, completed).
- **Task Comments & Discussion**: Threaded real-time comments on deliverables with author avatars and relative timestamps.
- **Due Date & Overdue Intelligence**: Automatic categorisation into `Overdue`, `Due Today`, `Due Tomorrow`, and `Upcoming` with clear visual status pills and dashboard alerts.
- **Advanced Task Filtering & URL Persistence**:
  - Full-text search across titles and descriptions.
  - Multi-attribute filtering (Status, Priority, Assignee, Due Date).
  - Multi-mode sorting (Newest, Oldest, Due Date Soonest/Latest, Priority High/Low, Recently Updated).
  - Shareable and bookmarkable URL query parameter synchronization (`?status=...&due=...&sort=...`).
- **Comprehensive Task Detail Modal**: Two-pane interface with live status switcher, metadata grid, comment threads, and audit history.
- **In-App Notification Center**: Bell icon in header displaying unread badge counts, dropdown notification feed, mark-as-read, and mark-all-read actions.
- **Transactional Gmail Notifications**: High-deliverability transactional emails for task assignment, reassignment, completion, and updates via Gmail SMTP.
- **Executive Business Dashboard**:
  - Time-aware executive greeting.
  - Real-time KPI statistics: Total Tasks, In Progress, Completed, Overdue.
  - Progress bar with segment ratios.
  - Direct alert module for overdue deliverables.
  - Dedicated "Assigned to Me" and "Recent Deliverables" sections.
- **Team Workload Matrix**: Resource capacity visualization detailing each teammate's assigned, in progress, completed, and overdue volume to prevent burnout and bottlenecks.
- **Global Search & Keyboard Command Palette (`⌘K` / `Ctrl+K`)**:
  - Fast keyboard navigation across views.
  - Instant search across workspace deliverables and team members.
  - Quick action shortcuts (create task, jump to dashboard, view team, settings, logout).
- **Billing-Ready Architecture**: Conceptual tiered plans (`FREE`, `PRO`, `BUSINESS`) ready for Stripe webhook and checkout integration without blocking active workflows.
- **Workspace Settings**: Self-service profile review, workspace renaming, notification controls, and session termination guards.

---

## 3. System Architecture

TaskFlow uses the Next.js App Router combining Server Components for fast pre-fetching with React Client Components for real-time reactivity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Web Application                          │
│   Landing Page  │  Google Login  │  Executive Dashboard & Command ⌘K   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Next.js App Server                             │
│   ┌─────────────────────────────┐    ┌───────────────────────────────┐ │
│   │      Server Components      │    │       REST API Handlers       │ │
│   │   Pre-fetching & Auth Guard │    │ /api/tasks      /api/workspace│ │
│   │   Workspace Resolution      │    │ /api/notifications /api/search│ │
│   └──────────────┬──────────────┘    └──────────────┬────────────────┘ │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   │                                  │
          Prisma Client (ORM)                Prisma Client (ORM)
                   │                                  │
┌──────────────────▼──────────────────────────────────▼──────────────────┐
│                      PostgreSQL Database                               │
│  Users  │  Workspaces  │  WorkspaceMembers  │  Tasks  │  Subtasks      │
│  TaskActivities  │  TaskComments  │  Notifications  │  Accounts        │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ Nodemailer SMTP
┌───────────────────────────────────┴────────────────────────────────────┐
│                         Gmail SMTP Gateway                             │
│       Transactional alerts dispatched asynchronously in background     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema Design

Data models are managed via Prisma ORM connected to PostgreSQL:

### Core Entities & Relationships

1. **`User`**: Account identity created through Google OAuth. Has many tasks, workspace memberships, comments, activities, and notifications.
2. **`Workspace`**: Tenant boundary (`id`, `name`, `slug`, `plan`, `ownerId`). Has many members and tasks.
3. **`WorkspaceMember`**: Join table mapping `User` to `Workspace` with `role` (`OWNER`, `ADMIN`, `MEMBER`).
4. **`WorkspaceInvite`**: Pending seat invitations with secure token verification.
5. **`Task`**: Deliverable record scoped to `workspaceId`. Belongs to `createdBy` and optional `assignedTo`. Supports parent/subtask relationships (`parentId`).
6. **`TaskActivity`**: Immutable audit logs capturing action (`CREATED`, `ASSIGNED`, `REASSIGNED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `DUE_DATE_CHANGED`, `COMPLETED`, `COMMENTED`) with old/new values.
7. **`TaskComment`**: Threaded discussion entries tied to a task and commenter.
8. **`Notification`**: In-app notifications with read status (`isRead`), action link, and type.
9. **`Account` & `Session`**: NextAuth authentication tables for Google OAuth.

---

## 5. Authentication & Security Flow

1. **Google OAuth 2.0 via NextAuth v4**:
   - The user initiates sign-in on `/login`.
   - Google validates credentials and redirects to `/api/auth/callback/google`.
   - `@next-auth/prisma-adapter` matches or provisions the `User` record in PostgreSQL.
2. **Server-Side Session Validation**:
   - Every protected API and page validates authentication using `getAuthUserWithWorkspace()`.
   - Unauthenticated requests receive HTTP `401 Unauthorized`.
3. **Workspace Provisioning & Auto-Migration**:
   - When a user logs in, `getUserWorkspace(userId)` resolves their active workspace membership.
   - If a user has no workspace (e.g. legacy user), a personal workspace is automatically provisioned and any legacy orphan tasks are seamlessly attached without data loss.
4. **Server-Side RBAC Enforcement**:
   - Roles are checked in API handlers, not just hidden in UI.
   - Deleting a task or removing a member checks that the actor has `OWNER` or `ADMIN` rights in that specific workspace.
5. **Tenant Isolation**:
   - All queries filter by `workspaceId: workspace.id`.
   - Users cannot access, query, or mutate tasks or members from another workspace.

---

## 6. Task Lifecycle & Audit History

```
  ┌──────────────┐
  │   CREATED    │─── Logged to TaskActivity & In-App Notification dispatched
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   PENDING    │─── Initial state upon creation
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ IN PROGRESS  │─── Active work initiated
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  COMPLETED   │─── Final state; triggers creator confirmation email & audit entry
  └──────────────┘
```

Every transition automatically creates a `TaskActivity` record in the database containing the actor ID, action type, descriptive text, and prior/new state values.

---

## 7. Notification & Email Architecture

### In-App Notifications
- Dispatched when:
  - A task is assigned or reassigned to a user.
  - A task is marked completed (notifying the creator).
  - A comment is posted on a deliverable (notifying creator and assignee).
  - A task is nearing its due date.
- Stored directly in PostgreSQL with `isRead: boolean`.
- Real-time notification badge and interactive dropdown popover in the top navigation bar.

### Transactional Gmail SMTP Notifications
- Configured using Nodemailer with standard Gmail App Passwords (`GMAIL_USER`, `GMAIL_APP_PASSWORD`).
- **Resilient Background Execution**: Dispatched asynchronously (`Promise.catch(...)`) so SMTP timeouts or network failures never roll back the primary database transaction.
- **Anti-Spam Deduplication**: Notifications are only sent to legitimate recipient addresses and never to the actor who performed the action.

---

## 8. Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskflow?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-nextauth-secret-here"

# Google Cloud OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gmail Transactional SMTP (Optional, for email delivery)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-gmail-app-password"
```

> **Note**: Never commit `.env` or real credentials to version control. Keep `.env` listed in `.gitignore`.

---

## 9. Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database instance running locally or on a cloud provider (e.g. Supabase, Neon)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Prince2005v/TaskFlow.git
cd taskflow

# 2. Install dependencies
npm install

# 3. Synchronize database schema
npx prisma db push
npx prisma generate

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Production Deployment

### Building for Production

```bash
# Typecheck and build optimized bundle
npm run build

# Start production server
npm start
```

### Deployment on Vercel / Railway / AWS
1. Provision a managed PostgreSQL instance (Supabase, Neon, AWS RDS).
2. Set all environment variables (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`).
3. Set the Google OAuth Authorized Redirect URI to `https://your-domain.com/api/auth/callback/google`.
4. Run `npx prisma migrate deploy` in the build step to apply database migrations.

---

## 11. Security Considerations

- **SQL Injection Prevention**: 100% of database interactions run through Prisma's parameterized queries.
- **Cross-Tenant Data Leaks**: Every API route resolves the authenticated user's workspace ID and enforces `workspaceId: workspace.id` scoping.
- **Secret Hygiene**: All OAuth client secrets, database connection strings, and SMTP passwords remain strictly server-side and are omitted from client bundles.
- **Protected Endpoints**: Server-side validation rejects unauthenticated or unauthorized requests with standard HTTP status codes (`401`, `403`).
- **Confirmation Guards**: Dangerous actions (task deletion, member removal, sign out) require explicit user confirmation.

---

## 12. Future Roadmap

- **Stripe Billing Integration**: Webhook handlers for subscription checkout (`PRO` and `BUSINESS` tiers).
- **Custom Webhooks**: Slack and Discord integrations for task status events.
- **Attachments & File Uploads**: S3-compatible asset storage for deliverables.
- **Gantt & Kanban Views**: Alternative project visualization boards.
