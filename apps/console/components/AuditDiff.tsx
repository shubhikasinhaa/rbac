'use client';

import { useState } from 'react';

type Snapshot = Record<string, unknown> | null;

function parse(raw: string | null): Snapshot {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : { value: v };
  } catch {
    return { value: raw };
  }
}

/** Re-indent a compact stored JSON snapshot for the raw view. */
function pretty(raw: string | null): string {
  if (!raw) return '';
  try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
}

function display(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * Side-by-side before/after view. Fields present in both are compared and
 * highlighted when they differ; a create shows no Before, a delete no After.
 */
export function AuditDiff({ before, after }: { before: string | null; after: string | null }) {
  const [raw, setRaw] = useState(false);
  const b = parse(before);
  const a = parse(after);

  const keys = [...new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})])];
  const changed = (k: string) => b && a && display(b[k]) !== display(a[k]);
  const changedCount = keys.filter(changed).length;

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">Changes</h2>
        {b && a && (
          <span className="small muted">
            {changedCount === 0 ? 'No field differences' : `${changedCount} field${changedCount === 1 ? '' : 's'} changed`}
          </span>
        )}
        <button className="btn btn--sm ml-auto" onClick={() => setRaw((r) => !r)}>
          {raw ? 'View Changes' : 'View Changes (Detailed)'}
        </button>
      </header>

      {raw ? (
        <div className="card__body">
          <div className="rowgrid rowgrid--2">
            <div>
              <div className="kv__k mb-8">Before</div>
              {before ? <pre className="json">{pretty(before)}</pre> : <div className="diff__empty">No prior state — this event created the entity.</div>}
            </div>
            <div>
              <div className="kv__k mb-8">After</div>
              {after ? <pre className="json">{pretty(after)}</pre> : <div className="diff__empty">No resulting state — this event deleted the entity.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="diff">
          <div className="diff__col">
            <div className="diff__head">Before</div>
            <div className="diff__body">
              {!b ? (
                <div className="diff__empty">No prior state — this event created the entity.</div>
              ) : (
                keys.map((k) => (
                  <div key={k} className={changed(k) ? 'diff__row diff__row--changed' : 'diff__row'}>
                    <span className="diff__key">{k}</span>
                    <span className="diff__val">{display(b[k])}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="diff__col">
            <div className="diff__head">After</div>
            <div className="diff__body">
              {!a ? (
                <div className="diff__empty">No resulting state — this event deleted the entity.</div>
              ) : (
                keys.map((k) => (
                  <div key={k} className={changed(k) ? 'diff__row diff__row--changed' : 'diff__row'}>
                    <span className="diff__key">{k}</span>
                    <span className="diff__val">{display(a[k])}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
