'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listApplications, listRoles } from '../../lib/api-client';
import { matches } from '../../lib/format';
import {
  PageHead, TableCard, SearchInput, Select, StatusBadge, Badge,
  EmptyState, Modal, Field, Notice, useDemoNotice, ResultCount,
} from '../../components/ui';
import { IconPlus, IconExternal } from '../../components/icons';
import type { RoleSummary } from '@compass/rbac-contracts';

export default function RolesPage() {
  const router = useRouter();
  const apps = listApplications();
  const [appId, setAppId] = useState(apps.find((a) => a.app_key === 'saarthi_fx')?.id ?? apps[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { notice, prompt } = useDemoNotice();

  const all = useMemo(() => listRoles(appId || undefined), [appId]);
  const rows = useMemo(() => all.filter((r) => matches(query, r.name, r.description)), [all, query]);
  const app = apps.find((a) => a.id === appId);

  return (
    <>
      <PageHead
        title="Roles"
        subtitle="Roles are scoped to a single application and never shared across boundaries. A user's effective permissions are the union of the roles they hold."
        actions={
          <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
            <IconPlus /> Create Role
          </button>
        }
      />

      <TableCard<RoleSummary>
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/roles/${r.id}`)}
        toolbar={
          <div className="filters" style={{ width: '100%' }}>
            <div className="field" style={{ minWidth: 230 }}>
              <span className="field__label">Application</span>
              <Select
                value={appId}
                onChange={setAppId}
                ariaLabel="Filter by application"
                options={apps.map((a) => ({ value: a.id, label: a.name }))}
              />
            </div>
            <div className="search" style={{ flex: 1 }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search roles…" />
            </div>
            <ResultCount shown={rows.length} total={all.length} noun="roles" />
          </div>
        }
        empty={
          <EmptyState
            title="No roles yet"
            text={`Create a role for ${app?.name ?? 'this application'} to start granting access.`}
            action={<button className="btn btn--primary" onClick={() => setShowCreate(true)}><IconPlus /> Create Role</button>}
          />
        }
        columns={[
          { key: 'name', header: 'Role Name', render: (r) => <span className="t__primary">{r.name}</span> },
          { key: 'desc', header: 'Description', render: (r) => <span className="muted">{r.description}</span> },
          { key: 'users', header: 'Users', align: 'right', width: '80px', render: (r) => <span className="tabnum">{r.user_count}</span> },
          {
            key: 'perms', header: 'Permissions', align: 'right', width: '110px',
            render: (r) => <span className="tabnum">{r.permission_count}</span>,
          },
          { key: 'status', header: 'Status', width: '110px', render: (r) => <StatusBadge status={r.status} />, nowrap: true },
          {
            key: 'go', header: '', align: 'right', width: '48px',
            render: () => <IconExternal className="faint" />,
          },
        ]}
      />

      {showCreate && (
        <Modal
          title="Create Role"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={() => { setShowCreate(false); prompt('Create role'); }}>
                Create Role
              </button>
            </>
          }
        >
          <div className="stack gap-14">
            <Field label="Application" required>
              <Select
                value={appId}
                onChange={setAppId}
                options={apps.map((a) => ({ value: a.id, label: a.name }))}
              />
            </Field>
            <Field label="Role Name" required hint="Must be unique within the application.">
              <input className="input" placeholder="e.g. Regional Supervisor" />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} placeholder="What this job function is allowed to do." />
            </Field>
            <Notice>
              The role is created with <b>0 permissions</b>. Open it afterwards to configure the
              screens × actions matrix.
            </Notice>
          </div>
        </Modal>
      )}
      {notice}
    </>
  );
}
