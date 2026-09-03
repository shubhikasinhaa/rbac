'use client';

import Link from 'next/link';
import { getAuditLog, getApplicationByKey } from '../../../lib/api-client';
import { formatDateTime } from '../../../lib/format';
import { PageHead, Card, Badge, Avatar, EmptyState, Notice, Chip } from '../../../components/ui';
import { AuditDiff } from '../../../components/AuditDiff';

export default function AuditDetailView({ id }: { id: string }) {
  const entry = getAuditLog(id);
  if (!entry) return <EmptyState title="Audit entry not found" text="The identifier may be incorrect." />;

  const app = entry.application_key ? getApplicationByKey(entry.application_key) : undefined;

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Audit Log', href: '/audit-log' }, { label: entry.event_type }]}
        title={entry.entity_name ?? entry.entity_id}
        badge={<Badge tone="accent">{entry.event_type}</Badge>}
        subtitle={entry.details}
      />

      <Card>
        <div className="rowgrid rowgrid--3">
          <div className="kv">
            <span className="kv__k">Event</span>
            <span className="kv__v">{entry.event_type}</span>
          </div>
          <div className="kv">
            <span className="kv__k">Entity</span>
            <span className="kv__v">
              {entry.entity_name ?? '—'} <Badge plain>{entry.entity_type}</Badge>
            </span>
          </div>
          <div className="kv">
            <span className="kv__k">Time</span>
            <span className="kv__v">{formatDateTime(entry.timestamp)}</span>
          </div>
        </div>

        <div className="rowgrid rowgrid--3 mt-18">
          <div className="kv">
            <span className="kv__k">Actor</span>
            <span className="kv__v">
              <span className="row gap-8">
                <Avatar name={entry.actor_name} size="sm" />
                {entry.actor_name}
              </span>
            </span>
          </div>
          <div className="kv">
            <span className="kv__k">Application</span>
            <span className="kv__v">
              {app
                ? <Link href={`/applications/${app.id}`} style={{ textDecoration: 'underline' }}>{app.name}</Link>
                : '—'}
            </span>
          </div>
          <div className="kv">
            <span className="kv__k">Entity ID</span>
            <span className="kv__v"><Chip>{entry.entity_id}</Chip></span>
          </div>
        </div>
      </Card>

      <div className="mt-14">
        <AuditDiff before={entry.before_state} after={entry.after_state} />
      </div>

      <div className="mt-14">
        <Notice>
          This record is <b>immutable</b>. No console action or API endpoint can modify or delete
          it — the application database principal holds INSERT and SELECT on{' '}
          <span className="mono">audit_log</span> only.
        </Notice>
      </div>
    </>
  );
}
