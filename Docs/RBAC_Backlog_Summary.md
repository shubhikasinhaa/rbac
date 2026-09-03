# RBAC Platform — User Story Backlog Summary

**Deliverable:** `RBAC_User_Story_Backlog.xlsx` (single sheet, one row per story)
**Prepared:** 31 August 2026
**Sources analysed:** `Docs/rbac-project-brief.pdf`, `Docs/rbac-technology-stack.pdf`, `Docs/wireframes.pdf` (all 12 screens + navigation legend), `arch.md`, `implementation_plan.md`, `prd.md`, `understanding.md`

---

## 1. Backlog Totals

| Metric | Count |
|---|---|
| **Major user stories** | **16** |
| **Basic user stories** | **56** |
| **Total stories** | **72** |
| Epics / modules | 16 |

**Priority distribution:** Critical 32 · High 27 · Medium 12 · Low 1

Story IDs are stable: `RBAC-M01…M16` (major) and `RBAC-B01…B56` (basic). Rows are ordered by build dependency — foundation → security → registry → manifest → catalogue → roles → users → runtime → SDK → audit → settings → console → infrastructure → observability → migration → release readiness. Every value in the *Dependencies* column has been validated to resolve to a real Story ID in the sheet.

---

## 2. Epics / Modules Identified

| # | Epic / Module | Major | Basic | Covers |
|---|---|---|---|---|
| 1 | Foundation & Data Layer | 1 | 4 | Monorepo, shared contracts, 10-table schema, migrations, bootstrap seed, `permission_version` counter |
| 2 | Authentication & API Security | 1 | 4 | IdP JWT guard, machine client-credentials guard, console self-authorization, error contract |
| 3 | Application Registry | 1 | 4 | App registration, client credentials, list & detail screens (Wireframes 1–2) |
| 4 | Manifest Sync Engine | 1 | 4 | Idempotent ingestion, orphan protection, sync summary, manual Sync Now |
| 5 | Screens & Actions | 1 | 2 | Resource tree browser, action catalogue, custom actions (Wireframes 3–4) |
| 6 | Role & Permission Management | 1 | 4 | Role CRUD, tri-state Permission Builder matrix, bulk ops, atomic save (Wireframes 5–6) |
| 7 | User & Assignment Management | 1 | 6 | IdP mirroring, user detail, assignments, create/revoke, status (Wireframes 7–9) |
| 8 | Runtime Authorization | 1 | 3 | `GET /v1/me/permissions`, union computation, menu tree, fail-closed behaviour |
| 9 | Client SDK | 1 | 4 | `RBACClient`, `can()`, middleware helpers, CodeArtifact publication |
| 10 | Audit & Compliance | 1 | 4 | Append-only capture, filtered log, before/after diff, immutability (Wireframes 10–11) |
| 11 | System Settings | 1 | 2 | Global default actions, system settings form (Wireframe 12) |
| 12 | Admin Console | 1 | 3 | Static-export shell, navigation, auth context, design system, dashboard |
| 13 | Infrastructure & DevOps | 1 | 5 | VPC + endpoints, RDS, two-Lambda API, S3/CloudFront, gated CI/CD |
| 14 | Observability & Operations | 1 | 2 | Structured logging, correlation ids, business metrics and alarms |
| 15 | Migration & Onboarding | 1 | 2 | Legacy role/assignment import, dual-run, integration runbook |
| 16 | Quality & Release Readiness | 1 | 3 | Critical-logic test suite, load validation, security/penetration test |

---

## 3. Coverage Check Against Source Documents

Verified line-by-line against every source. All are represented in the backlog:

- **PRD functional requirements FR-1 → FR-8** — every sub-requirement maps to at least one story.
- **PRD non-functional requirements NFR-1 → NFR-5** — performance (B55), security (M02, B39, B56), scalability/availability (B46, B47), maintainability (B01, B47, B49), observability (B50, B51).
- **PRD user stories US-1.1 → US-3.2** — all six mapped (B09, M04, B19, B20, B26, M08, B33).
- **All 12 wireframe screens** — Screens 1–12 map to B10, B11, B17, B18, B19, B20, B23, B24, B25, B37, B38, B40/B41 respectively.
- **Architecture document §1–§17** — component architecture, orphan-protection algorithm, three API surfaces, auth flows, AWS topology, indexing, CI rules, all reflected.
- **Implementation plan components 1–5** — data layer, NestJS modules, console, contracts + SDK, CDK stacks.
- **Project brief "Things to watch"** — bootstrap (B03), migration from existing apps (M15, B52); delegated admin is explicitly out of scope for v1 and was *not* turned into a story.
- **Technology stack document** — CodeArtifact (B35), TanStack Query / react-hook-form + zod (B43), serverless-express adapter and esbuild (B47), three environments with approval-gated migrations (B49).

**Explicitly excluded** (documented v1 non-goals, correctly not in the backlog): row/record-level security, cross-application role inheritance, delegated per-app administration, SSO/login flows, role templates & cloning, API rate limiting, i18n.

---

## 4. Requirements That Could Not Be Confidently Converted Into Stories

These are documented but under-specified. They are flagged inside the relevant story's *Description* rather than invented into new functionality.

| # | Item | Where it appears | Why it is not fully specified |
|---|---|---|---|
| 1 | **"Password Policy"** and **"Hybrid Access Key"** settings fields | Wireframe 12 (System Settings) | RBAC explicitly does not handle authentication or store credentials (Brief, Decision 1; PRD C-1). Neither field appears in the PRD, architecture or brief. Noted in **RBAC-B41**; behaviour needs Product Owner confirmation before build. |
| 2 | **"Dashboard"** navigation item | Wireframe sidebar on all 12 screens | Appears in every sidebar but has no wireframe, no PRD screen spec, and is absent from the wireframe's own list of seven main modules. Raised as **RBAC-B44** at *Low* priority with proposed scope drawn only from existing endpoints, explicitly pending confirmation. |
| 3 | **IdP JWT key discovery** — JWKS endpoint vs. key injected via Secrets Manager | PRD OQ-1; implementation plan Open Question 1 | Answer changes the guard implementation but not the story. Noted in **RBAC-B05**. |
| 4 | **Machine API scheme** — OAuth 2.0 client credentials vs. static HMAC API keys | PRD OQ-2; implementation plan Open Question 2 | Both are described in the sources. Noted in **RBAC-B06**; the endpoint contract is unaffected. |
| 5 | **Maximum screens per application** | PRD OQ-3 | Drives matrix rendering strategy (virtualisation?) and snapshot payload size. Noted in **RBAC-B55**; no virtualisation story invented without the number. |
| 6 | **Console sign-in mechanism** — enterprise SSO vs. separately issued IdP JWT | PRD OQ-4 | Noted in **RBAC-B42**; token handling is isolated behind the auth context so either answer is a contained change. |
| 7 | **Audit log retention period** | PRD OQ-5 | The setting exists (default 365 days in the wireframe) but the compliance-mandated value is undecided. Noted in **RBAC-B41** and **RBAC-B39**. |
| 8 | **`user_application` delegated-admin guard** | Brief & understanding.md, described as the "cheap fallback" | Explicitly stated as *not needed for v1*. Deliberately **no story created**. |
| 9 | **"Manifest History" tab** | Wireframe 2 only | Present in the Application Detail tab bar but absent from the PRD screen spec. Folded into **RBAC-B15** as a read-only view over existing manifest audit entries rather than a new data structure. |
| 10 | **"Owner" field on application** | Wireframe 2 ("Owner: Workplace Management Team") | Not in the PRD data model or `understanding.md` entity spec. Treated as a metadata attribute inside **RBAC-B09**/**RBAC-B12**, not a new entity or ownership/permission concept. |

---

## 5. Assumptions Made

1. **The repository contains documentation only.** There is no source code in `/home/hubhikainha/RBAC` — only the four Markdown documents and three PDFs. Every story is therefore greenfield; none describe modifying existing code.
2. **The wireframes PDF is image-only.** Its 12 screens were extracted from the embedded images and read visually; there is no selectable text in that file. Screen details cited in the backlog come from those images plus the PRD §9 screen specifications.
3. **Table count.** `understanding.md` §4 says "9 core tables" then lists 10 (including `system_version`); `prd.md` §11 says 10. The backlog uses **10 tables** — the count consistent with the actual entity list in both documents.
4. **Story granularity.** APIs, database tables, AWS services, NestJS modules and React components are *not* individual stories. They appear in the *Description*, *Dependencies* or *Source/Reference* columns of the story that delivers the user-visible capability. Technical work is a story only where it is independently trackable and production-blocking (schema, guards, CDK stacks, CI/CD, observability, test suite).
5. **Screen-level stories are combined.** Each admin console screen is one story covering its API and its UI, rather than split into separate backend/frontend tickets — split at sprint planning if the team works that way.
6. **Non-destructive status changes.** Where documentation says "deactivate", the backlog assumes assignments and history are retained (consistent with the platform-wide "data integrity over deletion" principle), not cascaded deletes.
7. **Client secret rotation** is not described anywhere in the source documents, so no rotation story was invented. Flagging it as a likely v1.1 gap given secrets are shown only once at creation.
8. **Consumer-application integration work** (each app adopting the SDK inside its own codebase) is out of this backlog's scope; only the RBAC-side enablers — SDK, guide and import — are included.
9. **Console role names** (`SUPER_ADMIN`, `SECURITY_ADMIN`, `READ_ONLY_ADMIN`) are taken from `arch.md` §7. The exact permission split per role is not documented and would be configured through the Permission Builder itself, not hard-coded.
10. **Effort estimates and sprint assignment are intentionally absent** — they were not requested, and the mandatory column list does not include them.

---

## 6. Notes for Backlog Refinement

- **RBAC-B20 (Permission Matrix)** is the single highest-risk story. Both the technology stack document and the architecture document call it out as the one genuinely hard piece of UI. Recommend it is estimated separately and not bundled into a sprint with other console work.
- **RBAC-B14 (Orphan Protection)** is the highest-risk *correctness* story: a defect here silently strips production access across every consuming application. It has dedicated test coverage in **RBAC-B54**.
- **RBAC-B03 (Bootstrap Seed)** blocks all console usage — permissions cannot be granted before they exist. It should land in the first sprint.
- The five PRD open questions (OQ-1 to OQ-5) should be closed before their dependent stories enter a sprint; each is annotated in the affected story.
