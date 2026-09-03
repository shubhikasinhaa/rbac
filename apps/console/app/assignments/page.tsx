'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listAssignments, listApplications, listUsers, listRoles,
} from '../../lib/api-client';
import { formatDate, matches } from '../../lib/format';
import {
  PageHead, TableCard, SearchInput, Select, Avatar, Badge, EmptyState,
  Modal, Field, Notice, useDemoNotice, ResultCount,
} from '../../components/ui';
import { IconPlus, IconTrash, IconExternal } from '../../components/icons';
import type { AssignmentSummary } from '@compass/rbac-contracts';

export default function AssignmentsPage() {
  const router = useRouter();
  const all = listAssignments();
  const apps = listApplications();
  const users = listUsers();

  const [userId, setUserId] = useState('all');
  const [appKey, setAppKey] = useState('all');
  const [roleId, setRoleId] = useState('all');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { notice, prompt } = useDemoNotice();

  // The role filter only offers roles from the selected application, since
  // roles are strictly application-scoped.
  const roleOptions = useMemo(() => {
    const app = apps.find((a) => a.app_key === appKey);
    return app ? listRoles(app.id) : [];
  }, [apps, appKey]);

  const rows = useMemo(
    () => all.filter((a) =>
      (userId === 'all' || a.user_id === userId) &&
      (appKey === 'all' || a.application_key === appKey) &&
      (roleId === 'all' || a.role_id === roleId) &&
      matches(query, a.user_name, a.user_email, a.role_name, a.application_name)),
    [all, userId, appKey, roleId, query],
  );

  return (
    <>
      <PageHead
        title="Assignments"
        subtitle="Every user-to-role grant, with who granted it and when. Each change increments permission_version so client caches refresh."
        actions={
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>
            <IconPlus /> Add Assignment
          </button>
        }
      />

      <div className="card mb-14">
        <div className="card__body">
          <div className="filters">
            <div className="field">
              <span className="field__label">User</span>
              <Select
                value={userId} onChange={setUserId} ariaLabel="Filter by user"
                options={[{ value: 'all', label: 'All users' }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
              />
            </div>
            <div className="field">
              <span className="field__label">Application</span>
              <Select
                value={appKey}
                onChange={(v) => { setAppKey(v); setRoleId('all'); }}
                ariaLabel="Filter by application"
                options={[{ value: 'all', label: 'All applications' }, ...apps.map((a) => ({ value: a.app_key, label: a.name }))]}
              />
            </div>
            <div className="field">
              <span className="field__label">Role</span>
              <Select
                value={roleId} onChange={setRoleId} ariaLabel="Filter by role"
                options={[
                  { value: 'all', label: appKey === 'all' ? 'All roles' : 'All roles in application' },
                  ...roleOptions.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
            <div className="search" style={{ flex: 1 }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search assignments…" />
            </div>
          </div>
        </div>
      </div>

      <TableCard<AssignmentSummary>
        rows={rows}
        rowKey={(a) => a.id}
        toolbar={<ResultCount shown={rows.length} total={all.length} noun="assignments" />}
        empty={<EmptyState title="No assignments match" text="Try clearing a filter or searching for a different name." />}
        columns={[
          {
            key: 'user', header: 'User',
            render: (a) => (
              <div
                className="row gap-10"
                onClick={(e) => { e.stopPropagation(); router.push(`/users/${a.user_id}`); }}
                style={{ cursor: 'pointer' }}
              >
                <Avatar name={a.user_name} size="sm" />
                <div>
                  <div className="t__primary">{a.user_name}</div>
                  <div className="small muted">{a.user_email}</div>
                </div>
              </div>
            ),
          },
          { key: 'app', header: 'Application', render: (a) => a.application_name, nowrap: true },
          {
            key: 'role', header: 'Role', nowrap: true,
            render: (a) => (
              <span onClick={(e) => { e.stopPropagation(); router.push(`/roles/${a.role_id}`); }} style={{ cursor: 'pointer' }}>
                <Badge plain>{a.role_name}</Badge>
              </span>
            ),
          },
          { key: 'on', header: 'Assigned On', render: (a) => <span className="small muted">{formatDate(a.assigned_at)}</span>, nowrap: true },
          { key: 'by', header: 'Assigned By', render: (a) => <span className="small">{a.assigned_by_name}</span>, nowrap: true },
          {
            key: 'actions', header: '', align: 'right', width: '86px',
            render: (a) => (
              <div className="t__actions">
                <button
                  className="btn btn--ghost btn--icon btn--sm btn--danger"
                  title={`Revoke ${a.role_name} from ${a.user_name}`}
                  onClick={(e) => { e.stopPropagation(); prompt('Revoke assignment'); }}
                >
                  <IconTrash />
                </button>
                <button
                  className="btn btn--ghost btn--icon btn--sm"
                  title="Open user"
                  onClick={(e) => { e.stopPropagation(); router.push(`/users/${a.user_id}`); }}
                >
                  <IconExternal />
                </button>
              </div>
            ),
          },
        ]}
      />

      {showAdd && (
        <Modal
          title="Add Assignment"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={() => { setShowAdd(false); prompt('Create assignment'); }}>
                Add Assignment
              </button>
            </>
          }
        >
          <div className="stack gap-14">
            <Field label="User" required>
              <Select value={users[0]?.id ?? ''} onChange={() => {}} options={users.map((u) => ({ value: u.id, label: `${u.name} — ${u.email}` }))} />
            </Field>
            <Field label="Application" required>
              <Select value={apps[0]?.app_key ?? ''} onChange={() => {}} options={apps.map((a) => ({ value: a.app_key, label: a.name }))} />
            </Field>
            <Field label="Role" required hint="Only roles belonging to the selected application are offered.">
              <Select
                value=""
                onChange={() => {}}
                options={listRoles(apps[0]?.id).map((r) => ({ value: r.id, label: `${r.name} — ${r.permission_count} permissions` }))}
              />
            </Field>
            <Notice>
              A user may hold several roles in one application; their effective permissions are the{' '}
              <b>union</b> of those roles. Assigning a role the user already holds is rejected —
              there are no duplicate assignments.
            </Notice>
          </div>
        </Modal>
      )}
      {notice}
    </>
  );
}
