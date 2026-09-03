/**
 * Console data access layer.
 *
 * Every function below mirrors an endpoint from the Admin API contract
 * (prd.md S10). Today each one resolves against the mock dataset generated from
 * db/rbac_mock.sql. To go live, replace the bodies with `fetch(...)` calls —
 * signatures and return types already match, so no component changes.
 *
 *   listApplications()        GET  /v1/admin/applications
 *   getApplication(id)        GET  /v1/admin/applications/:id
 *   listResources(appId)      GET  /v1/admin/applications/:id/resources
 *   listActions(appId)        GET  /v1/admin/applications/:id/actions
 *   listRoles(appId?)         GET  /v1/admin/roles?appId=
 *   getRole(id)               GET  /v1/admin/roles/:id
 *   listUsers()               GET  /v1/admin/users
 *   getUserRoles(id)          GET  /v1/admin/users/:id/roles
 *   listAssignments()         GET  /v1/admin/assignments
 *   listAuditLogs(filters)    GET  /v1/admin/audit-logs
 *   getAuditLog(id)           GET  /v1/admin/audit-logs/:id
 *   getSettings()             GET  /v1/admin/settings
 *   getMyPermissions(appKey)  GET  /v1/me/permissions?app=
 */
import {
  applications, actions, resources, permissions, roles, rolePermissions,
  users, userRoles, auditLog, settings, PERMISSION_VERSION,
} from './mock/dataset.generated';
import type {
  Application, ApplicationSummary, Action, Resource, ResourceNode, Permission,
  Role, RoleSummary, AppUser, UserSummary, AssignmentSummary,
  AuditLogEntry, AuditLogSummary, SystemSetting, MenuNode, PermissionsResponse,
} from '@compass/rbac-contracts';

export const permissionVersion = PERMISSION_VERSION;

/* -------------------------------------------------------------- utilities -- */

const appById = new Map(applications.map((a) => [a.id, a]));
const appByKey = new Map(applications.map((a) => [a.app_key, a]));
const userById = new Map(users.map((u) => [u.id, u]));
const roleById = new Map(roles.map((r) => [r.id, r]));
const permById = new Map(permissions.map((p) => [p.id, p]));

const permsForRole = new Map<string, Set<string>>();
for (const rp of rolePermissions) {
  let set = permsForRole.get(rp.role_id);
  if (!set) permsForRole.set(rp.role_id, (set = new Set()));
  set.add(rp.permission_id);
}

const usersForRole = new Map<string, number>();
for (const ur of userRoles) usersForRole.set(ur.role_id, (usersForRole.get(ur.role_id) ?? 0) + 1);

export function getApplicationByKey(key: string): Application | undefined {
  return appByKey.get(key);
}

/* ----------------------------------------------------------- applications -- */

export function listApplications(): ApplicationSummary[] {
  return applications.map(summariseApplication);
}

export function getApplication(id: string): ApplicationSummary | undefined {
  const app = appById.get(id);
  return app ? summariseApplication(app) : undefined;
}

function summariseApplication(app: Application): ApplicationSummary {
  const appResources = resources.filter((r) => r.application_id === app.id);
  const appRoles = roles.filter((r) => r.application_id === app.id);
  const roleIds = new Set(appRoles.map((r) => r.id));
  const distinctUsers = new Set(userRoles.filter((ur) => roleIds.has(ur.role_id)).map((ur) => ur.user_id));
  return {
    ...app,
    total_screens: appResources.filter((r) => r.status === 'Active').length,
    total_actions: actions.filter((a) => a.application_id === app.id && a.status === 'Active').length,
    total_roles: appRoles.filter((r) => r.status === 'Active').length,
    total_users: distinctUsers.size,
    orphaned_screens: appResources.filter((r) => r.status === 'Orphaned').length,
  };
}

/* --------------------------------------------------- resources & actions --- */

export function listResources(applicationId: string): Resource[] {
  return resources.filter((r) => r.application_id === applicationId);
}

/** Nested tree, parents before children, original declaration order preserved. */
export function getResourceTree(applicationId: string): ResourceNode[] {
  const flat = listResources(applicationId);
  const nodes = new Map<string, ResourceNode>(flat.map((r) => [r.id, { ...r, children: [] }]));
  const roots: ResourceNode[] = [];
  for (const r of flat) {
    const node = nodes.get(r.id)!;
    if (r.parent_id && nodes.has(r.parent_id)) nodes.get(r.parent_id)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Depth-first flatten, so the console can render a tree inside a plain table. */
export function flattenTree(nodes: ResourceNode[], depth = 0): Array<ResourceNode & { depth: number }> {
  const out: Array<ResourceNode & { depth: number }> = [];
  for (const n of nodes) {
    out.push({ ...n, depth });
    if (n.children.length) out.push(...flattenTree(n.children, depth + 1));
  }
  return out;
}

export function listActions(applicationId: string): Action[] {
  return actions.filter((a) => a.application_id === applicationId);
}

export function listPermissions(applicationKey: string): Permission[] {
  return permissions.filter((p) => p.application_key === applicationKey);
}

/* ------------------------------------------------------------------ roles -- */

export function listRoles(applicationId?: string): RoleSummary[] {
  return roles
    .filter((r) => !applicationId || r.application_id === applicationId)
    .map(summariseRole);
}

export function getRole(id: string): RoleSummary | undefined {
  const role = roleById.get(id);
  return role ? summariseRole(role) : undefined;
}

function summariseRole(role: Role): RoleSummary {
  return {
    ...role,
    user_count: usersForRole.get(role.id) ?? 0,
    permission_count: permsForRole.get(role.id)?.size ?? 0,
  };
}

/** Permission ids currently granted to a role — seeds the Permission Builder. */
export function getRolePermissionIds(roleId: string): string[] {
  return [...(permsForRole.get(roleId) ?? [])];
}

/* ------------------------------------------------------------------ users -- */

export function listUsers(): UserSummary[] {
  return users.map(summariseUser);
}

export function getUser(id: string): UserSummary | undefined {
  const user = userById.get(id);
  return user ? summariseUser(user) : undefined;
}

function summariseUser(user: AppUser): UserSummary {
  const mine = userRoles.filter((ur) => ur.user_id === user.id);
  return {
    ...user,
    application_count: new Set(mine.map((ur) => ur.application_key)).size,
    role_count: mine.length,
  };
}

/** A user's assignments grouped by application — Screen 8. */
export function getUserRoles(userId: string): Array<{
  application_key: string;
  application_name: string;
  application_status: string;
  roles: RoleSummary[];
}> {
  const mine = userRoles.filter((ur) => ur.user_id === userId);
  const grouped = new Map<string, RoleSummary[]>();
  for (const ur of mine) {
    const role = roleById.get(ur.role_id);
    if (!role) continue;
    const list = grouped.get(ur.application_key) ?? [];
    list.push(summariseRole(role));
    grouped.set(ur.application_key, list);
  }
  return [...grouped.entries()]
    .map(([key, list]) => {
      const app = appByKey.get(key)!;
      return {
        application_key: key,
        application_name: app.name,
        application_status: app.status,
        roles: list,
      };
    })
    .sort((a, b) => a.application_name.localeCompare(b.application_name));
}

/* ------------------------------------------------------------ assignments -- */

export function listAssignments(): AssignmentSummary[] {
  return userRoles
    .map((ur) => {
      const user = userById.get(ur.user_id)!;
      const role = roleById.get(ur.role_id)!;
      const app = appByKey.get(ur.application_key)!;
      return {
        id: ur.id,
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        application_key: app.app_key,
        application_name: app.name,
        role_id: role.id,
        role_name: role.name,
        assigned_at: ur.assigned_at,
        assigned_by_name: userById.get(ur.assigned_by)?.name ?? '—',
      };
    })
    .sort((a, b) => (a.assigned_at < b.assigned_at ? 1 : -1));
}

/* -------------------------------------------------------------- audit log -- */

export function listAuditLogs(): AuditLogSummary[] {
  return auditLog.map(summariseAudit);
}

export function getAuditLog(id: string): AuditLogSummary | undefined {
  const entry = auditLog.find((e) => e.id === id);
  return entry ? summariseAudit(entry) : undefined;
}

function summariseAudit(entry: AuditLogEntry): AuditLogSummary {
  return {
    ...entry,
    actor_name: userById.get(entry.actor_id)?.name ?? '—',
    application_name: entry.application_key ? appByKey.get(entry.application_key)?.name ?? null : null,
  };
}

/** Audit events where a user is either the actor or the subject — Screen 8 Activity tab. */
export function getUserActivity(userId: string): AuditLogSummary[] {
  const user = userById.get(userId);
  if (!user) return [];
  return listAuditLogs().filter(
    (e) => e.actor_id === userId || (e.entity_name?.includes(user.name) ?? false),
  );
}

export const auditEventTypes = [...new Set(auditLog.map((e) => e.event_type))].sort();
export const auditEntityTypes = [...new Set(auditLog.map((e) => e.entity_type))].sort();

/* --------------------------------------------------------------- settings -- */

export function getSettings(): SystemSetting[] {
  return settings;
}

/* --------------------------------------------------- runtime snapshot API -- */

/**
 * Mirrors `GET /v1/me/permissions?app={app_key}`.
 * Effective permissions are the union of the user's Active roles in that one
 * application; Inactive users and applications resolve to an empty snapshot.
 */
export function getMyPermissions(userId: string, appKey: string): PermissionsResponse {
  const app = appByKey.get(appKey);
  const user = userById.get(userId);
  const empty = { version: PERMISSION_VERSION, roles: [], permissions: [], menu: [] };
  if (!app || app.status !== 'Active' || !user || user.status !== 'Active') return empty;

  const mine = userRoles
    .filter((ur) => ur.user_id === userId && ur.application_key === appKey)
    .map((ur) => roleById.get(ur.role_id))
    .filter((r): r is Role => !!r && r.status === 'Active');

  const granted = new Set<string>();
  for (const role of mine) {
    for (const pid of permsForRole.get(role.id) ?? []) {
      const p = permById.get(pid);
      if (p && p.status === 'Active') granted.add(p.canonical_string);
    }
  }

  const reachable = new Set([...granted].map((c) => c.slice(0, c.lastIndexOf(':'))));
  // A permitted child keeps its parent in the menu so it stays navigable.
  for (const key of [...reachable]) {
    const parts = key.split('.');
    for (let i = 1; i < parts.length; i++) reachable.add(parts.slice(0, i).join('.'));
  }

  const buildMenu = (nodes: ResourceNode[]): MenuNode[] =>
    nodes
      .filter((n) => n.status === 'Active' && reachable.has(n.resource_key))
      .map((n) => ({ key: n.resource_key, name: n.name, children: buildMenu(n.children) }));

  return {
    version: PERMISSION_VERSION,
    roles: mine.map((r) => r.name).sort(),
    permissions: [...granted].sort(),
    menu: buildMenu(getResourceTree(app.id)),
  };
}

/* -------------------------------------------------------------- dashboard -- */

export function getDashboardStats() {
  const activeApps = applications.filter((a) => a.status === 'Active');
  const orphaned = resources.filter((r) => r.status === 'Orphaned');
  const deprecatedActions = actions.filter((a) => a.status === 'Deprecated');
  const appsWithOrphans = new Set(orphaned.map((r) => r.application_key));

  return {
    applications: activeApps.length,
    applicationsTotal: applications.length,
    roles: roles.filter((r) => r.status === 'Active').length,
    rolesTotal: roles.length,
    users: users.filter((u) => u.status === 'Active').length,
    usersTotal: users.length,
    assignments: userRoles.length,
    permissions: permissions.length,
    screens: resources.filter((r) => r.status === 'Active').length,
    orphanedScreens: orphaned.length,
    deprecatedActions: deprecatedActions.length,
    appsNeedingAttention: [...appsWithOrphans].map((k) => appByKey.get(k)!),
    permissionVersion: PERMISSION_VERSION,
  };
}

/** Applications ranked by assignment footprint — dashboard coverage panel. */
export function getApplicationCoverage() {
  return listApplications()
    .filter((a) => a.status === 'Active')
    .map((a) => ({
      key: a.app_key,
      id: a.id,
      name: a.name,
      users: a.total_users,
      roles: a.total_roles,
      screens: a.total_screens,
      lastSync: a.last_sync_at,
      orphaned: a.orphaned_screens,
    }))
    .sort((a, b) => b.users - a.users);
}

/** Most recently synced applications, newest first — dashboard sync panel. */
export function getRecentSyncs(limit = 5) {
  return listApplications()
    .filter((a) => a.last_sync_at)
    .sort((a, b) => (a.last_sync_at! < b.last_sync_at! ? 1 : -1))
    .slice(0, limit);
}
