# RBAC — Centralized Access Control Platform

Frontend + mock database for the Compass Group Centralized RBAC Platform.

**This stage delivers the Admin Console and a mock database only.** There is no backend.
The console renders from a generated fixture set that mirrors the SQL schema exactly, so
connecting the real RBAC Core API later is a change to one file.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Requires **Node 22** (per the technology stack). Other scripts:

```bash
npm run build        # static export -> apps/console/out
npm run typecheck
npm run db:generate  # regenerate the mock database + fixtures
```

---

## Repository layout

```
rbac/
├── apps/
│   └── console/                    Next.js 15 Admin Console (static export)
│       ├── app/                    App Router — one directory per screen
│       ├── components/             Design system + the three complex components
│       └── lib/
│           ├── api-client.ts       ← the single seam to the real API
│           └── mock/               generated fixtures (do not edit)
├── packages/
│   └── contracts/                  Shared DTOs, mirrors the SQL schema
└── db/
    ├── rbac_mock.sql               ← the mock database (schema + seed)
    └── seed/                       source of truth + generator
```

---

## 1. The mock database

**`db/rbac_mock.sql`** — Microsoft SQL Server DDL plus the demo dataset, in the engine the
technology stack specifies (MS SQL Server 2019 on AWS RDS).

```bash
sqlcmd -S <host> -U <user> -P <password> -i db/rbac_mock.sql
```

The file is in two halves. The **schema half is the production schema** — 11 tables, foreign
keys, unique constraints, status check constraints and all ten performance indexes from the
architecture document. The **seed half is mock data** and is the only part to discard when
real data arrives.

| Table | Rows | Notes |
|---|---:|---|
| `application` | 8 | 7 products + `rbac_console` (the console governs itself) |
| `action` | 58 | 7 standard per app, plus 2 custom and 1 deprecated |
| `resource` | 96 | screen trees; 1 deliberately `Orphaned` |
| `permission` | 638 | resource × action pairs with canonical strings |
| `role` | 28 | application-scoped; 1 `Inactive` |
| `role_permission` | 1,133 | |
| `app_user` | 18 | IdP mirrors — **no credential column exists** |
| `user_role` | 40 | with `assigned_by` and `assigned_at` |
| `audit_log` | 25 | append-only, before/after JSON snapshots |
| `system_version` | 1 | `permission_version = 4471` |
| `system_setting` | 6 | backs the Settings screen |

### Regenerating

`db/seed/seed-data.mjs` is the single source of truth. `npm run db:generate` renders it into
**both** the `.sql` file and the console's TypeScript fixtures, so the two can never drift.
The generator also runs integrity checks (dangling foreign keys, duplicate assignments,
orphaned tree parents) and fails loudly rather than emitting a broken dataset.

---

## 2. The frontend

All twelve wireframe screens plus a dashboard, built with Next.js 15 App Router as a
**static export** (`output: 'export'`) for S3 + CloudFront — no SSR, no server-side secrets.

| # | Screen | Route |
|---|---|---|
| — | **Dashboard** | `/` |
| 1 | Applications | `/applications` |
| 2 | Application Detail | `/applications/[id]` |
| 3 | Screens (Resource) | `/screens-actions` · also a tab on Application Detail |
| 4 | Actions | `/screens-actions` · also a tab on Application Detail |
| 5 | Roles | `/roles` |
| 6 | Role Detail & Permission Builder | `/roles/[id]` |
| 7 | Users | `/users` |
| 8 | User Detail | `/users/[id]` |
| 9 | Assignments | `/assignments` |
| 10 | Audit Log | `/audit-log` |
| 11 | Audit Log Detail | `/audit-log/[id]` |
| 12 | Settings | `/settings` |

### The dashboard

Not in the wireframes — the sidebar has a Dashboard entry on every screen but no design for
it. Scope was therefore drawn only from data the platform already holds: estate counts,
access coverage per application, the live `permission_version`, recent manifest syncs,
platform health (orphaned screens, deprecated actions, inactive users and roles) and recent
audit activity. **Confirm the intended content with the Product Owner before treating it as
final.**

### Three components carry the real complexity

- **`PermissionMatrix`** — screens × actions grid. Parent rows roll their descendants into a
  tri-state: all granted → *Full*, some → *Partial*, none → *None*. Clicking a Full parent
  clears its whole subtree; clicking Partial or None grants it. Bulk Select/Deselect All,
  Expand/Collapse All, and per-column grant. Pairs the manifest never declared render
  **disabled**, so an admin cannot invent a permission the application does not implement.
- **`ResourceTree`** — recursive screen tree with expand/collapse and search that keeps a
  matching node's ancestors visible.
- **`AuditDiff`** — side-by-side before/after with changed fields highlighted, plus a raw
  JSON view. Creates show no Before, deletes no After.

---

## 3. Connecting the real backend

Every function in **`apps/console/lib/api-client.ts`** is named and typed after an endpoint
in the Admin API contract:

```
listApplications()        GET  /v1/admin/applications
getApplication(id)        GET  /v1/admin/applications/:id
listResources(appId)      GET  /v1/admin/applications/:id/resources
listRoles(appId?)         GET  /v1/admin/roles?appId=
getUserRoles(id)          GET  /v1/admin/users/:id/roles
listAssignments()         GET  /v1/admin/assignments
listAuditLogs()           GET  /v1/admin/audit-logs
getSettings()             GET  /v1/admin/settings
getMyPermissions(u, app)  GET  /v1/me/permissions?app=
```

Replace the bodies with `fetch` calls. Signatures and return types already match the shapes
in `packages/contracts`, so **no component changes are required**, and
`apps/console/lib/mock/` can be deleted.

Two things become real at the same time: pages currently run as client components against
synchronous fixtures and will need async data loading (TanStack Query is the documented
choice), and `lib/session.ts` — which hard-codes the signed-in admin — must read the IdP JWT
and resolve the caller's `rbac-console` role.

---

## 4. Design

Light theme, near-monochrome, built for an internal tool that people read all day.

| Token | Value | Use |
|---|---|---|
| `--accent` | `#2E0D14` | **Highlights and accents only** — logo, active nav, checked state, focus ring, changed-field rows, bar fills |
| `--bg` / `--ink` | `#FFFFFF` / `#000000` | Primary interface |
| status | muted green / amber / grey | Active, Orphaned & Deprecated, Inactive |

Status colours are deliberately desaturated and always paired with a dot **and** a text
label, so nothing depends on colour alone. Every page carries an `Internal · Confidential`
marker and the console is excluded from search indexing.

---

## What has been verified

- `npm run typecheck` — clean, TypeScript strict mode
- `npm run build` — 90 pages exported, `npm audit` reports 0 vulnerabilities
- All **88 routes crawled in a headless browser** — 0 console errors, every page renders content
- **Tri-state matrix logic tested by interaction**: none → partial on one child; partial →
  full cascades the subtree; full → none clears it; dirty-state banner appears and clears correctly
- **Mock data reconciles with the wireframes exactly** — Saarthi-FX® shows 32 screens, and its
  five roles compute to 224 / 86 / 68 / 54 / 32 permissions from the actual grants
- SQL structurally validated: statement termination, quote escaping, foreign-key insert
  ordering, self-referencing parent ordering, teardown coverage, and audit JSON round-trip

---

## Known gaps

1. **Read-only.** Create, edit and delete controls open a dialog explaining that writes need
   the API. Nothing pretends to save.
2. **`Password Policy` and `Hybrid Access Key`** appear on the Settings screen because the
   wireframe shows them, but authentication belongs entirely to the IdP and RBAC stores no
   credentials. Their intended behaviour is undefined in the documentation — flagged in the
   UI and awaiting Product Owner confirmation.
3. **Dashboard scope is proposed, not specified** — see above.
4. **User counts per role are computed from the 18 seeded users**, so they are smaller than
   the illustrative figures in the wireframe (12 / 25 / 15 / 42 / 30). Permission counts,
   which are structural, match exactly. Self-consistent data was preferred over numbers that
   do not reconcile.
