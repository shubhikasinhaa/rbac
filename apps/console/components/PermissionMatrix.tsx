'use client';

import { useMemo, useState } from 'react';
import type { Action, ResourceNode, TriState } from '@compass/rbac-contracts';
import { Checkbox, StatusBadge } from './ui';
import { IconChevronRight, IconChevronDown } from './icons';

export interface MatrixRow {
  node: ResourceNode;
  depth: number;
  hasChildren: boolean;
  /** Every descendant id — drives tri-state roll-up and subtree cascade. */
  descendants: string[];
}

/** Depth-first rows, honouring which parents are currently expanded. */
export function buildRows(nodes: ResourceNode[], expanded: Set<string>, depth = 0): MatrixRow[] {
  const out: MatrixRow[] = [];
  for (const node of nodes) {
    out.push({ node, depth, hasChildren: node.children.length > 0, descendants: collectIds(node.children) });
    if (node.children.length && expanded.has(node.id)) {
      out.push(...buildRows(node.children, expanded, depth + 1));
    }
  }
  return out;
}

function collectIds(nodes: ResourceNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    out.push(n.id);
    out.push(...collectIds(n.children));
  }
  return out;
}

function collectParents(nodes: ResourceNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.children.length) {
      out.push(n.id);
      out.push(...collectParents(n.children));
    }
  }
  return out;
}

/**
 * Screens × actions permission grid — the one genuinely hard piece of UI.
 *
 * A cell is checked when the role grants permission(resource, action). Parent
 * rows roll their descendants up into a tri-state:
 *   every descendant granted -> full    (clicking clears the whole subtree)
 *   some granted             -> partial (clicking grants the whole subtree)
 *   none granted             -> none    (clicking grants the whole subtree)
 *
 * Pairs the manifest never declared render disabled, so an administrator cannot
 * invent a permission the application does not implement.
 */
export function PermissionMatrix({
  tree, actions, granted, permissionLookup, onChange, readOnly = false,
}: {
  tree: ResourceNode[];
  actions: Action[];
  granted: Set<string>;
  permissionLookup: (resourceId: string, actionId: string) => string | undefined;
  onChange: (next: Set<string>) => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(tree.filter((n) => n.children.length).map((n) => n.id)),
  );

  const rows = useMemo(() => buildRows(tree, expanded), [tree, expanded]);
  const allParentIds = useMemo(() => collectParents(tree), [tree]);
  const allResourceIds = useMemo(
    () => [...new Set(tree.map((t) => t.id).concat(collectIds(tree)))],
    [tree],
  );

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const stateFor = (row: MatrixRow, action: Action): TriState | 'unavailable' => {
    const perms = [row.node.id, ...row.descendants]
      .map((rid) => permissionLookup(rid, action.id))
      .filter(Boolean) as string[];
    if (perms.length === 0) return 'unavailable';
    const on = perms.filter((p) => granted.has(p)).length;
    return on === 0 ? 'none' : on === perms.length ? 'full' : 'partial';
  };

  const setSubtree = (row: MatrixRow, action: Action, grant: boolean) => {
    const next = new Set(granted);
    for (const rid of [row.node.id, ...row.descendants]) {
      const pid = permissionLookup(rid, action.id);
      if (!pid) continue;
      if (grant) next.add(pid); else next.delete(pid);
    }
    onChange(next);
  };

  const columnState = (action: Action): TriState => {
    const perms = allResourceIds
      .map((rid) => permissionLookup(rid, action.id))
      .filter(Boolean) as string[];
    if (perms.length === 0) return 'none';
    const on = perms.filter((p) => granted.has(p)).length;
    return on === 0 ? 'none' : on === perms.length ? 'full' : 'partial';
  };

  const setColumn = (action: Action, grant: boolean) => {
    const next = new Set(granted);
    for (const rid of allResourceIds) {
      const pid = permissionLookup(rid, action.id);
      if (!pid) continue;
      if (grant) next.add(pid); else next.delete(pid);
    }
    onChange(next);
  };

  const selectAll = () => {
    const next = new Set<string>();
    for (const rid of allResourceIds) {
      for (const a of actions) {
        const pid = permissionLookup(rid, a.id);
        if (pid) next.add(pid);
      }
    }
    onChange(next);
  };

  return (
    <>
      <div className="row gap-10 mb-14 wrap">
        <span className="small muted" style={{ fontWeight: 600 }}>Bulk Actions:</span>
        <div className="row gap-6">
          <button className="btn btn--sm" disabled={readOnly} onClick={selectAll}>Select All</button>
          <button className="btn btn--sm" disabled={readOnly} onClick={() => onChange(new Set())}>Deselect All</button>
        </div>
        <span className="faint">·</span>
        <div className="row gap-6">
          <button className="btn btn--sm" onClick={() => setExpanded(new Set(allParentIds))}>Expand All</button>
          <button className="btn btn--sm" onClick={() => setExpanded(new Set())}>Collapse All</button>
        </div>
        <div className="ml-auto row gap-10 small muted wrap">
          <span className="row gap-6"><Checkbox state="on" label="Full" /> Full</span>
          <span className="row gap-6"><Checkbox state="mixed" label="Partial" /> Partial</span>
          <span className="row gap-6"><Checkbox state="off" label="None" /> None</span>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="matrix">
          <table className="matrix__t">
            <thead>
              <tr>
                <th>Screen / Resource</th>
                {actions.map((a) => {
                  const cs = columnState(a);
                  return (
                    <th key={a.id} style={{ minWidth: 78 }}>
                      <div className="matrix__colhead">
                        <span>{a.name}</span>
                        {!readOnly && (
                          <button
                            className="matrix__colbtn"
                            onClick={() => setColumn(a, cs !== 'full')}
                            title={`${cs === 'full' ? 'Clear' : 'Grant'} ${a.name} across every screen`}
                          >
                            {cs === 'full' ? 'clear' : 'all'}
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.node.id}>
                  <td>
                    <div className="matrix__screen" style={{ paddingLeft: row.depth * 20 }}>
                      {row.hasChildren ? (
                        <button
                          className="tree__toggle"
                          onClick={() => toggleExpand(row.node.id)}
                          aria-label={expanded.has(row.node.id) ? `Collapse ${row.node.name}` : `Expand ${row.node.name}`}
                          aria-expanded={expanded.has(row.node.id)}
                        >
                          {expanded.has(row.node.id) ? <IconChevronDown /> : <IconChevronRight />}
                        </button>
                      ) : (
                        <span className="tree__toggle tree__toggle--hidden" />
                      )}
                      <span className="truncate" style={{ fontWeight: row.depth === 0 ? 550 : 400 }}>
                        {row.node.name}
                      </span>
                      {row.node.status !== 'Active' && <StatusBadge status={row.node.status} />}
                    </div>
                  </td>
                  {actions.map((a) => {
                    const st = stateFor(row, a);
                    if (st === 'unavailable') {
                      return (
                        <td key={a.id}>
                          <Checkbox state="off" disabled label={`${a.name} is not declared for ${row.node.name}`} />
                        </td>
                      );
                    }
                    return (
                      <td key={a.id}>
                        <Checkbox
                          state={st === 'full' ? 'on' : st === 'partial' ? 'mixed' : 'off'}
                          disabled={readOnly}
                          label={`${a.name} on ${row.node.name}`}
                          onToggle={() => setSubtree(row, a, st !== 'full')}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
