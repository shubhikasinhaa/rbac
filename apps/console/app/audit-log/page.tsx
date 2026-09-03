'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listAuditLogs, listApplications, auditEventTypes, auditEntityTypes,
} from '../../lib/api-client';
import { formatDateTime, matches } from '../../lib/format';
import {
  PageHead, TableCard, SearchInput, Select, Badge, Avatar,
  EmptyState, Notice, ResultCount,
} from '../../components/ui';
import { IconExternal } from '../../components/icons';
import type { AuditLogSummary } from '@compass/rbac-contracts';

const RANGES = [
  { value: 'all', label: 'All time', from: null as string | null },
  { value: '7d', label: 'Last 7 days', from: '2026-05-13T00:00:00' },
  { value: '14d', label: 'Last 14 days', from: '2026-05-06T00:00:00' },
  { value: '30d', label: 'Last 30 days', from: '2026-04-20T00:00:00' },
];

export default function AuditLogPage() {
  const router = useRouter();
  const all = listAuditLogs();
  const apps = listApplications();

  const [appKey, setAppKey] = useState('all');
  const [event, setEvent] = useState('all');
  const [entity, setEntity] = useState('all');
  const [range, setRange] = useState('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const from = RANGES.find((r) => r.value === range)?.from ?? null;
    return all.filter((e) =>
      (appKey === 'all' || e.application_key === appKey) &&
      (event === 'all' || e.event_type === event) &&
      (entity === 'all' || e.entity_type === entity) &&
      (!from || e.timestamp >= from) &&
      matches(query, e.entity_name, e.entity_id, e.actor_name, e.details, e.event_type));
  }, [all, appKey, event, entity, range, query]);

  return (
    <>
      <PageHead
        title="Audit Log"
        subtitle="Append-only record of every authorization change. Entries can be filtered and inspected but never edited or deleted."
      />

      <div className="mb-14">
        <Notice>
          The <span className="mono">audit_log</span> table is immutable by design — the
          application database principal holds <b>INSERT and SELECT only</b>. All times are shown in
          the system timezone.
        </Notice>
      </div>

      <div className="card mb-14">
        <div className="card__body">
          <div className="filters">
            <div className="field">
              <span className="field__label">Application</span>
              <Select
                value={appKey} onChange={setAppKey} ariaLabel="Filter by application"
                options={[{ value: 'all', label: 'All' }, ...apps.map((a) => ({ value: a.app_key, label: a.name }))]}
              />
            </div>
            <div className="field">
              <span className="field__label">Event</span>
              <Select
                value={event} onChange={setEvent} ariaLabel="Filter by event"
                options={[{ value: 'all', label: 'All' }, ...auditEventTypes.map((e) => ({ value: e, label: e }))]}
              />
            </div>
            <div className="field">
              <span className="field__label">Entity</span>
              <Select
                value={entity} onChange={setEntity} ariaLabel="Filter by entity type"
                options={[{ value: 'all', label: 'All' }, ...auditEntityTypes.map((e) => ({ value: e, label: e }))]}
              />
            </div>
            <div className="field">
              <span className="field__label">Date Range</span>
              <Select
                value={range} onChange={setRange} ariaLabel="Filter by date range"
                options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
              />
            </div>
            <div className="search" style={{ flex: 1 }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search logs…" />
            </div>
          </div>
        </div>
      </div>

      <TableCard<AuditLogSummary>
        rows={rows}
        rowKey={(e) => e.id}
        onRowClick={(e) => router.push(`/audit-log/${e.id}`)}
        toolbar={<ResultCount shown={rows.length} total={all.length} noun="events" />}
        empty={<EmptyState title="No events match" text="Widen the date range or clear a filter." />}
        columns={[
          { key: 'time', header: 'Time', width: '175px', nowrap: true, render: (e) => <span className="small muted">{formatDateTime(e.timestamp)}</span> },
          {
            key: 'user', header: 'User', width: '170px', nowrap: true,
            render: (e) => (
              <div className="row gap-8">
                <Avatar name={e.actor_name} size="sm" />
                <span className="truncate">{e.actor_name}</span>
              </div>
            ),
          },
          { key: 'event', header: 'Event', width: '165px', nowrap: true, render: (e) => <Badge plain>{e.event_type}</Badge> },
          {
            key: 'entity', header: 'Entity',
            render: (e) => (
              <div>
                <div className="truncate" style={{ maxWidth: 320 }}>{e.entity_name ?? e.entity_id}</div>
                <div className="small faint">{e.entity_type}{e.application_name ? ` · ${e.application_name}` : ''}</div>
              </div>
            ),
          },
          { key: 'details', header: 'Details', render: (e) => <span className="muted small">{e.details}</span> },
          { key: 'go', header: '', align: 'right', width: '48px', render: () => <IconExternal className="faint" /> },
        ]}
      />
    </>
  );
}
