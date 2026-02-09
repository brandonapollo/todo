# Todo App - Implementation Plan

## Context

Build a date-grouped todo app with child todo support, clean UI, and Docker deployment. The app uses Bun + Hono (backend), React + Vite + Tailwind (frontend), and PostgreSQL. A repository pattern keeps the data layer swappable for future cloud sync.

## Stack

- **Runtime**: Bun
- **Backend**: Hono, Drizzle ORM, postgres.js
- **Frontend**: React, TanStack Query, Tailwind CSS v4
- **Database**: PostgreSQL 16
- **Containerization**: Docker Compose

## Project Structure

```
todo/
├── docker-compose.yml
├── .env / .env.example / .gitignore
├── backend/
│   ├── Dockerfile
│   ├── package.json, tsconfig.json, drizzle.config.ts
│   ├── src/
│   │   ├── index.ts                        # Entry point
│   │   ├── app.ts                          # Hono app factory
│   │   ├── db/
│   │   │   ├── schema.ts                   # Drizzle schema (todos table)
│   │   │   ├── connection.ts               # postgres.js + drizzle
│   │   │   └── migrate.ts                  # Migration runner
│   │   ├── repositories/
│   │   │   ├── todo.repository.ts          # Interface
│   │   │   └── drizzle-todo.repository.ts  # PostgreSQL implementation
│   │   ├── routes/
│   │   │   └── todos.ts                    # /api/todos handlers
│   │   └── types/
│   │       └── todo.ts                     # Shared types
│   └── drizzle/                            # Generated migrations
├── frontend/
│   ├── Dockerfile
│   ├── package.json, vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── index.css                       # @import "tailwindcss"
│       ├── api/todos.ts                    # Fetch wrappers
│       ├── hooks/useTodos.ts               # TanStack Query hooks
│       └── components/
│           ├── TodoInput.tsx               # Top input bar
│           ├── ViewToggle.tsx              # All | Undone toggle
│           ├── DateGroup.tsx               # Date header + todo list
│           ├── TodoItem.tsx                # Todo row with status controls
│           ├── ChildTodoList.tsx            # Nested children
│           └── AddChildInput.tsx           # Inline sub-todo input
```

## Database Schema

Single `todos` table with self-referential FK for parent-child:

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | `gen_random_uuid()` - UUID for future sync compatibility |
| title | TEXT | Not null |
| status | ENUM | `pending`, `done`, `cancelled`, `deleted` |
| created_at | TIMESTAMPTZ | Default now() |
| completed_at | TIMESTAMPTZ | Set when status -> done |
| parent_id | UUID (FK) | Nullable, references todos.id, CASCADE |
| position | INTEGER | For ordering within a group |
| created_date | DATE | Denormalized for efficient date grouping |

Indexes on: `parent_id`, `created_date`, `status`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/todos?status=pending` | List top-level todos grouped by date, children embedded |
| POST | `/api/todos` | Create a todo |
| PATCH | `/api/todos/:id` | Update title or status (auto-sets completedAt on done) |
| DELETE | `/api/todos/:id` | Soft delete (sets status=deleted, cascades to children) |
| POST | `/api/todos/:id/children` | Add a child todo |

Response format for GET: `{ groups: { "2025-02-09": [Todo, ...], "2025-02-08": [...] } }`

## Repository Pattern (Cloud Sync Readiness)

```
TodoRepository (interface)
  ├── DrizzleTodoRepository  (current: PostgreSQL)
  └── CloudTodoRepository    (future: swap by changing 1 line in app.ts)
```

No DI framework - just instantiate the repo in `app.ts` and pass to route factory.

## Key Design Decisions

- **UUID primary keys**: Prevent ID collisions for future cloud sync
- **Denormalized `created_date`**: Avoids `DATE()` casts in every query; indexed for fast grouping
- **Soft delete**: Status=deleted, filtered out of queries. Keeps data for undo/audit/sync
- **Server-side grouping**: Backend returns todos pre-grouped by date, keeping frontend simple
- **Optimistic updates**: For status changes (highest frequency interaction) via TanStack Query
- **Vite proxy**: Frontend dev server proxies `/api` to backend, no CORS config needed

## Implementation Order

### Phase 1: Scaffolding
1. Create root dir, `.gitignore`, `.env.example`, `git init`
2. Scaffold backend: `bun init`, install hono, drizzle-orm, postgres, drizzle-kit
3. Scaffold frontend: `bun create vite frontend -- --template react-ts`, install @tanstack/react-query, tailwindcss, @tailwindcss/vite
4. Create Dockerfiles + docker-compose.yml

### Phase 2: Database
5. Define Drizzle schema (`backend/src/db/schema.ts`)
6. Create connection + migration files, run `bun drizzle-kit generate`
7. Implement `TodoRepository` interface + `DrizzleTodoRepository`

### Phase 3: Backend API
8. Build Hono routes, app factory, entry point
9. Verify all endpoints with curl

### Phase 4: Frontend
10. Set up Tailwind v4, API client, TanStack Query hooks
11. Build TodoInput + ViewToggle
12. Build DateGroup + TodoItem (status controls, done date display)
13. Build ChildTodoList + AddChildInput
14. Polish UI (spacing, hover states, transitions)

### Phase 5: Docker Integration
15. `docker compose up --build` - verify full stack end-to-end

## Verification

1. `docker compose up --build` starts all services
2. Create a todo via the input -> appears under today's date
3. Add child todos via "+ sub" button
4. Mark todo as done -> completion date appears, line-through styling
5. Cancel a todo -> line-through red styling
6. Delete a todo -> disappears from view
7. Toggle "Undone" filter -> only pending todos visible
8. Refresh page -> all data persists from PostgreSQL
