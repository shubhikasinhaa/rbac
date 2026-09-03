'use client';

import { useState } from 'react';
import type { ResourceNode } from '@compass/rbac-contracts';
import { IconChevronRight, IconChevronDown } from './icons';
import { StatusBadge, Chip } from './ui';

/**
 * Recursive screen tree. Rows keep their table alignment at any depth by
 * indenting only the name cell, so Level and Status stay in their columns.
 */
export function ResourceTree({
  nodes, expanded, onToggle, filter,
}: {
  nodes: ResourceNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  filter?: string;
}) {
  return (
    <div>
      <div className="tree__row" style={{ background: 'var(--bg-subtle)', fontWeight: 600, fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        <span>Screen / Resource</span>
        <span>Resource Key</span>
        <span>Level</span>
        <span>Status</span>
      </div>
      {nodes.map((n) => (
        <TreeRow key={n.id} node={n} depth={0} expanded={expanded} onToggle={onToggle} filter={filter} />
      ))}
    </div>
  );
}

function TreeRow({
  node, depth, expanded, onToggle, filter,
}: {
  node: ResourceNode; depth: number;
  expanded: Set<string>; onToggle: (id: string) => void; filter?: string;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  // With a search term active, keep any branch that contains a match.
  const q = filter?.trim().toLowerCase() ?? '';
  const selfMatch = !q || node.name.toLowerCase().includes(q) || node.resource_key.toLowerCase().includes(q);
  const descendantMatch = q ? containsMatch(node, q) : false;
  if (q && !selfMatch && !descendantMatch) return null;
  const showChildren = hasChildren && (isOpen || (q ? descendantMatch : false));

  return (
    <>
      <div className="tree__row">
        <div className="tree__name" style={{ paddingLeft: depth * 20 }}>
          {hasChildren ? (
            <button
              className="tree__toggle"
              onClick={() => onToggle(node.id)}
              aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
              aria-expanded={isOpen}
            >
              {showChildren ? <IconChevronDown /> : <IconChevronRight />}
            </button>
          ) : (
            <span className="tree__toggle tree__toggle--hidden" />
          )}
          <span className="tree__label" style={{ fontWeight: depth === 0 ? 550 : 400 }}>
            {node.name}
          </span>
        </div>
        <span><Chip>{node.resource_key}</Chip></span>
        <span><span className="level">{node.level}</span></span>
        <span><StatusBadge status={node.status} /></span>
      </div>
      {showChildren &&
        node.children.map((c) => (
          <TreeRow key={c.id} node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} filter={filter} />
        ))}
    </>
  );
}

function containsMatch(node: ResourceNode, q: string): boolean {
  return node.children.some(
    (c) => c.name.toLowerCase().includes(q) || c.resource_key.toLowerCase().includes(q) || containsMatch(c, q),
  );
}

/** Collapse/expand helper shared by the tree views. */
export function useTreeExpansion(initial: string[] = []) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initial));
  return {
    expanded,
    toggle: (id: string) =>
      setExpanded((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    expandAll: (ids: string[]) => setExpanded(new Set(ids)),
    collapseAll: () => setExpanded(new Set()),
  };
}
