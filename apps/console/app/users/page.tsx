'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listUsers } from '../../lib/api-client';
import { formatDate, matches } from '../../lib/format';
import {
  PageHead, TableCard, SearchInput, Select, StatusBadge, Avatar,
  EmptyState, Modal, Field, Notice, useDemoNotice, ResultCount,
} from '../../components/ui';
import { IconPlus, IconExternal } from '../../components/icons';
import type { UserSummary } from '@compass/rbac-contracts';

export default function UsersPage() {
  const router = useRouter();
  const all = listUsers();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const { notice, prompt } = useDemoNotice();

  const rows = useMemo(
    () => all.filter((u) =>
      (status === 'all' || u.status === status) && matches(query, u.name, u.email)),
    [all, query, status],
  );

  return (
    <>
      <PageHead
        title="Users"
        subtitle="Identities mirrored from the enterprise Identity Provider. RBAC stores no credentials and issues no sessions — only the external_id, profile and role assignments."
        actions={
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>
            <IconPlus /> Add User
          </button>
        }
      />

      <TableCard<UserSummary>
        rows={rows}
        rowKey={(u) => u.id}
        onRowClick={(u) => router.push(`/users/${u.id}`)}
        toolbar={
          <div className="filters" style={{ width: '100%' }}>
            <div className="search" style={{ flex: 1 }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search users by name or email…" />
            </div>
            <Select
              value={status}
              onChange={setStatus}
              ariaLabel="Filter by status"
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
            <ResultCount shown={rows.length} total={all.length} noun="users" />
          </div>
        }
        empty={<EmptyState title="No users match" text="Try a different search term or clear the status filter." />}
        columns={[
          {
            key: 'name', header: 'Name',
            render: (u) => (
              <div className="row gap-10">
                <Avatar name={u.name} size="sm" />
                <span className="t__primary">{u.name}</span>
              </div>
            ),
          },
          { key: 'email', header: 'Email', render: (u) => <span className="muted">{u.email}</span>, nowrap: true },
          { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} />, nowrap: true },
          {
            key: 'apps', header: 'Applications', align: 'right', width: '110px',
            render: (u) => <span className="tabnum">{u.application_count}</span>,
          },
          {
            key: 'roles', header: 'Roles', align: 'right', width: '80px',
            render: (u) => <span className="tabnum">{u.role_count}</span>,
          },
          {
            key: 'login', header: 'Last Login', nowrap: true,
            render: (u) => u.last_login_at
              ? <span className="small muted">{formatDate(u.last_login_at)}</span>
              : <span className="faint small">Never</span>,
          },
          { key: 'go', header: '', align: 'right', width: '48px', render: () => <IconExternal className="faint" /> },
        ]}
      />

      {showAdd && (
        <Modal
          title="Add User"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={() => { setShowAdd(false); prompt('Add user'); }}>
                Mirror User
              </button>
            </>
          }
        >
          <div className="stack gap-14">
            <Field label="External ID (IdP subject)" required hint="The `sub` claim from the enterprise IdP token. Must be unique.">
              <input className="input mono" placeholder="e.g. 8f3c1e94-…" />
            </Field>
            <Field label="Full Name" required>
              <input className="input" placeholder="e.g. Tarun Pillai" />
            </Field>
            <Field label="Email" required>
              <input className="input" type="email" placeholder="name@compass.com" />
            </Field>
            <Notice>
              This creates a <b>mirror record only</b>. Authentication stays with the IdP — RBAC
              never stores a password. Users are also mirrored automatically the first time they
              authenticate through a consuming application.
            </Notice>
          </div>
        </Modal>
      )}
      {notice}
    </>
  );
}
