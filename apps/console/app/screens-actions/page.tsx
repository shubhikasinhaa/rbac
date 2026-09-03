'use client';

import { useMemo, useState } from 'react';
import {
  listApplications, getResourceTree, flattenTree, listActions, listPermissions,
} from '../../lib/api-client';
import { matches, pluralise } from '../../lib/format';
import {
  PageHead, Card, Tabs, SearchInput, Select, StatusBadge, Chip, Badge,
  EmptyState, Modal, Notice, useDemoNotice, TableCard, ResultCount, Stat,
} from '../../components/ui';
import { ResourceTree, useTreeExpansion } from '../../components/ResourceTree';
import { IconTree, IconPlus } from '../../components/icons';

type Tab = 'screens' | 'actions';

export default function ScreensActionsPage() {
  const apps = listApplications();
  const [appId, setAppId] = useState(apps[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('screens');
  const [query, setQuery] = useState('');
  const [showTree, setShowTree] = useState(false);
  const { notice, prompt } = useDemoNotice();

  const app = apps.find((a) => a.id === appId);
  const tree = useMemo(() => (app ? getResourceTree(app.id) : []), [app]);
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const actions = useMemo(() => (app ? listActions(app.id) : []), [app]);
  const permissions = useMemo(() => (app ? listPermissions(app.app_key) : []), [app]);

  const { expanded, toggle, expandAll, collapseAll } = useTreeExpansion(
    tree.filter((n) => n.children.length).map((n) => n.id),
  );

  const filteredActions = actions.filter((a) => matches(query, a.name, a.action_key, a.description));

  return (
    <>
      <PageHead
        title="Screens & Actions"
        subtitle="The permission surface each application declares. Read-mostly — this catalogue is populated by manifest sync, not by hand."
      />

      <div className="filters mb-18">
        <div className="field" style={{ minWidth: 260 }}>
          <span className="field__label">Application</span>
          <Select
            value={appId}
            onChange={(v) => { setAppId(v); setQuery(''); }}
            ariaLabel="Select application"
            options={apps.map((a) => ({ value: a.id, label: a.name }))}
          />
        </div>
      </div>

      {app && (
        <>
          <div className="stats stats--4">
            <Stat label="Screens" value={flat.filter((r) => r.status === 'Active').length}
              hint={`${flat.length} declared`} />
            <Stat label="Actions" value={actions.filter((a) => a.status === 'Active').length}
              hint={`${actions.filter((a) => a.is_custom).length} custom`} />
            <Stat label="Permissions" value={permissions.length} hint="screen × action pairs" />
            <Stat label="Manifest" value={app.manifest_version ?? '—'} small
              hint={app.orphaned_screens > 0 ? `${app.orphaned_screens} orphaned` : 'clean'} />
          </div>

          <Tabs<Tab>
            active={tab}
            onChange={(t) => { setTab(t); setQuery(''); }}
            tabs={[
              { id: 'screens', label: 'Screens (Resource)', count: flat.length },
              { id: 'actions', label: 'Actions', count: actions.length },
            ]}
          />

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
                    {pluralise(app.orphaned_screens, 'screen')} dropped from the manifest but still
                    granted by a role — flagged <b>Orphaned</b>, never hard-deleted.
                  </Notice>
                </div>
              )}
              {flat.length === 0
                ? <EmptyState title="No screens declared" text="This application has not synced a manifest yet." />
                : <ResourceTree nodes={tree} expanded={expanded} onToggle={toggle} filter={query} />}
            </Card>
          )}

          {tab === 'actions' && (
            <TableCard
              rows={filteredActions}
              rowKey={(a) => a.id}
              toolbar={
                <div className="row gap-10" style={{ flex: 1 }}>
                  <div style={{ width: 280 }}>
                    <SearchInput value={query} onChange={setQuery} placeholder="Search actions…" />
                  </div>
                  <ResultCount shown={filteredActions.length} total={actions.length} noun="actions" />
                  <button className="btn btn--sm ml-auto" onClick={() => prompt('Add custom action')}>
                    <IconPlus /> Add Custom Action
                  </button>
                </div>
              }
              empty={<EmptyState title="No actions match" text="Try a different search term." />}
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
        </>
      )}

      {showTree && app && (
        <Modal title={`${app.name} — screen tree`} size="lg" onClose={() => setShowTree(false)}>
          <Outline nodes={tree} />
        </Modal>
      )}
      {notice}
    </>
  );
}

function Outline({ nodes, depth = 0 }: { nodes: ReturnType<typeof getResourceTree>; depth?: number }) {
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
          {n.children.length > 0 && <Outline nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
