# TaskFlow

> Enterprise-grade task and workflow orchestration platform for modern engineering and operations teams.

---

## Overview

**TaskFlow** is a modern B2B SaaS application designed to help small and medium-sized businesses organize work, assign responsibilities, track deliverables, and maintain cross-functional alignment. Built with high performance, strict data isolation, and a refined interface inspired by Linear and Notion, TaskFlow delivers commercial-quality productivity tools with automated transactional Gmail notifications.

---

## Features

- **Executive KPI Dashboard**: Live metrics tracking Total Tasks, In Progress, Completed, and Overdue deliverables with a segmented project health bar.
- **Full Task Lifecycle Management**: Create, view, update, reassign, and delete tasks with validated priorities (`LOW`, `MEDIUM`, `HIGH`) and statuses (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
- **Comprehensive Task Table & Mobile Cards**: Responsive layout featuring instant search, status filtering, priority filtering, teammate filtering, and multi-mode sorting (due date, creation date, priority).
- **Task Detail & Inline Editing**: Modal and drawer views displaying full descriptions, assignee, creator, due date alerts (overdue & due today badges), and audit timestamps.
- **Destructive Action Guards**: Accessible confirmation dialogs for task deletion and workspace sign-out.
- **Team Workload Directory**: Team visibility screen exposing member roles, active workloads, and completed task milestones.
- **Transactional Gmail Notifications**: Automated HTML emails sent to assignees upon task delegation and to creators upon task completion.
- **Enterprise Google OAuth 2.0**: Secure authentication via NextAuth v4 and Prisma session management.
- **Workspace Preferences**: Self-service profile review, email service diagnostics, and secure session management.

---

## Architecture

TaskFlow adopts a modern full-stack Next.js architecture combining Server Components for fast data delivery with React Client Components for reactive user interactions:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│   Landing Page  │  Login (OAuth)  │  Executive Workspace    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js App Server                       │
│  ┌───────────────────────┐      ┌─────────────────────────┐ │
│  │   Server Components   │      │    REST API Endpoints   │ │
│  │   & NextAuth Session  │      │ /api/tasks  /api/users  │ │
│  └───────────┬───────────┘      └────────────┬────────────┘ │
└──────────────┼───────────────────────────────┼──────────────┘
               │                               │
       Prisma 6 Client                 Prisma 6 Client
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                  PostgreSQL Database                        │
│   Users  │  Accounts  │  Sessions  │  Tasks (Relations)     │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ Nodemailer SMTP
┌──────────────────────────────┴──────────────────────────────┐
│                    Gmail SMTP Gateway                       │
│      Task Created Alerts    │    Task Completed Alerts      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & API handlers)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict type-checking)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with subtle dark-mode system tokens
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma 6.19](https://www.prisma.io/)
- **Authentication**: [NextAuth 4.24](https://next-auth.js.org/) with `@next-auth/prisma-adapter`
- **Email Delivery**: [Nodemailer 7.0](https://nodemailer.com/) with Gmail SMTP & App Passwords
- **UI & Icons**: [Lucide React](https://lucide.dev/), Sonner Toasts, Base UI

---

## Project Structure

```
taskflow/
├── prisma/
│   ├── schema.prisma        # Prisma data models (User, Task, Account, Session)
│   └── migrations/          # Version-controlled SQL migration history
├── public/                  # Static assets and favicons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts         # GET (list tasks) & POST (create task + email)
│   │   │   │   └── [id]/route.ts    # GET, PATCH (update + completion email), DELETE
│   │   │   └── users/route.ts       # GET (safe member list with task counts)
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Protected server component loading DB data
│   │   │   └── logout-button.tsx    # Sign-out action trigger
│   │   ├── login/
│   │   │   └── page.tsx             # Polished Google OAuth login screen
│   │   ├── globals.css              # Theme CSS tokens & Tailwind configuration
│   │   ├── layout.tsx               # Root layout with dark mode & Toaster
│   │   └── page.tsx                 # Commercial SaaS landing page
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── overview-metrics.tsx # KPI summary & recent tasks preview
│   │   │   └── workspace-shell.tsx  # Master workspace client coordinator
│   │   ├── layout/
│   │   │   ├── header.tsx           # Workspace top bar & breadcrumb
│   │   │   └── sidebar.tsx          # Navigation sidebar & responsive drawer
│   │   ├── settings/
│   │   │   └── settings-view.tsx    # Profile, notifications & account preferences
│   │   ├── tasks/
│   │   │   ├── create-task-modal.tsx# Form-validated task creation dialog
│   │   │   ├── task-card.tsx        # Card display component
│   │   │   ├── task-detail-modal.tsx# Task detail & edit/delete modal
│   │   │   └── task-table.tsx       # Desktop table & mobile cards with filters
│   │   ├── team/
│   │   │   └── team-view.tsx        # Member directory & workload breakdown
│   │   └── ui/                      # Primitive UI components & confirmation dialogs
│   ├── lib/
│   │   ├── auth-helpers.ts          # Server-side getAuthUser session resolver
│   │   ├── mail.ts                  # Nodemailer utility with responsive HTML templates
│   │   ├── prisma.ts                # Global PrismaClient singleton instance
│   │   └── utils.ts                 # Class merging helpers
│   ├── pages/api/auth/
│   │   └── [...nextauth].ts         # NextAuth v4 configuration route
│   └── types/
│       └── task.ts                  # Shared TypeScript interfaces
├── .env.example                     # Environment template (NO SECRETS)
├── package.json
├── README.md
└── tsconfig.json
```

---

## Authentication Flow

1. User clicks **"Continue with Google"** on `/login`.
2. NextAuth initiates Google OAuth 2.0 authorization request with `email` and `profile` scopes.
3. User authorizes TaskFlow on Google's consent screen.
4. Google redirects to `/api/auth/callback/google` with authorization code.
5. NextAuth exchanges code for tokens, verifies profile, and uses `@next-auth/prisma-adapter` to upsert the user record in PostgreSQL.
6. A secure database session token is stored in HTTP-only cookies.
7. User is redirected to `/dashboard`.
8. Unauthenticated requests to `/dashboard` or protected APIs automatically redirect or return `401 Unauthorized`.

---

## Task Flow

1. **Creation**: Authenticated user submits the "+ Create task" form (`title`, `description`, `priority`, `dueDate`, `assignedToId`).
2. **Server Validation**: `POST /api/tasks` validates title, resolves current session via `getAuthUser()`, confirms assigned user exists in DB, and creates the task with `status: PENDING`.
3. **Email Alert**: If assigned to a team member, `sendTaskCreatedEmail` dispatches a styled notification asynchronously.
4. **Tracking & Updates**: Creator and assignee can advance status through `PENDING` → `IN_PROGRESS` → `COMPLETED`.
5. **Editing**: Only the task creator has authorization to edit title, description, priority, due date, or assignee.
6. **Deletion**: Only the task creator can delete the task via `DELETE /api/tasks/[id]` after confirming via the modal guard.

---

## Email Notification Flow

- **Trigger 1 — Assignment**: Sent to the designated assignee when a task is created or assigned to them.
- **Trigger 2 — Completion**: Sent to the task creator when a task transitions to `COMPLETED`.
- **Duplicate Prevention**: Status updates from `COMPLETED` to `COMPLETED` never re-dispatch completion emails.
- **Fault-Tolerant Delivery**: Email operations run with non-blocking error handling. If SMTP credentials fail or network connectivity lapses, the database operation still succeeds and the user receives an informative toast.

---

## Environment Variables

Copy the template file to configure your local environment:

```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/taskflow` |
| `NEXTAUTH_URL` | Canonical app URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | 32-byte session encryption key | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth Client ID | `your-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth Client Secret | `GOCSPX-your-secret` |
| `GMAIL_USER` | Gmail address for SMTP sender | `team@company.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | `abcd efgh ijkl mnop` |

> ⚠️ **Security Warning**: Never commit `.env` or paste live secrets into source control. Keep `.env*` ignored by Git.

---

## Local Development

### 1. Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **pnpm**

### 2. Database Setup

Ensure PostgreSQL is running locally and your database exists:

```bash
# Create database (if not existing)
createdb taskflow

# Generate Prisma Client
npx prisma generate

# Apply existing migrations
npx prisma migrate deploy
```

### 3. Running Frontend

Start the Next.js development server:

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

To deploy TaskFlow to production (e.g. Vercel, Railway, AWS ECS, or Render):

1. **Build Verification**:
   ```bash
   npm run build
   ```
2. **Environment Variables**: Add all variables from `.env.example` in your hosting dashboard.
3. **Database Migration**: Run `npx prisma migrate deploy` in your CI/CD pipeline before traffic routing.
4. **Google OAuth Production Origin**:
   - Authorized JavaScript origin: `https://your-domain.com`
   - Authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

---

## Security

- **Server-Side Session Validation**: All API routes (`/api/tasks`, `/api/tasks/[id]`, `/api/users`) resolve authentication strictly using `getAuthUser()`.
- **Strict Role-Based Authorization**: Task modifications and deletions enforce that only authorized creators or assignees can modify state.
- **No Token Exposure**: OAuth refresh tokens, access tokens, and SMTP credentials remain strictly server-side.
- **SQL Injection Immune**: All database access uses Prisma parameterized queries.
- **Input Sanitization**: Request bodies are validated for structure, non-empty titles, valid enum values, and date parsing.

---

## Future Improvements

- [ ] Real-time websocket collaboration / live status sync across simultaneous active sessions.
- [ ] Task file attachments stored in S3-compatible cloud object storage.
- [ ] Customizable subtasks and checklist deliverables.
- [ ] Multiple workspace / organization switching support.
- [ ] Export task reports to CSV and PDF formats.

---

&copy; TaskFlow Technologies. All rights reserved.
