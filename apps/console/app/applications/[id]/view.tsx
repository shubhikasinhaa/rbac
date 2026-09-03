'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getApplication, getResourceTree, flattenTree,
  listActions, listRoles, listAssignments, listAuditLogs,
} from '../../../lib/api-client';
import { formatDateTime, formatRelative, matches, pluralise } from '../../../lib/format';
import {
  PageHead, Card, Stat, StatusBadge, Chip, Badge, Avatar, Tabs, SearchInput,
  EmptyState, Modal, Notice, useDemoNotice, TableCard, ResultCount, Field,
} from '../../../components/ui';
import { ResourceTree, useTreeExpansion } from '../../../components/ResourceTree';
import {
  IconSync, IconTree, IconPlus, IconWarn, IconKey, IconArrowRight, IconExternal,
} from '../../../components/icons';

type Tab = 'overview' | 'screens' | 'actions' | 'roles' | 'users' | 'history';

export default function ApplicationDetailView({ id }: { id: string }) {
  const router = useRouter();
  const app = getApplication(id);
  const [tab, setTab] = useState<Tab>('overview');
  const [showTree, setShowTree] = useState(false);
  const [query, setQuery] = useState('');
  const { notice, prompt } = useDemoNotice();

  const tree = useMemo(() => (app ? getResourceTree(app.id) : []), [app]);
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const actions = useMemo(() => (app ? listActions(app.id) : []), [app]);
  const roles = useMemo(() => (app ? listRoles(app.id) : []), [app]);
  const assignments = useMemo(
    () => (app ? listAssignments().filter((x) => x.application_key === app.app_key) : []),
    [app],
  );
  const history = useMemo(
    () => (app ? listAuditLogs().filter((e) => e.application_key === app.app_key && e.entity_type === 'Manifest') : []),
    [app],
  );

  const { expanded, toggle, expandAll, collapseAll } = useTreeExpansion(
    tree.filter((n) => n.children.length).map((n) => n.id),
  );

  if (!app) {
    return <EmptyState title="Application not found" text="It may have been removed from the registry." />;
  }

  const users = new Map(assignments.map((a) => [a.user_id, a])).size;

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Applications', href: '/applications' }, { label: app.name }]}
        title={app.name}
        badge={<StatusBadge status={app.status} />}
        subtitle={<>Owner: {app.owner ?? '—'} · <Chip>{app.app_key}</Chip></>}
        actions={
          <>
            <button className="btn" onClick={() => prompt('Sync manifest')}>
              <IconSync /> Sync Now
            </button>
            <button className="btn" onClick={() => prompt('Edit application')}>Edit</button>
          </>
        }
      />

      <div className="stats stats--5">
        <Stat label="Version (Manifest)" value={app.manifest_version ?? '—'} small
          hint={app.last_sync_at ? formatRelative(app.last_sync_at) : 'Never synced'} />
        <Stat label="Last Sync" value={app.last_sync_at ? formatDateTime(app.last_sync_at) : 'Never'} small />
        <Stat label="Total Screens" value={app.total_screens}
          hint={app.orphaned_screens > 0 ? `${app.orphaned_screens} orphaned` : 'all active'} />
        <Stat label="Total Actions" value={app.total_actions}
          hint={`${actions.filter((a) => a.is_custom).length} custom`} />
        <Stat label="Total Roles" value={app.total_roles} hint={pluralise(users, 'user')} />
      </div>

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'screens', label: 'Screens', count: flat.length },
          { id: 'actions', label: 'Actions', count: actions.length },
          { id: 'roles', label: 'Roles', count: roles.length },
          { id: 'users', label: 'Users', count: users },
          { id: 'history', label: 'Manifest History', count: history.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="rowgrid rowgrid--2">
          <Card title="About this Application">
            <p style={{ margin: 0, color: 'var(--ink-secondary)' }}>{app.description}</p>
            <div className="rowgrid rowgrid--2 mt-18">
              <div className="kv"><span className="kv__k">Owner</span><span className="kv__v">{app.owner ?? '—'}</span></div>
              <div className="kv"><span className="kv__k">Registered</span><span className="kv__v">{formatDateTime(app.created_at)}</span></div>
            </div>
          </Card>

          <Card title="Manifest Endpoint">
            <div className="kv">
              <span className="kv__k">Endpoint</span>
              <span className="kv__v mono small" style={{ wordBreak: 'break-all' }}>{app.manifest_endpoint}</span>
            </div>
            <div className="kv mt-14">
              <span className="kv__k">Last Fetched</span>
              <span className="kv__v">{formatDateTime(app.last_sync_at)}</span>
            </div>
            <div className="kv mt-14">
              <span className="kv__k">Client ID</span>
              <span className="kv__v mono small">{app.client_id}</span>
            </div>
            <div className="mt-14">
              <Notice>
                <IconKey width={13} height={13} style={{ display: 'none' }} />
                The <b>client_secret</b> is stored as a bcrypt hash and was shown only at
                registration. Rotate it if it is ever lost.
              </Notice>
            </div>
          </Card>
        </div>
      )}

      {tab === 'screens' && (
        <Card
          padded={false}
          title={
            <div className="row gap-10" style={{ flex: 1 }}>
              <div style={{ width: 280 }}>
                <SearchInput value={query} onChange={setQuery} placeholder="Search screens…" />
              </div>
              <ResultCount shown={flat.length} total={flat.length} noun="screens" />
              <div className="ml-auto row gap-6">
                <button className="btn btn--sm" onClick={() => expandAll(flat.filter((n) => n.children.length).map((n) => n.id))}>Expand All</button>
                <button className="btn btn--sm" onClick={collapseAll}>Collapse All</button>
                <button className="btn btn--sm" onClick={() => setShowTree(true)}><IconTree /> View Tree</button>
              </div>
            </div>
          }
        >
          {app.orphaned_screens > 0 && (
            <div style={{ padding: '12px 14px 0' }}>
              <Notice tone="warn">
                {pluralise(app.orphaned_screens, 'screen')} no longer declared in the manifest but
                still referenced by a role. Flagged <b>Orphaned</b> rather than deleted, so no
                grant was silently removed.
              </Notice>
            </div>
          )}
          <ResourceTree nodes={tree} expanded={expanded} onToggle={toggle} filter={query} />
        </Card>
      )}

      {tab === 'actions' && (
        <TableCard
          rows={actions.filter((a) => matches(query, a.name, a.action_key, a.description))}
          rowKey={(a) => a.id}
          toolbar={
            <div className="row gap-10" style={{ flex: 1 }}>
              <div style={{ width: 280 }}>
                <SearchInput value={query} onChange={setQuery} placeholder="Search actions…" />
              </div>
              <ResultCount shown={actions.length} total={actions.length} noun="actions" />
              <button className="btn btn--sm ml-auto" onClick={() => prompt('Add custom action')}>
                <IconPlus /> Add Custom Action
              </button>
            </div>
          }
          empty={<EmptyState title="No actions" text="Actions arrive with this application's manifest." />}
          columns={[
            {
              key: 'name', header: 'Action Name',
              render: (a) => (
                <div className="row gap-8">
                  <span className="t__primary">{a.name}</span>
                  {a.is_custom && <Badge tone="accent" plain>Custom</Badge>}
                </div>
              ),
            },
            { key: 'key', header: 'Action Key', render: (a) => <Chip>{a.action_key}</Chip>, nowrap: true },
            { key: 'desc', header: 'Description', render: (a) => <span className="muted">{a.description}</span> },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} />, nowrap: true },
          ]}
        />
      )}

      {tab === 'roles' && (
        <TableCard
          rows={roles}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/roles/${r.id}`)}
          toolbar={
            <div className="row gap-10" style={{ flex: 1 }}>
              <ResultCount shown={roles.length} total={roles.length} noun="roles" />
              <Link href="/roles" className="btn btn--sm ml-auto">All roles <IconArrowRight /></Link>
            </div>
          }
          empty={<EmptyState title="No roles yet" text="Create a role to start granting access to this application." />}
          columns={[
            { key: 'name', header: 'Role Name', render: (r) => <span className="t__primary">{r.name}</span> },
            { key: 'desc', header: 'Description', render: (r) => <span className="muted">{r.description}</span> },
            { key: 'users', header: 'Users', align: 'right', render: (r) => <span className="tabnum">{r.user_count}</span> },
            { key: 'perms', header: 'Permissions', align: 'right', render: (r) => <span className="tabnum">{r.permission_count}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, nowrap: true },
          ]}
        />
      )}

      {tab === 'users' && (
        <TableCard
          rows={assignments}
          rowKey={(a) => a.id}
          onRowClick={(a) => router.push(`/users/${a.user_id}`)}
          toolbar={<ResultCount shown={assignments.length} total={assignments.length} noun="assignments" />}
          empty={<EmptyState title="No users assigned" text="Assign a role to give someone access to this application." />}
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
            { key: 'role', header: 'Role', render: (a) => <Badge plain>{a.role_name}</Badge>, nowrap: true },
            { key: 'on', header: 'Assigned On', render: (a) => <span className="small muted">{formatDateTime(a.assigned_at)}</span>, nowrap: true },
            { key: 'by', header: 'Assigned By', render: (a) => <span className="small">{a.assigned_by_name}</span>, nowrap: true },
          ]}
        />
      )}

      {tab === 'history' && (
        <TableCard
          rows={history}
          rowKey={(e) => e.id}
          onRowClick={(e) => router.push(`/audit-log/${e.id}`)}
          toolbar={<ResultCount shown={history.length} total={history.length} noun="syncs" />}
          empty={<EmptyState title="No sync history" text="Manifest syncs for this application will be listed here." />}
          columns={[
            { key: 'time', header: 'Time', render: (e) => <span className="small muted">{formatDateTime(e.timestamp)}</span>, nowrap: true },
            { key: 'event', header: 'Event', render: (e) => <Badge plain>{e.event_type}</Badge>, nowrap: true },
            { key: 'details', header: 'Details', render: (e) => <span className="muted">{e.details}</span> },
            {
              key: 'actor', header: 'Actor',
              render: (e) => (
                <div className="row gap-8"><Avatar name={e.actor_name} size="sm" /><span className="small">{e.actor_name}</span></div>
              ),
              nowrap: true,
            },
            { key: 'go', header: '', align: 'right', render: () => <IconExternal className="faint" /> },
          ]}
        />
      )}

      {showTree && (
        <Modal title={`${app.name} — screen tree`} size="lg" onClose={() => setShowTree(false)}>
          <TreeOutline nodes={tree} />
        </Modal>
      )}
      {notice}
    </>
  );
}

/** Compact indented outline used by the "View Tree" modal. */
function TreeOutline({ nodes, depth = 0 }: { nodes: ReturnType<typeof getResourceTree>; depth?: number }) {
  return (
    <div className="stack">
      {nodes.map((n) => (
        <div key={n.id}>
          <div className="row gap-8" style={{ padding: '4px 0', paddingLeft: depth * 22 }}>
            <span className="faint mono small">{depth > 0 ? '└─' : '•'}</span>
            <span style={{ fontWeight: depth === 0 ? 550 : 400 }}>{n.name}</span>
            <Chip>{n.resource_key}</Chip>
            {n.status !== 'Active' && <StatusBadge status={n.status} />}
          </div>
          {n.children.length > 0 && <TreeOutline nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
