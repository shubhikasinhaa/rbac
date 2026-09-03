/**
 * Renders db/seed/seed-data.mjs into:
 *   - db/rbac_mock.sql                              MS SQL Server DDL + seed
 *   - apps/console/lib/mock/dataset.generated.ts    typed fixtures for the console
 *
 * Run: npm run db:generate
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  uuid, PERMISSION_VERSION, STANDARD_ACTIONS, APPLICATIONS, RESOURCES,
  CUSTOM_ACTIONS, DEPRECATED_ACTIONS, ROLES, USERS, ASSIGNMENTS, SETTINGS, AUDIT_LOG,
} from './seed-data.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/* ------------------------------------------------------------------ build ---- */

const applications = APPLICATIONS.map((a) => ({
  id: uuid(`app:${a.key}`),
  app_key: a.key,
  name: a.name,
  owner: a.owner,
  description: a.description,
  status: a.status,
  manifest_version: a.manifestVersion,
  manifest_endpoint: a.manifestEndpoint,
  last_sync_at: a.lastSyncAt,
  client_id: `cid_${a.key.replace(/_/g, '')}_${uuid(`cid:${a.key}`).slice(0, 8)}`,
  created_at: '2026-05-01T08:00:00',
  updated_at: a.lastSyncAt,
}));
const appByKey = Object.fromEntries(applications.map((a) => [a.app_key, a]));

const actions = [];
for (const app of applications) {
  const deprecated = DEPRECATED_ACTIONS[app.app_key] ?? [];
  const list = [...STANDARD_ACTIONS, ...(CUSTOM_ACTIONS[app.app_key] ?? [])];
  for (const a of list) {
    actions.push({
      id: uuid(`action:${app.app_key}:${a.key}`),
      application_id: app.id,
      application_key: app.app_key,
      action_key: a.key,
      name: a.name,
      description: a.description,
      status: deprecated.includes(a.key) ? 'Deprecated' : 'Active',
      is_custom: !STANDARD_ACTIONS.some((s) => s.key === a.key),
    });
  }
}
const actionsByApp = (k) => actions.filter((a) => a.application_key === k);

const resources = [];
for (const app of applications) {
  for (const r of RESOURCES[app.app_key]) {
    const level = r.key.split('.').length;
    resources.push({
      id: uuid(`res:${app.app_key}:${r.key}`),
      application_id: app.id,
      application_key: app.app_key,
      parent_id: r.parent ? uuid(`res:${app.app_key}:${r.parent}`) : null,
      parent_key: r.parent ?? null,
      resource_key: r.key,
      name: r.name,
      level,
      status: r.status ?? 'Active',
      declared_actions: r.actions ?? null,
    });
  }
}
const resourcesByApp = (k) => resources.filter((r) => r.application_key === k);

// A permission exists for every (active-or-orphaned resource x action) pair the
// application declared. Orphaned resources keep their permissions so existing
// grants are never silently dropped.
const permissions = [];
for (const app of applications) {
  for (const r of resourcesByApp(app.app_key)) {
    for (const a of actionsByApp(app.app_key)) {
      // A pair the manifest never declared simply has no permission row, which
      // is what renders the cell disabled in the Permission Builder.
      if (r.declared_actions && !r.declared_actions.includes(a.action_key)) continue;
      permissions.push({
        id: uuid(`perm:${app.app_key}:${r.resource_key}:${a.action_key}`),
        application_key: app.app_key,
        resource_id: r.id,
        resource_key: r.resource_key,
        action_id: a.id,
        action_key: a.action_key,
        canonical_string: `${r.resource_key}:${a.action_key}`,
        status: r.status === 'Orphaned' || a.status === 'Deprecated' ? 'Orphaned' : 'Active',
      });
    }
  }
}
const permIndex = new Map(permissions.map((p) => [`${p.application_key}|${p.canonical_string}`, p]));

/** Expand a role's declarative grant into concrete permission ids. */
function expandGrant(appKey, grant) {
  const res = resourcesByApp(appKey);
  const acts = actionsByApp(appKey).map((a) => a.action_key);
  const picked = new Set();
  const add = (rk, ak) => {
    const p = permIndex.get(`${appKey}|${rk}:${ak}`);
    if (p) picked.add(p.id);
  };

  // 'all' means every *live* permission: an orphaned screen or deprecated action
  // keeps its existing grants but is never handed out to a role afresh.
  const liveActions = actionsByApp(appKey).filter((a) => a.status === 'Active').map((a) => a.action_key);
  if (grant.all) {
    for (const r of res.filter((x) => x.status === 'Active')) for (const a of liveActions) add(r.resource_key, a);
    return [...picked];
  }
  const useActions = grant.actions ?? liveActions;
  const inScope = grant.subtrees
    ? res.filter((r) => grant.subtrees.some((s) => r.resource_key === s || r.resource_key.startsWith(`${s}.`)))
    : res.filter((r) => r.status === 'Active');
  for (const r of inScope) for (const a of useActions) add(r.resource_key, a);
  // Additional narrower grants layered on top of the base subtree grant.
  for (const p of grant.plus ?? []) {
    const scope = res.filter((r) => p.subtrees.some((sub) => r.resource_key === sub || r.resource_key.startsWith(`${sub}.`)));
    for (const r of scope) for (const a of p.actions) add(r.resource_key, a);
  }
  for (const [rk, ak] of grant.extra ?? []) add(rk, ak);
  return [...picked];
}

const roles = [];
const rolePermissions = [];
for (const r of ROLES) {
  const app = appByKey[r.app];
  const id = uuid(`role:${r.app}:${r.name}`);
  roles.push({
    id,
    application_id: app.id,
    application_key: r.app,
    name: r.name,
    description: r.description,
    status: r.status,
    created_at: '2026-05-01T09:00:00',
    updated_at: '2026-05-20T10:30:00',
  });
  for (const pid of expandGrant(r.app, r.grant)) rolePermissions.push({ role_id: id, permission_id: pid });
}
const roleByAppName = new Map(roles.map((r) => [`${r.application_key}|${r.name}`, r]));

const users = USERS.map((u) => {
  const prefix = u.email.split('@')[0];
  return {
    id: uuid(`user:${prefix}`),
    external_id: uuid(`idp:${prefix}`),
    email_prefix: prefix,
    name: u.name,
    email: u.email,
    status: u.status,
    last_login_at: u.lastLogin,
    created_at: '2026-05-01T08:00:00',
  };
});
const userByPrefix = Object.fromEntries(users.map((u) => [u.email_prefix, u]));

const userRoles = ASSIGNMENTS.map(([userPrefix, appKey, roleName, assignedAt, byPrefix]) => {
  const user = userByPrefix[userPrefix];
  const role = roleByAppName.get(`${appKey}|${roleName}`);
  if (!user) throw new Error(`assignment references unknown user "${userPrefix}"`);
  if (!role) throw new Error(`assignment references unknown role "${appKey}/${roleName}"`);
  return {
    id: uuid(`ur:${userPrefix}:${appKey}:${roleName}`),
    user_id: user.id,
    role_id: role.id,
    application_key: appKey,
    assigned_by: userByPrefix[byPrefix].id,
    assigned_at: assignedAt,
  };
});

const auditLog = AUDIT_LOG.map((e, i) => ({
  id: uuid(`audit:${i}:${e.entityId}`),
  actor_id: userByPrefix[e.actor].id,
  application_id: e.app ? appByKey[e.app].id : null,
  application_key: e.app,
  entity_type: e.entityType,
  entity_id: e.entityId,
  entity_name: e.entity,
  event_type: e.eventType,
  details: e.details,
  // Stored compact, as a real API would. The console pretty-prints on render.
  before_state: e.before ? JSON.stringify(e.before) : null,
  after_state: e.after ? JSON.stringify(e.after) : null,
  timestamp: e.timestamp,
})).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

/* -------------------------------------------------------------------- SQL ---- */

const q = (v) => (v === null || v === undefined ? 'NULL' : `N'${String(v).replace(/'/g, "''")}'`);
const dt = (v) => (v ? `'${v}'` : 'NULL');
const g = (v) => (v ? `'${v}'` : 'NULL');
const bit = (v) => (v ? '1' : '0');

const sql = [];
sql.push(`/* =============================================================================
   Compass Group — Centralized RBAC Platform
   Mock database: schema + demo dataset

   Engine    : Microsoft SQL Server 2019 (AWS RDS) — per rbac-technology-stack.pdf
   Generated : by  npm run db:generate  from db/seed/seed-data.mjs — DO NOT EDIT BY HAND
   Purpose   : drives the Admin Console demo. Drop-in replaceable by the real database:
               the schema below is the production schema, only the INSERTs are mock.

   Usage:  sqlcmd -S <host> -U <user> -P <pwd> -i db/rbac_mock.sql
   ============================================================================= */

IF DB_ID('rbac') IS NULL
    CREATE DATABASE rbac;
GO

USE rbac;
GO

/* ---------------------------------------------------------------- teardown -- */
IF OBJECT_ID('dbo.audit_log', 'U')       IS NOT NULL DROP TABLE dbo.audit_log;
IF OBJECT_ID('dbo.user_role', 'U')       IS NOT NULL DROP TABLE dbo.user_role;
IF OBJECT_ID('dbo.role_permission', 'U') IS NOT NULL DROP TABLE dbo.role_permission;
IF OBJECT_ID('dbo.permission', 'U')      IS NOT NULL DROP TABLE dbo.permission;
IF OBJECT_ID('dbo.role', 'U')            IS NOT NULL DROP TABLE dbo.[role];
IF OBJECT_ID('dbo.resource', 'U')        IS NOT NULL DROP TABLE dbo.[resource];
IF OBJECT_ID('dbo.action', 'U')          IS NOT NULL DROP TABLE dbo.[action];
IF OBJECT_ID('dbo.app_user', 'U')        IS NOT NULL DROP TABLE dbo.app_user;
IF OBJECT_ID('dbo.application', 'U')     IS NOT NULL DROP TABLE dbo.application;
IF OBJECT_ID('dbo.system_setting', 'U')  IS NOT NULL DROP TABLE dbo.system_setting;
IF OBJECT_ID('dbo.system_version', 'U')  IS NOT NULL DROP TABLE dbo.system_version;
GO

/* ===========================================================================
   SCHEMA — 10 core tables (+ system_setting for the Settings screen)
   =========================================================================== */

CREATE TABLE dbo.application (
    id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_application PRIMARY KEY,
    app_key             VARCHAR(100)     NOT NULL CONSTRAINT UQ_application_app_key UNIQUE,
    name                NVARCHAR(200)    NOT NULL,
    owner               NVARCHAR(200)    NULL,
    description         NVARCHAR(1000)   NULL,
    status              VARCHAR(20)      NOT NULL CONSTRAINT CK_application_status CHECK (status IN ('Active','Inactive')),
    manifest_version    VARCHAR(50)      NULL,
    manifest_endpoint   VARCHAR(500)     NULL,
    last_sync_at        DATETIME2        NULL,
    client_id           VARCHAR(100)     NOT NULL CONSTRAINT UQ_application_client_id UNIQUE,
    client_secret_hash  VARCHAR(255)     NOT NULL,   -- bcrypt, cost >= 12. Never returned by the API.
    created_at          DATETIME2        NOT NULL CONSTRAINT DF_application_created DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2        NOT NULL CONSTRAINT DF_application_updated DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.[action] (
    id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_action PRIMARY KEY,
    application_id  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_action_application REFERENCES dbo.application(id),
    action_key      VARCHAR(100)     NOT NULL,
    name            NVARCHAR(200)    NOT NULL,
    description     NVARCHAR(500)    NULL,
    status          VARCHAR(20)      NOT NULL CONSTRAINT CK_action_status CHECK (status IN ('Active','Deprecated')),
    is_custom       BIT              NOT NULL CONSTRAINT DF_action_is_custom DEFAULT 0,
    CONSTRAINT UQ_action_app_key UNIQUE (application_id, action_key)
);

CREATE TABLE dbo.[resource] (
    id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_resource PRIMARY KEY,
    application_id  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_resource_application REFERENCES dbo.application(id),
    parent_id       UNIQUEIDENTIFIER NULL     CONSTRAINT FK_resource_parent REFERENCES dbo.[resource](id),
    resource_key    VARCHAR(200)     NOT NULL,
    name            NVARCHAR(200)    NOT NULL,
    [level]         INT              NOT NULL,
    status          VARCHAR(20)      NOT NULL CONSTRAINT CK_resource_status CHECK (status IN ('Active','Deprecated','Orphaned')),
    CONSTRAINT UQ_resource_app_key UNIQUE (application_id, resource_key)
);

CREATE TABLE dbo.permission (
    id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_permission PRIMARY KEY,
    resource_id       UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_permission_resource REFERENCES dbo.[resource](id),
    action_id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_permission_action REFERENCES dbo.[action](id),
    canonical_string  VARCHAR(300)     NOT NULL,   -- e.g. 'invoices.credit_note:write'
    status            VARCHAR(20)      NOT NULL CONSTRAINT CK_permission_status CHECK (status IN ('Active','Orphaned')),
    CONSTRAINT UQ_permission_pair UNIQUE (resource_id, action_id)
);

CREATE TABLE dbo.[role] (
    id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_role PRIMARY KEY,
    application_id  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_role_application REFERENCES dbo.application(id),
    name            NVARCHAR(200)    NOT NULL,
    description     NVARCHAR(1000)   NULL,
    status          VARCHAR(20)      NOT NULL CONSTRAINT CK_role_status CHECK (status IN ('Active','Inactive')),
    created_at      DATETIME2        NOT NULL CONSTRAINT DF_role_created DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2        NOT NULL CONSTRAINT DF_role_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_role_app_name UNIQUE (application_id, name)   -- roles never cross application boundaries
);

CREATE TABLE dbo.role_permission (
    role_id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_rp_role REFERENCES dbo.[role](id),
    permission_id  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_rp_permission REFERENCES dbo.permission(id),
    CONSTRAINT PK_role_permission PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE dbo.app_user (
    id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_app_user PRIMARY KEY,
    external_id    VARCHAR(200)     NOT NULL CONSTRAINT UQ_app_user_external UNIQUE,  -- IdP 'sub' claim
    name           NVARCHAR(200)    NOT NULL,
    email          VARCHAR(320)     NOT NULL,
    status         VARCHAR(20)      NOT NULL CONSTRAINT CK_app_user_status CHECK (status IN ('Active','Inactive')),
    last_login_at  DATETIME2        NULL,
    created_at     DATETIME2        NOT NULL CONSTRAINT DF_app_user_created DEFAULT SYSUTCDATETIME()
    -- No credential column: authentication belongs to the enterprise IdP.
);

CREATE TABLE dbo.user_role (
    id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_user_role PRIMARY KEY,
    user_id      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ur_user REFERENCES dbo.app_user(id),
    role_id      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ur_role REFERENCES dbo.[role](id),
    assigned_by  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ur_assigned_by REFERENCES dbo.app_user(id),
    assigned_at  DATETIME2        NOT NULL CONSTRAINT DF_ur_assigned DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_user_role UNIQUE (user_id, role_id)           -- no duplicate assignments
);

CREATE TABLE dbo.audit_log (
    id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_audit_log PRIMARY KEY,
    actor_id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_audit_actor REFERENCES dbo.app_user(id),
    application_id  UNIQUEIDENTIFIER NULL     CONSTRAINT FK_audit_application REFERENCES dbo.application(id),
    entity_type     VARCHAR(50)      NOT NULL,   -- Role | Assignment | Permission | Manifest | Application | User | Settings | Action
    entity_id       VARCHAR(300)     NOT NULL,
    entity_name     NVARCHAR(400)    NULL,
    event_type      VARCHAR(50)      NOT NULL,   -- Created | Updated | Deleted | Synced | ...
    details         NVARCHAR(500)    NULL,
    before_state    NVARCHAR(MAX)    NULL,       -- JSON snapshot
    after_state     NVARCHAR(MAX)    NULL,       -- JSON snapshot
    [timestamp]     DATETIME2        NOT NULL CONSTRAINT DF_audit_ts DEFAULT SYSUTCDATETIME()
    -- Append-only. The application DB principal is granted INSERT/SELECT only.
);

CREATE TABLE dbo.system_version (
    id                  INT       NOT NULL CONSTRAINT PK_system_version PRIMARY KEY,
    permission_version  INT       NOT NULL,      -- monotonic; bumped with every role/assignment change
    updated_at          DATETIME2 NOT NULL CONSTRAINT DF_sv_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_system_version_single_row CHECK (id = 1)
);

CREATE TABLE dbo.system_setting (
    setting_key    VARCHAR(100)  NOT NULL CONSTRAINT PK_system_setting PRIMARY KEY,
    label          NVARCHAR(200) NOT NULL,
    setting_value  NVARCHAR(500) NOT NULL,
    value_type     VARCHAR(20)   NOT NULL,
    options        NVARCHAR(500) NULL,           -- JSON array of allowed values
    updated_at     DATETIME2     NOT NULL CONSTRAINT DF_ss_updated DEFAULT SYSUTCDATETIME()
);
GO

/* ===========================================================================
   INDEXES — runtime permission query performance (arch.md S15)
   =========================================================================== */
CREATE INDEX idx_app_user_external_id  ON dbo.app_user(external_id);
CREATE INDEX idx_user_role_user_id     ON dbo.user_role(user_id);
CREATE INDEX idx_user_role_role_id     ON dbo.user_role(role_id);
CREATE INDEX idx_role_application_id   ON dbo.[role](application_id);
CREATE INDEX idx_permission_canonical  ON dbo.permission(canonical_string);
CREATE INDEX idx_resource_app_key      ON dbo.[resource](application_id, resource_key);
CREATE INDEX idx_resource_parent       ON dbo.[resource](parent_id);
CREATE INDEX idx_audit_log_timestamp   ON dbo.audit_log([timestamp] DESC);
CREATE INDEX idx_audit_log_actor       ON dbo.audit_log(actor_id);
CREATE INDEX idx_audit_log_application ON dbo.audit_log(application_id);
GO

/* ===========================================================================
   SEED DATA — mock only. Replace this section to point at real data.
   =========================================================================== */
`);

sql.push(`\n/* ---- application (${applications.length}) ---- */`);
for (const a of applications) {
  sql.push(`INSERT INTO dbo.application (id, app_key, name, owner, description, status, manifest_version, manifest_endpoint, last_sync_at, client_id, client_secret_hash, created_at, updated_at) VALUES (${g(a.id)}, '${a.app_key}', ${q(a.name)}, ${q(a.owner)}, ${q(a.description)}, '${a.status}', ${q(a.manifest_version)}, ${q(a.manifest_endpoint)}, ${dt(a.last_sync_at)}, '${a.client_id}', '$2b$12$MOCKONLYHASHDONOTUSEINPRODUCTIONxxxxxxxxxxxxxxxxxxxxxxxxx', ${dt(a.created_at)}, ${dt(a.updated_at)});`);
}

sql.push(`\n/* ---- action (${actions.length}) ---- */`);
for (const a of actions) {
  sql.push(`INSERT INTO dbo.[action] (id, application_id, action_key, name, description, status, is_custom) VALUES (${g(a.id)}, ${g(a.application_id)}, '${a.action_key}', ${q(a.name)}, ${q(a.description)}, '${a.status}', ${bit(a.is_custom)});`);
}

sql.push(`\n/* ---- resource (${resources.length}) — parents inserted before children ---- */`);
for (const r of [...resources].sort((a, b) => a.level - b.level)) {
  sql.push(`INSERT INTO dbo.[resource] (id, application_id, parent_id, resource_key, name, [level], status) VALUES (${g(r.id)}, ${g(r.application_id)}, ${g(r.parent_id)}, '${r.resource_key}', ${q(r.name)}, ${r.level}, '${r.status}');`);
}

sql.push(`\n/* ---- permission (${permissions.length}) ---- */`);
for (const p of permissions) {
  sql.push(`INSERT INTO dbo.permission (id, resource_id, action_id, canonical_string, status) VALUES (${g(p.id)}, ${g(p.resource_id)}, ${g(p.action_id)}, '${p.canonical_string}', '${p.status}');`);
}

sql.push(`\n/* ---- role (${roles.length}) ---- */`);
for (const r of roles) {
  sql.push(`INSERT INTO dbo.[role] (id, application_id, name, description, status, created_at, updated_at) VALUES (${g(r.id)}, ${g(r.application_id)}, ${q(r.name)}, ${q(r.description)}, '${r.status}', ${dt(r.created_at)}, ${dt(r.updated_at)});`);
}

sql.push(`\n/* ---- role_permission (${rolePermissions.length}) ---- */`);
for (const rp of rolePermissions) {
  sql.push(`INSERT INTO dbo.role_permission (role_id, permission_id) VALUES (${g(rp.role_id)}, ${g(rp.permission_id)});`);
}

sql.push(`\n/* ---- app_user (${users.length}) ---- */`);
for (const u of users) {
  sql.push(`INSERT INTO dbo.app_user (id, external_id, name, email, status, last_login_at, created_at) VALUES (${g(u.id)}, '${u.external_id}', ${q(u.name)}, '${u.email}', '${u.status}', ${dt(u.last_login_at)}, ${dt(u.created_at)});`);
}

sql.push(`\n/* ---- user_role (${userRoles.length}) ---- */`);
for (const ur of userRoles) {
  sql.push(`INSERT INTO dbo.user_role (id, user_id, role_id, assigned_by, assigned_at) VALUES (${g(ur.id)}, ${g(ur.user_id)}, ${g(ur.role_id)}, ${g(ur.assigned_by)}, ${dt(ur.assigned_at)});`);
}

sql.push(`\n/* ---- audit_log (${auditLog.length}) ---- */`);
for (const e of auditLog) {
  sql.push(`INSERT INTO dbo.audit_log (id, actor_id, application_id, entity_type, entity_id, entity_name, event_type, details, before_state, after_state, [timestamp]) VALUES (${g(e.id)}, ${g(e.actor_id)}, ${g(e.application_id)}, '${e.entity_type}', ${q(e.entity_id)}, ${q(e.entity_name)}, '${e.event_type}', ${q(e.details)}, ${q(e.before_state)}, ${q(e.after_state)}, ${dt(e.timestamp)});`);
}

sql.push(`\n/* ---- system_version ---- */`);
sql.push(`INSERT INTO dbo.system_version (id, permission_version, updated_at) VALUES (1, ${PERMISSION_VERSION}, '2026-05-20T10:30:00');`);

sql.push(`\n/* ---- system_setting (${SETTINGS.length}) ---- */`);
for (const s of SETTINGS) {
  sql.push(`INSERT INTO dbo.system_setting (setting_key, label, setting_value, value_type, options) VALUES ('${s.key}', ${q(s.label)}, ${q(s.value)}, '${s.type}', ${q(JSON.stringify(s.options))});`);
}
sql.push('GO\n');

sql.push(`/* ===========================================================================
   VERIFICATION — row counts after seeding
   =========================================================================== */
SELECT 'application'     AS [table], COUNT(*) AS rows FROM dbo.application
UNION ALL SELECT 'action',           COUNT(*) FROM dbo.[action]
UNION ALL SELECT 'resource',         COUNT(*) FROM dbo.[resource]
UNION ALL SELECT 'permission',       COUNT(*) FROM dbo.permission
UNION ALL SELECT 'role',             COUNT(*) FROM dbo.[role]
UNION ALL SELECT 'role_permission',  COUNT(*) FROM dbo.role_permission
UNION ALL SELECT 'app_user',         COUNT(*) FROM dbo.app_user
UNION ALL SELECT 'user_role',        COUNT(*) FROM dbo.user_role
UNION ALL SELECT 'audit_log',        COUNT(*) FROM dbo.audit_log
UNION ALL SELECT 'system_version',   COUNT(*) FROM dbo.system_version
UNION ALL SELECT 'system_setting',   COUNT(*) FROM dbo.system_setting;
GO`);

writeFileSync(resolve(ROOT, 'db/rbac_mock.sql'), sql.join('\n') + '\n', 'utf8');

/* --------------------------------------------------------- TS fixtures ---- */

const ts = `// AUTO-GENERATED by \`npm run db:generate\` from db/seed/seed-data.mjs — DO NOT EDIT.
// Mirrors db/rbac_mock.sql exactly. Swap lib/api-client.ts for real HTTP calls
// and this file can be deleted without touching a single component.
import type {
  Application, Action, Resource, Permission, Role, RolePermission,
  AppUser, UserRole, AuditLogEntry, SystemSetting,
} from '@compass/rbac-contracts';

export const PERMISSION_VERSION = ${PERMISSION_VERSION};

export const applications: Application[] = ${JSON.stringify(applications.map(({ client_id, ...a }) => ({ ...a, client_id })), null, 2)};

export const actions: Action[] = ${JSON.stringify(actions, null, 2)};

export const resources: Resource[] = ${JSON.stringify(resources.map(({ declared_actions, ...r }) => r), null, 2)};

export const permissions: Permission[] = ${JSON.stringify(permissions, null, 2)};

export const roles: Role[] = ${JSON.stringify(roles, null, 2)};

export const rolePermissions: RolePermission[] = ${JSON.stringify(rolePermissions, null, 2)};

export const users: AppUser[] = ${JSON.stringify(users, null, 2)};

export const userRoles: UserRole[] = ${JSON.stringify(userRoles, null, 2)};

export const auditLog: AuditLogEntry[] = ${JSON.stringify(auditLog, null, 2)};

export const settings: SystemSetting[] = ${JSON.stringify(SETTINGS.map((s) => ({ setting_key: s.key, label: s.label, setting_value: s.value, value_type: s.type, options: s.options })), null, 2)};
`;

mkdirSync(resolve(ROOT, 'apps/console/lib/mock'), { recursive: true });
writeFileSync(resolve(ROOT, 'apps/console/lib/mock/dataset.generated.ts'), ts, 'utf8');

/* ------------------------------------------------------------ integrity ---- */
const problems = [];
const permIds = new Set(permissions.map((p) => p.id));
for (const rp of rolePermissions) if (!permIds.has(rp.permission_id)) problems.push(`dangling role_permission -> ${rp.permission_id}`);
const resIds = new Set(resources.map((r) => r.id));
for (const r of resources) if (r.parent_id && !resIds.has(r.parent_id)) problems.push(`resource ${r.resource_key} has unknown parent`);
const seenUR = new Set();
for (const ur of userRoles) {
  const k = `${ur.user_id}|${ur.role_id}`;
  if (seenUR.has(k)) problems.push(`duplicate assignment ${k}`);
  seenUR.add(k);
}
if (problems.length) { console.error('INTEGRITY FAILURES:'); problems.forEach((p) => console.error('  -', p)); process.exit(1); }

const saarthiActive = resources.filter((r) => r.application_key === 'saarthi_fx' && r.status === 'Active').length;
const adminRole = roles.find((r) => r.application_key === 'saarthi_fx' && r.name === 'Admin');
const adminPerms = rolePermissions.filter((rp) => rp.role_id === adminRole.id).length;

console.log('  db/rbac_mock.sql                            ', sql.join('\n').split('\n').length, 'lines');
console.log('  apps/console/lib/mock/dataset.generated.ts  ', ts.split('\n').length, 'lines');
console.log('');
console.log('  applications', applications.length, '| actions', actions.length, '| resources', resources.length, '| permissions', permissions.length);
console.log('  roles', roles.length, '| role_permission', rolePermissions.length, '| users', users.length, '| user_role', userRoles.length, '| audit', auditLog.length);
console.log('');
console.log('  Saarthi-FX active screens:', saarthiActive, '(wireframe: 32)');
console.log('  Saarthi-FX Admin permissions:', adminPerms, '(wireframe: 224)');
console.log('  integrity: OK');
