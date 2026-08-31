# Product Requirements Document (PRD)
# Centralized Role-Based Access Control (RBAC) Platform
### Compass Group — Enterprise Digital Platforms

| Field | Value |
|---|---|
| **Document Version** | v1.0 |
| **Status** | Draft — Pending Approval |
| **Product Owner** | Compass Group Engineering |
| **Last Updated** | August 2026 |
| **Audience** | Engineering, Product, QA, Security, DevOps |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Stakeholders](#4-stakeholders)
5. [User Personas](#5-user-personas)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [User Stories & Acceptance Criteria](#8-user-stories--acceptance-criteria)
9. [Admin Console Screen Specifications](#9-admin-console-screen-specifications)
10. [API Contracts](#10-api-contracts)
11. [Data Model](#11-data-model)
12. [Constraints & Assumptions](#12-constraints--assumptions)
13. [Out-of-Scope (v1)](#13-out-of-scope-v1)
14. [Release Milestones](#14-release-milestones)
15. [Open Questions](#15-open-questions)
16. [Revision History](#16-revision-history)

---

## 1. Executive Summary

Compass Group operates a portfolio of enterprise applications — including *Saarthi-FX®*, *FoodBook*, *MediRest App*, *Shield*, *Insights*, *SmartQ Platforms*, and *Learning Platform* — each currently managing its own authorization logic, role definitions, and permission stores. This fragmented model leads to inconsistent security policies, duplicated engineering effort, audit gaps, and a high risk of access control drift between applications.

The **Centralized RBAC Platform** is an enterprise-grade, standalone authorization service that decouples authorization from application code and provides a single, canonical source of truth for access control across all Compass Group products. It comprises three deliverables:

1. **RBAC Core Engine** — A NestJS REST API hosted on AWS Lambda, backed by Microsoft SQL Server on AWS RDS.
2. **Central Admin Console** — A Next.js 15 web application enabling security administrators to manage applications, roles, permissions, users, assignments, and audits.
3. **Client SDK** — A private npm package (`@compass/rbac-sdk`) enabling consuming applications to query, cache, and evaluate permissions at runtime.

---

## 2. Problem Statement

### Current State
Each Compass Group application independently:
- Defines and stores its own roles (e.g., `admin`, `viewer`) in isolated databases.
- Hard-codes permission checks throughout application code.
- Manages user-role assignments without cross-system visibility.
- Lacks a unified, immutable audit trail for security compliance.
- Requires engineering involvement to add or modify roles, permissions, or users.

### Consequences
| Pain Point | Impact |
|---|---|
| Permission drift between applications | Security vulnerabilities and inconsistent UX |
| No cross-system audit log | Compliance and forensic investigation gaps |
| Code-coupled authorization | Hard to change; breaks across deployments |
| No centralized user-role dashboard | Admin overhead; manual coordination between teams |
| Every new app reinvents RBAC | Wastes ~4–8 engineer-weeks per application |

### Desired Future State
- **One platform** manages roles, permissions, and assignments for all Compass Group applications.
- Security administrators can configure and audit access without engineering involvement.
- Applications declare their screens and actions declaratively via a manifest at build time.
- Runtime authorization checks are near-zero latency using a local SDK cache.

---

## 3. Goals & Success Metrics

### Primary Goals
| # | Goal |
|---|---|
| G1 | Eliminate authorization code from all consumer applications (decoupled via SDK). |
| G2 | Provide a zero-downtime, high-availability authorization runtime with <50ms P99 latency. |
| G3 | Unify role and user management in one admin portal accessible to Security Admins. |
| G4 | Produce an immutable, searchable audit log for every authorization change event. |
| G5 | Enable onboarding of a new application to RBAC in under 2 hours. |

### Key Performance Indicators (KPIs)

| Metric | Target (v1) |
|---|---|
| Runtime API P99 Latency | < 50ms (cached) |
| Admin API P99 Latency | < 500ms |
| Manifest Sync Duration | < 5 seconds per app |
| SDK Cache Hit Rate | > 95% of permission checks |
| Applications Onboarded at Launch | ≥ 3 (Saarthi-FX®, FoodBook, RBAC Console itself) |
| Audit Event Completeness | 100% of create/update/delete role & assignment events |
| System Availability | 99.9% monthly uptime |

---

## 4. Stakeholders

| Role | Name / Team | Responsibility |
|---|---|---|
| Product Owner | Compass Group Digital | Approve requirements & priorities |
| Engineering Lead | Platform Engineering Team | Technical design & delivery |
| Security Admin | IT Security Team | Primary end-user of the Admin Console |
| Consumer App Teams | Saarthi-FX, FoodBook, etc. | Integrate with SDK; register manifests |
| DevOps / Cloud | Infrastructure Team | Deploy AWS CDK stacks; manage RDS |
| QA | Quality Assurance Team | Validate functional & security requirements |

---

## 5. User Personas

### Persona 1: Security Administrator ("Sarah")
- **Role**: IT Security Admin at Compass Group HQ
- **Technical Level**: Moderate — comfortable with web tools; not a developer
- **Goals**:
  - Create and manage roles for applications without needing engineering support.
  - Assign or revoke user access quickly and with an audit trail.
  - View who has access to what, across all applications.
- **Pain Points**: Currently relies on Jira tickets to get engineering to add a user to a role.

### Persona 2: Application Developer ("Dev Team")
- **Role**: Feature engineers on FoodBook, Saarthi-FX, etc.
- **Technical Level**: High
- **Goals**:
  - Register their app's screens and actions via a manifest sync in the CI pipeline.
  - Use a simple `can('screen:action')` call to gate UI and API access.
  - Never write authorization logic from scratch again.
- **Pain Points**: Auth logic scattered across controllers; duplicated role tables per service.

### Persona 3: Super Admin ("Platform Admin")
- **Role**: Platform Engineering team member
- **Technical Level**: High
- **Goals**:
  - Bootstrap new applications into the RBAC system.
  - Manage system-level configurations (session timeout, audit retention, sync intervals).
  - Access all audit logs for forensic investigations.
- **Pain Points**: No centralized visibility into who changed what access policy and when.

---

## 6. Functional Requirements

### FR-1: Application Registry

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | The system shall allow Super Admins to register a new application with a name, app_key, and description. | **Must Have** |
| FR-1.2 | Each registered application shall receive a unique `client_id` and `client_secret` for machine API authentication. | **Must Have** |
| FR-1.3 | Applications shall be listed with status (Active/Inactive), manifest version, and last sync timestamp. | **Must Have** |
| FR-1.4 | Administrators shall be able to toggle application status between Active and Inactive. | **Must Have** |
| FR-1.5 | The system shall display aggregate counts (total screens, total actions, total roles) per application. | **Should Have** |

### FR-2: Manifest Sync Engine

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | The system shall expose a `POST /v1/manifest/sync` endpoint authenticated via client credentials. | **Must Have** |
| FR-2.2 | The manifest payload shall declare the application key, version string, a list of actions, and a list of resources (screens) with optional parent keys. | **Must Have** |
| FR-2.3 | The sync operation shall be idempotent — multiple identical syncs must not produce duplicate records. | **Must Have** |
| FR-2.4 | Resources and actions present in the DB but absent from the incoming manifest, and currently referenced by a role, shall be marked `Orphaned`/`Deprecated` rather than deleted. | **Must Have** |
| FR-2.5 | Resources absent from the incoming manifest and not referenced by any role may be safely deleted. | **Must Have** |
| FR-2.6 | Each successful sync shall update the application's `manifest_version` and `last_sync_at` fields. | **Must Have** |
| FR-2.7 | The Admin Console shall provide a "Sync Now" button to manually trigger a manifest re-fetch. | **Should Have** |

### FR-3: Screen & Action Management

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | The system shall store and render resources (screens) in a hierarchical tree structure supporting unlimited depth. | **Must Have** |
| FR-3.2 | Administrators shall be able to browse the resource tree per application with expand/collapse toggles. | **Must Have** |
| FR-3.3 | The system shall support a standard action set: `read`, `write`, `update`, `delete`, `export`, `approve`, `publish`. | **Must Have** |
| FR-3.4 | Administrators shall be able to add custom actions to an application without requiring schema migrations. | **Should Have** |
| FR-3.5 | Each permission shall be uniquely identified by a canonical string in the format `resource_key:action_key` (e.g. `invoices:read`). | **Must Have** |

### FR-4: Role Management

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Administrators shall be able to create, read, update, and deactivate roles scoped to a specific application. | **Must Have** |
| FR-4.2 | Roles shall not be shareable across application boundaries. | **Must Have** |
| FR-4.3 | Each role shall display aggregated permission count and user count. | **Should Have** |
| FR-4.4 | The system shall provide an interactive Permission Builder matrix: screens as rows, actions as columns, with checkboxes at each intersection. | **Must Have** |
| FR-4.5 | Parent screens in the matrix shall display a tri-state checkbox (Full / Partial / None) reflecting the union of all child screen permissions. | **Must Have** |
| FR-4.6 | The matrix shall support bulk operations: Select All, Deselect All, Expand All, Collapse All. | **Should Have** |
| FR-4.7 | Saving a role permission matrix shall atomically replace all current role permissions and increment the global `permission_version`. | **Must Have** |

### FR-5: User Management & Assignments

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | The system shall mirror user identities from the IdP via `external_id` (JWT `sub` claim). | **Must Have** |
| FR-5.2 | Administrators shall be able to list, search, and view users with their application-role mappings. | **Must Have** |
| FR-5.3 | Administrators shall be able to assign one or more roles to a user per application. | **Must Have** |
| FR-5.4 | Administrators shall be able to revoke role assignments from users. | **Must Have** |
| FR-5.5 | Effective permissions for a user shall be computed as the **union** of all roles assigned to that user within the application. | **Must Have** |
| FR-5.6 | Every assignment creation and revocation shall be recorded in the audit log with `assigned_by`. | **Must Have** |
| FR-5.7 | User status (Active/Inactive) shall be manageable from the Admin Console. | **Should Have** |

### FR-6: Runtime Permissions API

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | The system shall expose `GET /v1/me/permissions?app={app_key}` authenticated via user JWT. | **Must Have** |
| FR-6.2 | The response shall include: the current `permission_version`, list of role names, flat list of canonical permission strings, and a hierarchical menu tree of accessible screens. | **Must Have** |
| FR-6.3 | The Client SDK shall cache the permissions response locally and re-fetch only when the server `permission_version` differs from the locally cached version. | **Must Have** |
| FR-6.4 | The SDK shall expose a `can(permissionString: string): boolean` evaluator. | **Must Have** |
| FR-6.5 | The SDK shall provide Express/Fastify/Next.js route middleware helpers for automated gate logic. | **Should Have** |

### FR-7: Audit Log

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Every create, update, and delete event on roles, permissions, assignments, and manifest syncs shall produce an immutable audit log entry. | **Must Have** |
| FR-7.2 | Each audit entry shall capture: actor ID, application, entity type, entity ID, event type, before-state (JSON), after-state (JSON), and timestamp. | **Must Have** |
| FR-7.3 | Administrators shall be able to filter audit logs by application, event type, entity, actor, and date range. | **Must Have** |
| FR-7.4 | The audit log detail view shall render a human-readable, side-by-side JSON diff of before and after states. | **Should Have** |
| FR-7.5 | Audit records shall never be editable or deletable by any user role. | **Must Have** |

### FR-8: System Settings

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | Super Admins shall be able to configure global action defaults (list of default actions applied to all new applications). | **Should Have** |
| FR-8.2 | System settings shall include: session timeout, MFA enforcement toggle, manifest sync interval, and audit log retention period. | **Should Have** |

---

## 7. Non-Functional Requirements

### NFR-1: Performance
| ID | Requirement |
|---|---|
| NFR-1.1 | Runtime permissions API (`GET /v1/me/permissions`) must respond in **< 50ms P99** at 1000 concurrent requests. |
| NFR-1.2 | Admin API endpoints must respond in **< 500ms P99** under normal load. |
| NFR-1.3 | SDK permission evaluation (`can()`) must be **synchronous and < 1ms** (evaluated against in-memory cache). |

### NFR-2: Security
| ID | Requirement |
|---|---|
| NFR-2.1 | All HTTP endpoints must be served over HTTPS/TLS 1.2+. |
| NFR-2.2 | User-facing Admin API must validate JWT tokens issued by the enterprise IdP on every request. |
| NFR-2.3 | Machine API manifest sync endpoint must validate `client_id` / `client_secret` credentials before processing. |
| NFR-2.4 | `client_secret` must be stored as a bcrypt hash (`cost ≥ 12`); never returned in API responses after creation. |
| NFR-2.5 | The RBAC Console itself must be registered as an application in the system and subject to the same permission model. |
| NFR-2.6 | Audit log records must be immutable — no UPDATE or DELETE SQL operations permitted on the `audit_log` table. |

### NFR-3: Scalability & Availability
| ID | Requirement |
|---|---|
| NFR-3.1 | The system shall target **99.9% monthly uptime** for the runtime API. |
| NFR-3.2 | The runtime Lambda shall have **provisioned concurrency** to eliminate cold-start latency on the hot path. |
| NFR-3.3 | AWS RDS SQL Server shall be deployed in **Multi-AZ** configuration for production environments. |

### NFR-4: Maintainability
| ID | Requirement |
|---|---|
| NFR-4.1 | Database migrations must run as a gated CI/CD step before Lambda deployment; `synchronize: true` must be disabled in TypeORM across all environments. |
| NFR-4.2 | Lambda bundle size must remain **< 15MB** (enforced via esbuild bundling). |
| NFR-4.3 | The monorepo must be structured as a pnpm workspace with shared contracts (`packages/contracts`) consumed by both API and Console. |

### NFR-5: Observability
| ID | Requirement |
|---|---|
| NFR-5.1 | All Lambda functions must emit structured JSON logs to AWS CloudWatch. |
| NFR-5.2 | Key business events (manifest sync, role save, assignment change) must emit CloudWatch metrics. |
| NFR-5.3 | API Gateway access logs must be enabled with correlation request IDs. |

---

## 8. User Stories & Acceptance Criteria

### Epic 1: Application Onboarding

**US-1.1 — Register an Application**
> *As a Super Admin, I want to register a new application so that it can begin syncing its screens and actions to the RBAC system.*

**Acceptance Criteria:**
- Given I am logged in as Super Admin, when I navigate to Applications and click "Add Application", then I am presented with a form requesting: Name, App Key (unique slug), Description.
- When I submit the form, the system generates and displays a `client_id` and `client_secret` once — the secret is not retrievable again.
- The new application appears in the Applications list with status `Active`, manifest version `—`, and last sync `Never`.

---

**US-1.2 — Manifest Sync via CI Pipeline**
> *As a consuming application developer, I want to push my application's screens and actions in a CI pipeline step so that the RBAC system always reflects my latest deployed structure.*

**Acceptance Criteria:**
- Given valid client credentials, when I `POST /v1/manifest/sync` with a valid JSON payload, the system returns `200 OK` with a sync summary.
- Resources and actions from the payload that do not exist are created; existing ones are updated idempotently.
- Resources present in the DB but missing from the payload and referenced by a role are marked `Orphaned`; unreferenced ones are deleted.

---

### Epic 2: Role & Permission Management

**US-2.1 — Create a Role**
> *As a Security Admin, I want to create a new role for an application so that I can define a set of permissions for a job function.*

**Acceptance Criteria:**
- I can create a role with a name and description, scoped to a specific application.
- The role is immediately visible in the Roles list with 0 users and 0 permissions.
- Creating a role is recorded in the audit log.

---

**US-2.2 — Configure Role Permissions via Matrix**
> *As a Security Admin, I want to use the Permission Builder matrix to visually select which screens and actions a role grants access to.*

**Acceptance Criteria:**
- The matrix displays all active resources (screens) for the selected application as rows and all active actions as columns.
- Parent screens display tri-state checkboxes: Full (all children checked), Partial (some children checked), None (no children checked).
- Clicking a parent's Full checkbox grants all child screen permissions for that action; clicking Partial or None cycles through states.
- Saving the matrix atomically replaces all existing role permissions and increments `permission_version`.
- The save event is recorded in the audit log with before and after JSON states.

---

**US-2.3 — Assign a User to a Role**
> *As a Security Admin, I want to assign a user to a role so that they gain the permissions associated with that role.*

**Acceptance Criteria:**
- I can select a user, an application, and a role from the Assignments page and click "Add Assignment".
- The assignment is recorded in `user_role` with `assigned_by` set to the acting admin's user ID.
- `permission_version` is incremented upon assignment.
- The assignment event is written to the audit log.
- If the user already has that role, the system returns an informative error (no duplicate assignments).

---

### Epic 3: Runtime Authorization

**US-3.1 — Retrieve Permission Snapshot**
> *As a consuming application, I want to fetch the current user's permissions at session start so that I can gate UI and API access without querying RBAC on every action.*

**Acceptance Criteria:**
- `GET /v1/me/permissions?app=billing` authenticated with a valid user JWT returns: `version`, `roles[]`, `permissions[]` (canonical strings), and `menu[]` (hierarchical tree).
- If the user has no roles for the application, `permissions` and `menu` are empty arrays; `version` still returns the current global version.
- Response time is < 50ms P99.

---

**US-3.2 — Evaluate a Permission Check**
> *As a consuming application developer, I want to call `can('invoices:read')` in my frontend/backend code so that I can gate access without implementing custom logic.*

**Acceptance Criteria:**
- `RBACClient.can('invoices:read')` returns `true` if the permission string is in the cached permissions list, `false` otherwise.
- The SDK re-fetches from the RBAC API only when the locally cached `version` is stale.
- The SDK evaluator is synchronous and executes in under 1ms.

---

## 9. Admin Console Screen Specifications

### Screen 1: Applications List
- **Route**: `/applications`
- **Purpose**: Global overview of all registered applications.
- **Key Elements**: Search bar, status filter, table columns (Name, App Key, Status, Manifest Version, Last Sync, Actions).
- **Primary Actions**: "Add Application" → opens modal.
- **API**: `GET /v1/admin/applications?search=&status=`

### Screen 2: Application Detail
- **Route**: `/applications/:id`
- **Purpose**: Per-application summary dashboard.
- **Key Elements**: Stats cards (Manifest Version, Last Sync, Total Screens, Total Actions, Total Roles), Description, Manifest Endpoint display, "Sync Now" button, Tab navigation (Screens, Actions, Roles).
- **API**: `GET /v1/admin/applications/:id`

### Screen 3: Screens Tab
- **Route**: `/applications/:id?tab=screens`
- **Purpose**: Browse the resource tree for an application.
- **Key Elements**: Hierarchical tree view with expand/collapse, Level badges, Status badges (Active, Orphaned, Deprecated), tree-modal toggle.
- **API**: `GET /v1/admin/applications/:id/resources`

### Screen 4: Actions Tab
- **Route**: `/applications/:id?tab=actions`
- **Purpose**: Manage the action catalog for an application.
- **Key Elements**: Table (Name, Key, Description, Status), "+ Add Custom Action" button.
- **API**: `GET /v1/admin/applications/:id/actions`

### Screen 5: Roles List
- **Route**: `/roles`
- **Purpose**: Browse and manage roles across applications.
- **Key Elements**: Application selector (dropdown), search bar, table (Role Name, Description, User Count, Permission Count, Status), "+ Create Role" button.
- **API**: `GET /v1/admin/roles?appId=`

### Screen 6: Role Detail & Permission Builder
- **Route**: `/roles/:id`
- **Purpose**: Interactive matrix to configure role permissions.
- **Key Elements**: Role name/description header, Permission Matrix (Screens × Actions grid), tri-state parent checkboxes, Bulk controls (Select All, Deselect All, Expand All), Save / Cancel buttons.
- **API Read**: `GET /v1/admin/roles/:id`
- **API Write**: `PUT /v1/admin/roles/:id` (replaces permission set)

### Screen 7: Users List
- **Route**: `/users`
- **Purpose**: Browse all users mirrored from IdP.
- **Key Elements**: Search, table (Name, Email, Status, App Count, Last Login), "+ Add User" button.
- **API**: `GET /v1/admin/users?search=`

### Screen 8: User Detail
- **Route**: `/users/:id`
- **Purpose**: Per-user role assignment overview.
- **Key Elements**: User info banner, Applications & Roles tab (table of apps and assigned roles), Activity tab (recent audit events for this user).
- **API**: `GET /v1/admin/users/:id/roles`

### Screen 9: Assignments
- **Route**: `/assignments`
- **Purpose**: Manage user-to-role mappings.
- **Key Elements**: Filters (User, Application, Role), table (User, App, Role, Assigned Date, Assigned By, Revoke action), "+ Add Assignment" button.
- **API**: `GET /v1/admin/assignments`, `POST /v1/admin/assignments`, `DELETE /v1/admin/assignments/:id`

### Screen 10: Audit Log
- **Route**: `/audit-log`
- **Purpose**: Security and compliance audit trail.
- **Key Elements**: Filters (Application, Event Type, Entity Type, Date Range, Search), paginated timeline table (Actor, Entity, Event, Application, Time).
- **API**: `GET /v1/admin/audit-logs?page=&appId=&eventType=&entityType=&from=&to=`

### Screen 11: Audit Log Detail
- **Route**: `/audit-log/:id`
- **Purpose**: Inspect the before/after state of a specific audit event.
- **Key Elements**: Header metadata (Event Type, Entity, Actor, Timestamp), Side-by-side Before/After diff card with syntax-highlighted JSON.
- **API**: `GET /v1/admin/audit-logs/:id`

### Screen 12: Settings
- **Route**: `/settings`
- **Purpose**: Global system configuration.
- **Key Elements**: Global Actions defaults table, System Settings form (Session Timeout, MFA Toggle, Manifest Sync Interval, Audit Retention Period in days), Save button.
- **API**: `GET /v1/admin/settings`, `PUT /v1/admin/settings`

---

## 10. API Contracts

### Machine API

**Endpoint**: `POST /v1/manifest/sync`
**Auth**: `Authorization: Basic base64(client_id:client_secret)` or `X-API-Key`

**Request Body**:
```json
{
  "app": "billing",
  "version": "2026.08.11",
  "actions": ["read", "write", "update", "delete", "export"],
  "resources": [
    {
      "key": "invoices",
      "name": "Invoices",
      "actions": ["read", "write", "update", "delete", "export"]
    },
    {
      "key": "invoices.credit_note",
      "name": "Credit Notes",
      "parent": "invoices",
      "actions": ["read", "write"]
    }
  ]
}
```

**Success Response** (`200 OK`):
```json
{
  "synced": true,
  "version": "2026.08.11",
  "created": { "resources": 1, "actions": 0 },
  "updated": { "resources": 1, "actions": 0 },
  "orphaned": { "resources": 0, "actions": 0 },
  "deleted": { "resources": 0, "actions": 0 }
}
```

---

### Runtime API

**Endpoint**: `GET /v1/me/permissions?app=billing`
**Auth**: `Authorization: Bearer {user_jwt}`

**Success Response** (`200 OK`):
```json
{
  "version": 4471,
  "roles": ["billing_clerk"],
  "permissions": [
    "invoices:read",
    "invoices:write",
    "invoices:export"
  ],
  "menu": [
    {
      "key": "invoices",
      "name": "Invoices",
      "children": [
        {
          "key": "invoices.credit_note",
          "name": "Credit Notes",
          "children": []
        }
      ]
    }
  ]
}
```

---

### Admin API — Key Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/admin/applications` | List all applications |
| `POST` | `/v1/admin/applications` | Create application (returns `client_id` + `client_secret`) |
| `GET` | `/v1/admin/applications/:id` | Application detail with aggregate counts |
| `PUT` | `/v1/admin/applications/:id` | Update application metadata |
| `GET` | `/v1/admin/applications/:id/resources` | List resource tree |
| `GET` | `/v1/admin/applications/:id/actions` | List action catalog |
| `POST` | `/v1/admin/applications/:id/actions` | Add custom action |
| `GET` | `/v1/admin/roles` | List roles (filter by `?appId=`) |
| `POST` | `/v1/admin/roles` | Create role |
| `GET` | `/v1/admin/roles/:id` | Role detail with current permission matrix |
| `PUT` | `/v1/admin/roles/:id` | Replace full permission set |
| `GET` | `/v1/admin/users` | List users |
| `POST` | `/v1/admin/users` | Create/mirror user |
| `GET` | `/v1/admin/users/:id/roles` | User role assignments grouped by app |
| `GET` | `/v1/admin/assignments` | List all user-role assignments |
| `POST` | `/v1/admin/assignments` | Create assignment |
| `DELETE` | `/v1/admin/assignments/:id` | Revoke assignment |
| `GET` | `/v1/admin/audit-logs` | Paginated audit log (with filters) |
| `GET` | `/v1/admin/audit-logs/:id` | Single audit log detail |
| `GET` | `/v1/admin/settings` | Get system settings |
| `PUT` | `/v1/admin/settings` | Update system settings |

---

## 11. Data Model

The RBAC Platform persists data in **10 tables** hosted on Microsoft SQL Server (AWS RDS):

| Table | Purpose |
|---|---|
| `application` | Registered application registry with client credentials |
| `action` | Action catalog per application (`read`, `write`, etc.) |
| `resource` | Screen/module tree structure with `parent_id` hierarchy |
| `permission` | Unique `resource + action` pair with canonical string |
| `role` | Application-scoped role definitions |
| `role_permission` | Join table: role ↔ permission |
| `app_user` | IdP user identity mirror (keyed on `external_id`) |
| `user_role` | Join table: user ↔ role, with assignment metadata |
| `audit_log` | Immutable audit trail (before/after JSON snapshots) |
| `system_version` | Global monotonic `permission_version` counter |

> See [understanding.md — Section 4](file:///c:/Users/RetailAdmin/OneDrive/Desktop/rbac/understanding.md) for full entity-level field specifications.

---

## 12. Constraints & Assumptions

| # | Constraint / Assumption |
|---|---|
| C-1 | Authentication is handled exclusively by the existing enterprise Identity Provider (IdP). RBAC does **not** issue login sessions or store credentials. |
| C-2 | The IdP issues JWTs containing a `sub` claim (used as `external_id`) that uniquely identifies each user across all Compass Group systems. |
| C-3 | All consuming applications must be capable of integrating the npm `@compass/rbac-sdk` package. |
| C-4 | Roles are strictly application-scoped in v1. Cross-application role inheritance is a post-v1 concern. |
| C-5 | Database migrations must run as a gated CI step, never on application cold start. TypeORM `synchronize: true` is permanently disabled. |
| C-6 | The production environment deploys to AWS (Lambda, RDS, S3, CloudFront, API Gateway). |
| C-7 | The Admin Console is a static Next.js export served from S3 + CloudFront. |

---

## 13. Out-of-Scope (v1)

| Feature | Rationale |
|---|---|
| Row-level / record-level security | Requires policy evaluation engine; deferred to v2 |
| Cross-application role inheritance | Architectural complexity; deferred to v2 |
| Delegated per-app administration | Deferred; `user_application` guard is available as fallback |
| SSO / login flows | Managed by existing enterprise IdP |
| Role templates / cloning | Nice-to-have; deferred to post-GA |
| API rate limiting | Deferred to v1.1 |
| Multi-language / i18n | Admin Console v1 is English-only |

---

## 14. Release Milestones

| Phase | Deliverables | Target |
|---|---|---|
| **Phase 1: Foundation** | Monorepo setup, contracts package, TypeORM entities, initial migration scripts, bootstrap seed | Week 1–2 |
| **Phase 2: Core API** | Manifest sync engine, runtime permissions API, all Admin CRUD endpoints, Auth guards | Week 3–5 |
| **Phase 3: Admin Console** | Full Next.js UI for all 12 screens, interactive Permission Builder Matrix | Week 6–9 |
| **Phase 4: SDK & Infrastructure** | `@compass/rbac-sdk` package, AWS CDK stacks, CI/CD pipeline, production deployment | Week 10–12 |
| **Phase 5: Integration & Validation** | Onboard Saarthi-FX® & FoodBook; security penetration test; load test; go-live | Week 13–14 |

---

## 15. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-1 | Does the enterprise IdP publish a JWKS endpoint for JWT public key discovery, or must the key be injected via AWS Secrets Manager? | Security / IdP Team | **Open** |
| OQ-2 | Is OAuth 2.0 Client Credentials flow preferred for machine API auth, or static HMAC API keys per application? | Platform Engineering | **Open** |
| OQ-3 | What is the expected maximum number of resources (screens) per application? This affects matrix rendering performance. | Consumer App Teams | **Open** |
| OQ-4 | Should the Admin Console support SSO login via the enterprise IdP, or use a separate JWT issued by the IdP? | Security Team | **Open** |
| OQ-5 | What is the required audit log retention period (days)? | Security / Compliance | **Open** |

---

## 16. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| v1.0 | August 2026 | Platform Engineering | Initial draft |