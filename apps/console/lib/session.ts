/**
 * Signed-in identity for the demo.
 *
 * In production this comes from the enterprise IdP JWT: the `sub` claim resolves
 * to app_user.external_id, and the user's role within the `rbac-console`
 * application decides what the console lets them do (arch.md S7).
 * RBAC itself never stores credentials or issues sessions.
 */
import { users, userRoles, roles } from './mock/dataset.generated';

const me = users.find((u) => u.email_prefix === 'arjun.mehta')!;

const consoleRoleNames = userRoles
  .filter((ur) => ur.user_id === me.id && ur.application_key === 'rbac_console')
  .map((ur) => roles.find((r) => r.id === ur.role_id)?.name)
  .filter(Boolean) as string[];

export const CURRENT_USER = {
  id: me.id,
  externalId: me.external_id,
  name: me.name,
  email: me.email,
  consoleRole: consoleRoleNames[0] ?? 'READ_ONLY_ADMIN',
  consoleRoles: consoleRoleNames,
};

/** True when the signed-in admin may perform write operations in the console. */
export const canWrite = CURRENT_USER.consoleRoles.some(
  (r) => r === 'SUPER_ADMIN' || r === 'SECURITY_ADMIN',
);
