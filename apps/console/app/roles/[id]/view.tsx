'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getRole, getRolePermissionIds, getResourceTree, listActions,
  listPermissions, getApplicationByKey, listAssignments,
} from '../../../lib/api-client';
import { formatDateTime } from '../../../lib/format';
import {
  PageHead, Card, StatusBadge, Avatar, EmptyState, Notice,
  useDemoNotice, Field, Tabs, TableCard, ResultCount,
} from '../../../components/ui';
import { PermissionMatrix } from '../../../components/PermissionMatrix';

type Tab = 'permissions' | 'users';

export default function RoleDetailView({ id }: { id: string }) {
  const router = useRouter();
  const role = getRole(id);
  const app = role ? getApplicationByKey(role.application_key) : undefined;
  const [tab, setTab] = useState<Tab>('permissions');
  const { notice, prompt } = useDemoNotice();

  const tree = useMemo(() => (app ? getResourceTree(app.id) : []), [app]);
  const actions = useMemo(
    () => (app ? listActions(app.id).filter((a) => a.status === 'Active') : []),
    [app],
  );
  const permissions = useMemo(() => (role ? listPermissions(role.application_key) : []), [role]);
  const assignees = useMemo(
    () => (role ? listAssignments().filter((a) => a.role_id === role.id) : []),
    [role],
  );

  // (resource, action) -> permission id. Absent means the manifest never declared the pair.
  const lookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of permissions) map.set(`${p.resource_id}|${p.action_id}`, p.id);
    return (r: string, a: string) => map.get(`${r}|${a}`);
  }, [permissions]);

  const saved = useMemo(() => new Set(role ? getRolePermissionIds(role.id) : []), [role]);
  const [draft, setDraft] = useState<Set<string>>(saved);

  if (!role || !app) {
    return <EmptyState title="Role not found" text="It may have been removed." />;
  }

  const dirty = draft.size !== saved.size || [...draft].some((p) => !saved.has(p));
  const added = [...draft].filter((p) => !saved.has(p)).length;
  const removed = [...saved].filter((p) => !draft.has(p)).length;

  const orphanedGrants = [...draft]
    .map((pid) => permissions.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => !!p && p.status === 'Orphaned');

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Roles', href: '/roles' }, { label: role.name }]}
        title={role.name}
        badge={<StatusBadge status={role.status} />}
        subtitle={
          <>
            <Link href={`/applications/${app.id}`} style={{ textDecoration: 'underline' }}>{app.name}</Link>
            {' · '}{draft.size} permissions · {role.user_count} users · updated {formatDateTime(role.updated_at)}
          </>
        }
        actions={
          <>
            <button className="btn" disabled={!dirty} onClick={() => setDraft(saved)}>Cancel</button>
            <button className="btn btn--primary" disabled={!dirty} onClick={() => prompt('Save role')}>
              Save Role
            </button>
          </>
        }
      />

      <div className="rowgrid rowgrid--2 mb-18">
        <Field label="Role Name" required>
          <input className="input" defaultValue={role.name} readOnly />
        </Field>
        <Field label="Description">
          <input className="input" defaultValue={role.description ?? ''} readOnly />
        </Field>
      </div>

      {dirty && (
        <div className="mb-14">
          <Notice tone="accent">
            <b>Unsaved changes</b> — {added > 0 && `${added} permission${added === 1 ? '' : 's'} added`}
            {added > 0 && removed > 0 && ', '}
            {removed > 0 && `${removed} permission${removed === 1 ? '' : 's'} removed`}. Saving
            replaces the entire grant set atomically and increments{' '}
            <span className="mono">permission_version</span>.
          </Notice>
        </div>
      )}

      {orphanedGrants.length > 0 && (
        <div className="mb-14">
          <Notice tone="warn">
            This role still grants <b>{orphanedGrants.length}</b> permission
            {orphanedGrants.length === 1 ? '' : 's'} on a screen removed from the manifest
            ({orphanedGrants.map((p) => p.canonical_string).join(', ')}). The screen was flagged{' '}
            <b>Orphaned</b> rather than deleted, so nothing was silently revoked.
          </Notice>
        </div>
      )}

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'permissions', label: 'Permissions (Screens × Actions)', count: draft.size },
          { id: 'users', label: 'Assigned Users', count: assignees.length },
        ]}
      />

      {tab === 'permissions' && (
        actions.length === 0 || tree.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing to configure yet"
              text={`${app.name} has not declared any screens or actions. Its manifest must sync first.`}
            />
          </Card>
        ) : (
          <PermissionMatrix
            tree={tree}
            actions={actions}
            granted={draft}
            permissionLookup={lookup}
            onChange={setDraft}
          />
        )
      )}

      {tab === 'users' && (
        <TableCard
          rows={assignees}
          rowKey={(a) => a.id}
          onRowClick={(a) => router.push(`/users/${a.user_id}`)}
          toolbar={<ResultCount shown={assignees.length} total={assignees.length} noun="users" />}
          empty={
            <EmptyState
              title="No users hold this role"
              text="Assign it from the Assignments screen to grant its permissions."
              action={<Link href="/assignments" className="btn btn--primary">Go to Assignments</Link>}
            />
          }
          columns={[
            {
              key: 'user', header: 'User',
              render: (a) => (
                <div className="row gap-8">
                  <Avatar name={a.user_name} size="sm" />
                  <div>
                    <div className="t__primary">{a.user_name}</div>
                    <div className="small muted">{a.user_email}</div>
                  </div>
                </div>
              ),
            },
            { key: 'on', header: 'Assigned On', render: (a) => <span className="small muted">{formatDateTime(a.assigned_at)}</span>, nowrap: true },
            { key: 'by', header: 'Assigned By', render: (a) => <span className="small">{a.assigned_by_name}</span>, nowrap: true },
          ]}
        />
      )}
      {notice}
    </>
  );
}
