'use client';

import { useState } from 'react';
import {
  getSettings, listApplications, getDashboardStats,
} from '../../lib/api-client';
import {
  PageHead, Card, Tabs, StatusBadge, Chip, Badge, Select, Field,
  Notice, useDemoNotice, TableCard, EmptyState,
} from '../../components/ui';
import { IconPlus } from '../../components/icons';
import { STANDARD_ACTION_CATALOGUE } from '../../lib/action-catalogue';

type Tab = 'actions' | 'system';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('actions');
  const settings = getSettings();
  const stats = getDashboardStats();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.setting_key, s.setting_value])),
  );
  const { notice, prompt } = useDemoNotice();

  const dirty = settings.some((s) => values[s.setting_key] !== s.setting_value);

  return (
    <>
      <PageHead
        title="Settings"
        subtitle="Global defaults applied to newly registered applications, and platform-wide configuration."
      />

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'actions', label: 'Actions', count: STANDARD_ACTION_CATALOGUE.length },
          { id: 'system', label: 'System Settings' },
        ]}
      />

      {tab === 'actions' && (
        <div className="stack gap-14">
          <Notice>
            These are the <b>default actions</b> created for every newly registered application.
            Changing them does not retroactively alter actions an existing application has already
            synced — an application's live catalogue always comes from its own manifest.
          </Notice>

          <TableCard
            rows={STANDARD_ACTION_CATALOGUE}
            rowKey={(a) => a.key}
            toolbar={
              <div className="row gap-10" style={{ flex: 1 }}>
                <h2 className="card__title">Global Default Actions</h2>
                <button className="btn btn--sm ml-auto" onClick={() => prompt('Add default action')}>
                  <IconPlus /> Add Action
                </button>
              </div>
            }
            empty={<EmptyState title="No default actions" />}
            columns={[
              { key: 'name', header: 'Action Name', render: (a) => <span className="t__primary">{a.name}</span> },
              { key: 'key', header: 'Action Key', render: (a) => <Chip>{a.key}</Chip>, nowrap: true },
              { key: 'desc', header: 'Description', render: (a) => <span className="muted">{a.description}</span> },
              { key: 'status', header: 'Status', render: () => <StatusBadge status="Active" />, nowrap: true },
            ]}
          />
        </div>
      )}

      {tab === 'system' && (
        <div className="rowgrid rowgrid--sidebar">
          <Card
            title="System Settings"
            action={
              <>
                <button className="btn btn--sm" disabled={!dirty}
                  onClick={() => setValues(Object.fromEntries(settings.map((s) => [s.setting_key, s.setting_value])))}>
                  Reset
                </button>
                <button className="btn btn--primary btn--sm" disabled={!dirty} onClick={() => prompt('Save settings')}>
                  Save Settings
                </button>
              </>
            }
          >
            <div className="stack gap-14">
              {settings.map((s) => (
                <div key={s.setting_key} className="row gap-14" style={{ alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 550 }}>{s.label}</div>
                    <div className="small faint mono">{s.setting_key}</div>
                  </div>
                  <div style={{ width: 190 }}>
                    <Select
                      value={values[s.setting_key]}
                      onChange={(v) => setValues((prev) => ({ ...prev, [s.setting_key]: v }))}
                      ariaLabel={s.label}
                      options={s.options.map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-18">
              <Notice tone="warn">
                <b>Password Policy</b> and <b>Hybrid Access Key</b> appear in the approved wireframe,
                but authentication is owned entirely by the enterprise Identity Provider and RBAC
                stores no credentials. Their intended behaviour is not defined in the project
                documentation and needs Product Owner confirmation before implementation.
              </Notice>
            </div>
          </Card>

          <div className="stack gap-14">
            <Card title="Audit retention">
              <div className="kv">
                <span className="kv__k">Current setting</span>
                <span className="stat__value tabnum" style={{ marginTop: 2 }}>
                  {values.audit_log_retention}<span className="muted" style={{ fontSize: 13, fontWeight: 400 }}> days</span>
                </span>
              </div>
              <p className="muted small" style={{ margin: '10px 0 0' }}>
                Retention drives a separately controlled purge process. It never enables manual
                deletion of audit records — those stay immutable.
              </p>
            </Card>

            <Card title="Sync cadence">
              <div className="kv">
                <span className="kv__k">Manifest sync interval</span>
                <span className="stat__value tabnum" style={{ marginTop: 2 }}>
                  {values.manifest_sync_interval}<span className="muted" style={{ fontSize: 13, fontWeight: 400 }}> hrs</span>
                </span>
              </div>
              <p className="muted small" style={{ margin: '10px 0 0' }}>
                Applications also push their manifest on every deploy. This interval only governs
                the platform's own scheduled re-fetch.
              </p>
            </Card>

            <Card title="Registered applications">
              <div className="stack gap-10">
                {listApplications().slice(0, 4).map((a) => (
                  <div key={a.id} className="row gap-10">
                    <span className="small truncate">{a.name}</span>
                    <span className="ml-auto"><Badge plain>{a.total_actions} actions</Badge></span>
                  </div>
                ))}
                <div className="row gap-10 mt-8">
                  <span className="small muted">Total permissions</span>
                  <span className="ml-auto tabnum small">{stats.permissions.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      {notice}
    </>
  );
}
