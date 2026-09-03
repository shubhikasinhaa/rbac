'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getUser, getUserRoles, getUserActivity, getMyPermissions,
  listApplications, getApplicationByKey,
} from '../../../lib/api-client';
import { formatDate, formatDateTime, pluralise } from '../../../lib/format';
import {
  PageHead, Card, StatusBadge, Badge, Avatar, Tabs, EmptyState,
  Notice, useDemoNotice, Select, Chip,
} from '../../../components/ui';
import { IconExternal, IconArrowRight } from '../../../components/icons';

type Tab = 'roles' | 'activity' | 'snapshot';

export default function UserDetailView({ id }: { id: string }) {
  const router = useRouter();
  const user = getUser(id);
  const [tab, setTab] = useState<Tab>('roles');
  const { notice, prompt } = useDemoNotice();

  const grouped = useMemo(() => (user ? getUserRoles(user.id) : []), [user]);
  const activity = useMemo(() => (user ? getUserActivity(user.id) : []), [user]);
  const [snapshotApp, setSnapshotApp] = useState(grouped[0]?.application_key ?? 'saarthi_fx');

  const snapshot = useMemo(
    () => (user ? getMyPermissions(user.id, snapshotApp) : null),
    [user, snapshotApp],
  );

  if (!user) return <EmptyState title="User not found" text="They may have been removed from the mirror." />;

  return (
    <>
      <PageHead crumbs={[{ label: 'Users', href: '/users' }, { label: user.name }]} title={user.name} />

      <Card>
        <div className="row gap-14 wrap">
          <Avatar name={user.name} size="lg" />
          <div>
            <h2 style={{ fontSize: 17 }}>{user.name}</h2>
            <div className="muted">{user.email}</div>
            <div className="row gap-8 mt-8 wrap">
              <StatusBadge status={user.status} />
              <Badge plain>{pluralise(user.application_count, 'application')}</Badge>
              <Badge plain>{pluralise(user.role_count, 'role')}</Badge>
            </div>
          </div>
          <div className="ml-auto row gap-8">
            <button className="btn" onClick={() => prompt('Edit user')}>Edit User</button>
          </div>
        </div>

        <div className="rowgrid rowgrid--3 mt-18">
          <div className="kv">
            <span className="kv__k">External ID (IdP sub)</span>
            <span className="kv__v mono small" style={{ wordBreak: 'break-all' }}>{user.external_id}</span>
          </div>
          <div className="kv">
            <span className="kv__k">Last Login</span>
            <span className="kv__v">{user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}</span>
          </div>
          <div className="kv">
            <span className="kv__k">Mirrored Since</span>
            <span className="kv__v">{formatDate(user.created_at)}</span>
          </div>
        </div>
      </Card>

      {user.status === 'Inactive' && (
        <div className="mt-14">
          <Notice tone="warn">
            This user is <b>Inactive</b>. Their runtime permission snapshot resolves to an empty
            set, but their assignments are retained so access can be restored exactly as it was.
          </Notice>
        </div>
      )}

      <div className="mt-18">
        <Tabs<Tab>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'roles', label: 'Applications & Roles', count: grouped.length },
            { id: 'activity', label: 'Activity', count: activity.length },
            { id: 'snapshot', label: 'Effective Permissions' },
          ]}
        />
      </div>

      {tab === 'roles' && (
        grouped.length === 0 ? (
          <Card>
            <EmptyState
              title="No roles assigned"
              text="This user holds no roles yet, so every application resolves to an empty permission set."
              action={<Link href="/assignments" className="btn btn--primary">Assign a role</Link>}
            />
          </Card>
        ) : (
          <Card padded={false}>
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th style={{ width: 260 }}>Application</th>
                    <th>Roles</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g) => {
                    const app = getApplicationByKey(g.application_key);
                    return (
                      <tr key={g.application_key} className="is-clickable" onClick={() => app && router.push(`/applications/${app.id}`)}>
                        <td>
                          <div className="row gap-8">
                            <span className="t__primary">{g.application_name}</span>
                            {g.application_status !== 'Active' && <StatusBadge status={g.application_status} />}
                          </div>
                          <Chip>{g.application_key}</Chip>
                        </td>
                        <td>
                          <div className="row gap-6 wrap">
                            {g.roles.map((r) => (
                              <Link key={r.id} href={`/roles/${r.id}`} onClick={(e) => e.stopPropagation()}>
                                <Badge tone={r.status === 'Active' ? 'neutral' : 'idle'} plain>
                                  {r.name}
                                  <span className="faint" style={{ marginLeft: 5 }}>{r.permission_count}</span>
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </td>
                        <td className="num"><IconExternal className="faint" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {tab === 'activity' && (
        <Card padded={false}>
          {activity.length === 0 ? (
            <EmptyState title="No recorded activity" text="Audit events involving this user will appear here." />
          ) : (
            <div className="tablewrap">
              <table className="t">
                <thead>
                  <tr>
                    <th style={{ width: 170 }}>Time</th>
                    <th style={{ width: 160 }}>Event</th>
                    <th>Entity</th>
                    <th style={{ width: 150 }}>Actor</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {activity.map((e) => (
                    <tr key={e.id} className="is-clickable" onClick={() => router.push(`/audit-log/${e.id}`)}>
                      <td className="nowrap small muted">{formatDateTime(e.timestamp)}</td>
                      <td><Badge plain>{e.event_type}</Badge></td>
                      <td className="truncate" style={{ maxWidth: 320 }}>{e.entity_name ?? e.entity_id}</td>
                      <td className="small">{e.actor_name}</td>
                      <td className="num"><IconExternal className="faint" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'snapshot' && snapshot && (
        <div className="stack gap-14">
          <Notice tone="accent">
            Exactly what <span className="mono">GET /v1/me/permissions?app={snapshotApp}</span>{' '}
            returns for this user — the union of their active roles in that one application. A
            consuming app fetches this once per session and caches it against{' '}
            <span className="mono">version</span>.
          </Notice>

          <div className="filters">
            <div className="field" style={{ minWidth: 260 }}>
              <span className="field__label">Application</span>
              <Select
                value={snapshotApp}
                onChange={setSnapshotApp}
                ariaLabel="Select application"
                options={listApplications().map((a) => ({ value: a.app_key, label: a.name }))}
              />
            </div>
          </div>

          <div className="rowgrid rowgrid--2">
            <Card title={`Permissions (${snapshot.permissions.length})`}>
              {snapshot.permissions.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>
                  Empty snapshot — this user holds no active role in this application.
                </p>
              ) : (
                <div className="row gap-6 wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {snapshot.permissions.map((p) => <Chip key={p}>{p}</Chip>)}
                </div>
              )}
            </Card>

            <Card title={`Menu tree (${snapshot.menu.length} root)`}>
              <div className="row gap-6 wrap mb-14">
                <span className="small muted">Roles:</span>
                {snapshot.roles.length === 0
                  ? <span className="faint small">none</span>
                  : snapshot.roles.map((r) => <Badge key={r} plain>{r}</Badge>)}
              </div>
              {snapshot.menu.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>No accessible screens.</p>
              ) : (
                <pre className="json" style={{ maxHeight: 260 }}>{renderMenu(snapshot.menu)}</pre>
              )}
            </Card>
          </div>
        </div>
      )}
      {notice}
    </>
  );
}

function renderMenu(nodes: { key: string; name: string; children: unknown[] }[], depth = 0): string {
  return nodes
    .map((n) => {
      const pad = '  '.repeat(depth);
      const kids = (n.children as typeof nodes).length
        ? '\n' + renderMenu(n.children as typeof nodes, depth + 1)
        : '';
      return `${pad}${depth > 0 ? '└─ ' : ''}${n.name}  ${n.key}${kids}`;
    })
    .join('\n');
}
