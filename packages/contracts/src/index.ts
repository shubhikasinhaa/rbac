/**
 * Shared contracts between the RBAC API, the Admin Console and the client SDK.
 * Types here mirror db/rbac_mock.sql one-for-one, so the console compiles against
 * the same shapes the real API will return.
 */

export type ApplicationStatus = 'Active' | 'Inactive';
export type ActionStatus = 'Active' | 'Deprecated';
export type ResourceStatus = 'Active' | 'Deprecated' | 'Orphaned';
export type PermissionStatus = 'Active' | 'Orphaned';
export type RoleStatus = 'Active' | 'Inactive';
export type UserStatus = 'Active' | 'Inactive';

export interface Application {
  id: string;
  app_key: string;
  name: string;
  owner: string | null;
  description: string | null;
  status: ApplicationStatus;
  manifest_version: string | null;
  manifest_endpoint: string | null;
  last_sync_at: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  application_id: string;
  application_key: string;
  action_key: string;
  name: string;
  description: string | null;
  status: ActionStatus;
  is_custom: boolean;
}

export interface Resource {
  id: string;
  application_id: string;
  application_key: string;
  parent_id: string | null;
  parent_key: string | null;
  resource_key: string;
  name: string;
  level: number;
  status: ResourceStatus;
}

export interface Permission {
  id: string;
  application_key: string;
  resource_id: string;
  resource_key: string;
  action_id: string;
  action_key: string;
  /** `resource_key:action_key`, e.g. `invoices.credit_note:write` */
  canonical_string: string;
  status: PermissionStatus;
}

export interface Role {
  id: string;
  application_id: string;
  application_key: string;
  name: string;
  description: string | null;
  status: RoleStatus;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface AppUser {
  id: string;
  /** IdP `sub` claim. RBAC stores no credentials. */
  external_id: string;
  email_prefix: string;
  name: string;
  email: string;
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  application_key: string;
  assigned_by: string;
  assigned_at: string;
}

export type AuditEntityType =
  | 'Role' | 'Assignment' | 'Permission' | 'Manifest'
  | 'Application' | 'User' | 'Settings' | 'Action';

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  application_id: string | null;
  application_key: string | null;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name: string | null;
  event_type: string;
  details: string | null;
  /** JSON snapshot, or null for a create event. */
  before_state: string | null;
  /** JSON snapshot, or null for a delete event. */
  after_state: string | null;
  timestamp: string;
}

export interface SystemSetting {
  setting_key: string;
  label: string;
  setting_value: string;
  value_type: string;
  options: string[];
}

/* ------------------------------------------------------------ view models -- */

export interface ResourceNode extends Resource {
  children: ResourceNode[];
}

export interface MenuNode {
  key: string;
  name: string;
  children: MenuNode[];
}

/** Runtime snapshot returned by `GET /v1/me/permissions?app={app_key}`. */
export interface PermissionsResponse {
  version: number;
  roles: string[];
  permissions: string[];
  menu: MenuNode[];
}

export interface ApplicationSummary extends Application {
  total_screens: number;
  total_actions: number;
  total_roles: number;
  total_users: number;
  orphaned_screens: number;
}

export interface RoleSummary extends Role {
  user_count: number;
  permission_count: number;
}

export interface UserSummary extends AppUser {
  application_count: number;
  role_count: number;
}

export interface AssignmentSummary {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  application_key: string;
  application_name: string;
  role_id: string;
  role_name: string;
  assigned_at: string;
  assigned_by_name: string;
}

export interface AuditLogSummary extends AuditLogEntry {
  actor_name: string;
  application_name: string | null;
}

/** Tri-state used by the Permission Builder parent rows. */
export type TriState = 'full' | 'partial' | 'none';

/* --------------------------------------------------- permission-string ops -- */

export function parsePermission(canonical: string): { resource: string; action: string } | null {
  const i = canonical.lastIndexOf(':');
  if (i <= 0 || i === canonical.length - 1) return null;
  return { resource: canonical.slice(0, i), action: canonical.slice(i + 1) };
}

export function buildPermission(resource: string, action: string): string {
  return `${resource}:${action}`;
}
