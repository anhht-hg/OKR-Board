# OKR Board — AI Context & System Guide

This file is the single source of truth for any AI assistant working on this codebase.
Read this before touching ANY code.

---

## What This App Is

An internal OKR (Objectives & Key Results) tracking dashboard for **HG Entertainment's Technology & Operations team**.
It is a **Vietnamese-localized**, **admin/viewer role-based** web app for managing strategic goals through a multi-level hierarchy.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix UI |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| State | React Query (@tanstack/react-query v5) |
| Database | SQLite via Prisma 7 + better-sqlite3 adapter |
| Auth | httpOnly cookie session (`okr_role = 'admin' | 'viewer'`) |
| Deploy | Docker + PM2 + nginx |

---

## The Hierarchy — Most Critical Concept

There is ONE model (`OkrItem`) that forms a self-referencing tree.
**The hierarchy is strict and enforced at the API level:**

```
Objective
  └── SuccessFactor
        └── KeyResult
              └── Feature
                    ├── UserCapability
                    ├── Adoption
                    └── Impact
```

**Rules (from `src/lib/constants.ts` → `CHILD_TYPES`):**
- Objective can only have SuccessFactor children
- SuccessFactor can only have KeyResult children
- KeyResult can only have Feature children
- Feature can only have UserCapability, Adoption, or Impact children
- UserCapability / Adoption / Impact are leaf nodes (no children)

**NEVER break this hierarchy.** The API validates type changes and parent changes against these rules.
See `validateTypeChange()` and `wouldCreateCycle()` in `src/app/api/items/[id]/route.ts`.

---

## Progress Calculation — The Brain

**File:** `src/lib/progress.ts`

The system uses a **chotFlag-aware** formula. Do not change this logic without reading it fully.

### chotFlag Values
| Value | Meaning |
|---|---|
| `null` or `'TRUE'` | **Committed** — counts toward the goal |
| `'FALSE'` | **Bonus** — extra work, pushes progress >100% |

### Core Formula
```
progress = (done_committed + done_bonus) / total_committed × 100
```
- Result can exceed 100% when bonus items are done.
- If NO committed items exist → simple average of all children.

### Per-Type Logic
| Type | Formula |
|---|---|
| UserCapability / Adoption / Impact | `STATUS_WEIGHT[status]` (leaf) |
| Feature | chotFlag-avg of UC children |
| KeyResult | 60% delivery (Features) + 40% outcomes (Adoption/Impact via Features) |
| SuccessFactor | chotFlag-avg of KR/Feature children |
| Objective | 50% strategic (SF/KR children) + 50% delivery (Feature descendants) |

### Status Weights (`STATUS_WEIGHT`)
```
'Chưa bắt đầu'  → 0
'Đang triển khai' → 50
'Hoàn thành'     → 100
```

### Cascade Rules
- Changing status or chotFlag → `recalcAncestors(id)` (walks UP the tree)
- Item has children → `recalcItem(id)` (recalculates bottom-up then walks UP)
- Changing parentId → `recalcItem(oldParent)` + `recalcItem(id)` + `recalcAncestors(id)`
- chotFlag cascade: setting chotFlag on a parent RECURSIVELY sets it on ALL descendants

---

## Database Schema (Key Fields)

```prisma
model OkrItem {
  id          String    @id @default(cuid())
  code        String?             // e.g. "O.1", "KR-2"
  title       String
  type        String              // Objective|SuccessFactor|KeyResult|Feature|UserCapability|Adoption|Impact
  sortOrder   Int       @default(0)

  // Editable execution fields
  project     String?             // 'HG Stock'|'QL Kênh'|'Tài chính'|'Quản lý NS'|'Dữ liệu & Báo cáo'
  status      String    @default("Chưa bắt đầu")  // 'Chưa bắt đầu'|'Đang triển khai'|'Hoàn thành'
  startDate   DateTime?
  endDate     DateTime?
  owner       String?
  stakeholder String?
  chotFlag    String?             // null/'TRUE' = committed, 'FALSE' = bonus
  isOptional  Boolean   @default(false)

  // Strategic fields (read-only in UI)
  strategicPillar    String?
  deadline           String?
  pic                String?
  scope              String?
  description        String?
  successMetric      String?
  targetValue        String?
  measureFormula     String?
  corporateKRLinkage String?
  notes              String?

  // Computed
  progressPct Float @default(0)

  // Self-referencing tree
  parentId String?
  parent   OkrItem?  @relation("ItemTree", fields: [parentId], references: [id], onDelete: Cascade)
  children OkrItem[] @relation("ItemTree")
}
```

---

## API Routes Reference

All mutating endpoints (`POST`, `PATCH`, `DELETE`) require `okr_role=admin` cookie.
All `GET` endpoints are public.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/objectives` | Full tree (Objectives with 4 levels of nested children) |
| GET | `/api/items` | Filtered list (`?type=`, `?project=`, `?status=`, `?search=`, `?parentId=`) |
| POST | `/api/items` | Create item (auto-assigns sortOrder, triggers progress cascade) |
| GET | `/api/items/[id]` | Single item with 4-level nested children |
| PATCH | `/api/items/[id]` | Update item (validates type change + parent cycle detection) |
| DELETE | `/api/items/[id]` | Delete item + cascade delete children + recalc parent |
| GET | `/api/items/[id]/ancestors` | Breadcrumb chain from root to item (max 10 levels) |
| GET | `/api/items/[id]/children` | Direct children only |
| PATCH | `/api/items/reorder` | Reorder siblings (must share same parentId) |
| GET | `/api/dashboard` | Full dashboard stats (dual-track + project + roadmap) |
| GET | `/api/search` | Case-insensitive search by title/code (min 2 chars, max 20 results) |
| POST | `/api/auth/login` | Set `okr_role` cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Return current role |

---

## Safety Guards — DO NOT REMOVE

These were added to prevent system crashes. Do not remove or bypass them:

### 1. Circular Reference Prevention
`wouldCreateCycle(itemId, newParentId)` in `src/app/api/items/[id]/route.ts`
- Called on every `parentId` change in PATCH
- Walks up 20 ancestor levels from the new parent
- Returns 400 if cycle detected

### 2. Type Change Validation
`validateTypeChange(id, newType)` in `src/app/api/items/[id]/route.ts`
- Called on every `type` change in PATCH
- Checks new type is accepted by parent's CHILD_TYPES
- Checks new type can parent existing children's types
- Returns 400 with Vietnamese error message if invalid

### 3. Max Depth on Ancestor Walks
- `recalcAncestors()` in `progress.ts` → max 20 levels
- `/api/items/[id]/ancestors` route → max 10 levels
- These prevent runaway loops on bad data

---

## Authentication

- Single admin user: username `admin`, password from `ADMIN_PASSWORD` env var
- Session stored in httpOnly cookie `okr_role` (value: `'admin'` or `'viewer'`)
- 8-hour session expiry
- Viewer role: read-only, all write UI is hidden
- Middleware (`src/middleware.ts`): redirects admin away from `/login`

---

## Front-End Key Components

| File | Purpose |
|---|---|
| `src/components/dashboard/ItemDetailDrawer.tsx` | Right-side drawer for viewing/editing an item. Contains inline editing, breadcrumb nav, child list, and "change parent" feature. |
| `src/components/dashboard/CreateItemDrawer.tsx` | Right-side drawer for creating a new item. Has parent search, type selection, all metadata fields. |
| `src/context/AuthContext.tsx` | Provides `isAdmin`, `role`, `logout()` to all components. |
| `src/hooks/useObjectives.ts` | React Query hooks: `useObjectives`, `useItem`, `useItems`, `useUpdateItem`, `useCreateItem`, `useDeleteItem`. |
| `src/app/page.tsx` | Dashboard — server component, fetches all stats. |
| `src/app/objectives/page.tsx` | OKR Tree page — expandable hierarchy with detail drawer. |
| `src/app/list/page.tsx` | List view with filters. |

---

## Known Constraints

1. **SQLite does not support `mode: 'insensitive'`** in Prisma — use raw SQL with `LOWER()` for case-insensitive search (see `src/app/api/search/route.ts`).
2. **Progress can exceed 100%** — this is intentional (bonus items). Don't cap it.
3. **chotFlag cascade is destructive** — changing a parent's chotFlag to `'FALSE'` updates ALL descendants. No undo.
4. **`onDelete: Cascade`** — deleting any item deletes its entire subtree via DB cascade.
5. **Seed data**: 189 items in `prisma/seed/data.sql`. Restore with `prisma/seed/restore-db.sh`.

---

## Environment Variables

```env
ADMIN_PASSWORD=...          # Required: admin login password
DATABASE_URL=file:./dev.db  # SQLite file path (default: dev.db at project root)
```

---

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run seed      # Restore database from seed data
```
