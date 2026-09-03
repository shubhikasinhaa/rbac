'use client';

import Link from 'next/link';
import {
  getDashboardStats, getApplicationCoverage, getRecentSyncs, listAuditLogs,
} from '../lib/api-client';
import { CURRENT_USER } from '../lib/session';
import { formatDateTime, formatRelative, pluralise } from '../lib/format';
import {
  PageHead, Card, Stat, StatusBadge, Badge, Avatar, Notice, EmptyState,
} from '../components/ui';
import {
  IconApps, IconShield, IconUsers, IconLink, IconLayers,
  IconWarn, IconArrowRight, IconSync,
} from '../components/icons';

export default function DashboardPage() {
  const stats = getDashboardStats();
  const coverage = getApplicationCoverage();
  const syncs = getRecentSyncs(5);
  const recent = listAuditLogs().slice(0, 7);

  const maxUsers = Math.max(1, ...coverage.map((c) => c.users));
  const attention = stats.appsNeedingAttention;

  return (
    <>
      <PageHead
        title={`Good morning, ${CURRENT_USER.name.split(' ')[0]}`}
        subtitle={
          <>
            Authorization across {pluralise(stats.applications, 'active application')} ·{' '}
            {stats.permissions.toLocaleString()} permissions defined
          </>
        }
      />

      {attention.length > 0 && (
        <div className="mb-18">
          <Notice tone="warn">
            <b>{pluralise(stats.orphanedScreens, 'orphaned screen')}</b> across{' '}
            {attention.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ', '}
                <Link href={`/applications/${a.id}`} style={{ textDecoration: 'underline' }}>{a.name}</Link>
              </span>
            ))}
            {' '}— removed from a manifest but still granted by a role, so{' '}
            {stats.orphanedScreens === 1 ? 'it was' : 'they were'} flagged rather than deleted.
            Review the roles that reference {stats.orphanedScreens === 1 ? 'it' : 'them'}.
          </Notice>
        </div>
      )}

      <div className="stats stats--5">
        <Stat icon={<IconApps width={12} height={12} />} label="Applications" value={stats.applications}
          hint={`${stats.applicationsTotal} registered`} href="/applications" />
        <Stat icon={<IconShield width={12} height={12} />} label="Roles" value={stats.roles}
          hint={`${stats.rolesTotal - stats.roles} inactive`} href="/roles" />
        <Stat icon={<IconUsers width={12} height={12} />} label="Users" value={stats.users}
          hint={`${stats.usersTotal - stats.users} inactive`} href="/users" />
        <Stat icon={<IconLink width={12} height={12} />} label="Assignments" value={stats.assignments}
          hint="user ↔ role grants" href="/assignments" />
        <Stat icon={<IconLayers width={12} height={12} />} label="Screens" value={stats.screens}
          hint={stats.orphanedScreens > 0 ? `${stats.orphanedScreens} orphaned` : 'all active'}
          href="/screens-actions" />
      </div>

      <div className="rowgrid rowgrid--sidebar">
        <div className="stack gap-14">
          <Card
            title="Access coverage by application"
            action={<Link href="/applications" className="btn btn--ghost btn--sm">All applications <IconArrowRight /></Link>}
            padded={false}
          >
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th style={{ width: 180 }}>Users</th>
                    <th style={{ textAlign: 'right' }}>Roles</th>
                    <th style={{ textAlign: 'right' }}>Screens</th>
                    <th style={{ textAlign: 'right' }}>Last sync</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.map((c) => (
                    <tr key={c.key}>
                      <td>
                        <Link href={`/applications/${c.id}`} className="row gap-8">
                          <span className="t__primary">{c.name}</span>
                          {c.orphaned > 0 && (
                            <Badge tone="warn" plain>
                              <IconWarn width={10} height={10} /> {c.orphaned}
                            </Badge>
                          )}
                        </Link>
                      </td>
                      <td>
                        <div className="row gap-8">
                          <div className="bar" style={{ flex: 1 }}>
                            <div className="bar__fill" style={{ width: `${(c.users / maxUsers) * 100}%` }} />
                          </div>
                          <span className="tabnum small muted" style={{ minWidth: 16 }}>{c.users}</span>
                        </div>
                      </td>
                      <td className="num tabnum">{c.roles}</td>
                      <td className="num tabnum">{c.screens}</td>
                      <td className="num small muted nowrap">{formatRelative(c.lastSync)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Recent activity"
            action={<Link href="/audit-log" className="btn btn--ghost btn--sm">Audit log <IconArrowRight /></Link>}
            padded={false}
          >
            {recent.length === 0 ? (
              <EmptyState title="No activity yet" text="Authorization changes will appear here." />
            ) : (
              <div className="tablewrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th style={{ width: 168 }}>Time</th>
                      <th>Event</th>
                      <th>Entity</th>
                      <th style={{ width: 150 }}>Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((e) => (
                      <tr key={e.id} className="is-clickable">
                        <td className="nowrap small muted">
                          <Link href={`/audit-log/${e.id}`}>{formatDateTime(e.timestamp)}</Link>
                        </td>
                        <td><Link href={`/audit-log/${e.id}`}><Badge plain>{e.event_type}</Badge></Link></td>
                        <td className="truncate" style={{ maxWidth: 300 }}>
                          <Link href={`/audit-log/${e.id}`}>{e.entity_name ?? e.entity_id}</Link>
                        </td>
                        <td>
                          <Link href={`/audit-log/${e.id}`} className="row gap-8">
                            <Avatar name={e.actor_name} size="sm" />
                            <span className="truncate small">{e.actor_name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="stack gap-14">
          <Card title="Cache invalidation">
            <div className="kv">
              <span className="kv__k">permission_version</span>
              <span className="stat__value tabnum" style={{ marginTop: 2 }}>{stats.permissionVersion}</span>
            </div>
            <p className="muted small" style={{ margin: '10px 0 0' }}>
              A single monotonic counter bumped in the same transaction as any role or assignment
              change. Client SDKs re-fetch only when their cached version differs — no polling.
            </p>
          </Card>

          <Card title="Recent manifest syncs" padded={false}>
            <div style={{ padding: '4px 0' }}>
              {syncs.map((a) => (
                <Link
                  key={a.id}
                  href={`/applications/${a.id}`}
                  className="row gap-10"
                  style={{ padding: '9px 16px' }}
                >
                  <IconSync className="faint" />
                  <div className="truncate" style={{ flex: 1 }}>
                    <div className="truncate" style={{ fontWeight: 550 }}>{a.name}</div>
                    <div className="small muted mono">v{a.manifest_version}</div>
                  </div>
                  <span className="small muted nowrap">{formatRelative(a.last_sync_at)}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Platform health">
            <div className="stack gap-10">
              <HealthRow label="Orphaned screens" value={stats.orphanedScreens}
                tone={stats.orphanedScreens > 0 ? 'warn' : 'ok'} />
              <HealthRow label="Deprecated actions" value={stats.deprecatedActions}
                tone={stats.deprecatedActions > 0 ? 'warn' : 'ok'} />
              <HealthRow label="Inactive users" value={stats.usersTotal - stats.users} tone="idle" />
              <HealthRow label="Inactive roles" value={stats.rolesTotal - stats.roles} tone="idle" />
            </div>
          </Card>

          <Card title="Self-governance">
            <p className="muted small" style={{ margin: 0 }}>
              This console is registered as the <span className="mono">rbac-console</span>{' '}
              application and evaluated by the same engine it administers.
            </p>
            <div className="row gap-8 mt-14">
              <span className="small muted">Your console role</span>
              <span className="ml-auto"><Badge tone="accent">{CURRENT_USER.consoleRole}</Badge></span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function HealthRow({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'idle' }) {
  return (
    <div className="row gap-10">
      <span className="small">{label}</span>
      <span className="ml-auto">
        {value === 0 ? <Badge tone="ok" dot>None</Badge> : <Badge tone={tone} dot>{value}</Badge>}
      </span>
    </div>
  );
}
