'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listApplications } from '../../lib/api-client';
import { formatDateTime, matches } from '../../lib/format';
import {
  PageHead, TableCard, SearchInput, Select, StatusBadge, Chip, Badge,
  EmptyState, Modal, Field, Notice, useDemoNotice, ResultCount,
} from '../../components/ui';
import { IconPlus, IconExternal, IconSync, IconWarn } from '../../components/icons';
import type { ApplicationSummary } from '@compass/rbac-contracts';

export default function ApplicationsPage() {
  const router = useRouter();
  const all = listApplications();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const { notice, prompt } = useDemoNotice();

  const rows = useMemo(
    () => all.filter((a) =>
      (status === 'all' || a.status === status) &&
      matches(query, a.name, a.app_key, a.owner)),
    [all, query, status],
  );

  return (
    <>
      <PageHead
        title="Applications"
        subtitle="Every product registered with RBAC. Screens and actions arrive by manifest sync — they are never typed in by hand."
        actions={
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>
            <IconPlus /> Add Application
          </button>
        }
      />

      <TableCard<ApplicationSummary>
        rows={rows}
        rowKey={(a) => a.id}
        onRowClick={(a) => router.push(`/applications/${a.id}`)}
        toolbar={
          <div className="filters" style={{ width: '100%' }}>
            <div className="search" style={{ flex: 1 }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search applications…" />
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
            <ResultCount shown={rows.length} total={all.length} noun="applications" />
          </div>
        }
        empty={
          <EmptyState
            title="No applications match"
            text="Try a different search term or clear the status filter."
          />
        }
        columns={[
          {
            key: 'name',
            header: 'Application Name',
            render: (a) => (
              <div className="row gap-8">
                <span className="t__primary">{a.name}</span>
                {a.orphaned_screens > 0 && (
                  <Badge tone="warn" plain>
                    <IconWarn width={10} height={10} /> {a.orphaned_screens} orphaned
                  </Badge>
                )}
              </div>
            ),
          },
          { key: 'key', header: 'App Key', render: (a) => <Chip>{a.app_key}</Chip>, nowrap: true },
          { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} />, nowrap: true },
          {
            key: 'version', header: 'Version (Manifest)', nowrap: true,
            render: (a) => <span className="mono small">{a.manifest_version ?? '—'}</span>,
          },
          {
            key: 'sync', header: 'Last Sync', nowrap: true,
            render: (a) => a.last_sync_at
              ? <span className="small muted">{formatDateTime(a.last_sync_at)}</span>
              : <span className="faint small">Never</span>,
          },
          {
            key: 'actions', header: '', align: 'right', width: '96px',
            render: (a) => (
              <div className="t__actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn--ghost btn--icon btn--sm"
                  title="Sync manifest now"
                  onClick={() => prompt('Sync manifest')}
                >
                  <IconSync />
                </button>
                <Link href={`/applications/${a.id}`} className="btn btn--ghost btn--icon btn--sm" title="Open">
                  <IconExternal />
                </Link>
              </div>
            ),
          },
        ]}
      />

      {showAdd && (
        <Modal
          title="Add Application"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={() => { setShowAdd(false); prompt('Register application'); }}>
                Register Application
              </button>
            </>
          }
        >
          <div className="stack gap-14">
            <Field label="Application Name" required>
              <input className="input" placeholder="e.g. Billing Portal" />
            </Field>
            <Field label="App Key" required hint="Lowercase slug, immutable once created. Used by the manifest and runtime APIs.">
              <input className="input mono" placeholder="e.g. billing_portal" />
            </Field>
            <Field label="Owner">
              <input className="input" placeholder="e.g. Finance Systems Team" />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} placeholder="What this application does." />
            </Field>
            <Notice tone="accent">
              On save, RBAC issues a <b>client_id</b> and <b>client_secret</b> for the Machine API.
              The secret is shown <b>once</b> and stored only as a bcrypt hash — it can never be
              retrieved again.
            </Notice>
          </div>
        </Modal>
      )}
      {notice}
    </>
  );
}
