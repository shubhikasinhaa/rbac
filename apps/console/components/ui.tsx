'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  IconSearch, IconClose, IconChevronRight, IconCheck,
  IconWarn, IconInfo, IconDoc,
} from './icons';
import { initials } from '../lib/format';

/* ----------------------------------------------------------------- badges -- */

type Tone = 'ok' | 'warn' | 'idle' | 'accent' | 'neutral';

const TONE_BY_STATUS: Record<string, Tone> = {
  Active: 'ok',
  Inactive: 'idle',
  Orphaned: 'warn',
  Deprecated: 'warn',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_BY_STATUS[status] ?? 'neutral';
  return <Badge tone={tone} dot>{status}</Badge>;
}

export function Badge({
  children, tone = 'neutral', dot = false, plain = false,
}: { children: ReactNode; tone?: Tone; dot?: boolean; plain?: boolean }) {
  const cls = ['badge'];
  if (tone !== 'neutral') cls.push(`badge--${tone}`);
  if (plain) cls.push('badge--plain');
  return (
    <span className={cls.join(' ')}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

export function Chip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return <span className={accent ? 'chip chip--accent' : 'chip'}>{children}</span>;
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`avatar avatar--${size}`} aria-hidden>{initials(name)}</span>;
}

/* ------------------------------------------------------------------ shell -- */

export function PageHead({
  title, subtitle, actions, badge, crumbs,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  crumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <>
      {crumbs && (
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i} className="row gap-6">
              {i > 0 && <IconChevronRight className="crumbs__sep" />}
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span className="truncate">{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="pagehead">
        <div className="pagehead__text">
          <div className="pagehead__title">
            <h1>{title}</h1>
            {badge}
          </div>
          {subtitle && <div className="pagehead__sub">{subtitle}</div>}
        </div>
        {actions && <div className="pagehead__actions">{actions}</div>}
      </div>
    </>
  );
}

export function Card({
  title, action, children, padded = true,
}: { title?: ReactNode; action?: ReactNode; children: ReactNode; padded?: boolean }) {
  return (
    <section className="card">
      {(title || action) && (
        <header className="card__head">
          {typeof title === 'string' ? <h2 className="card__title">{title}</h2> : title}
          {action && <div className="ml-auto row gap-6">{action}</div>}
        </header>
      )}
      {padded ? <div className="card__body">{children}</div> : children}
    </section>
  );
}

export function Stat({
  label, value, hint, small = false, href, icon,
}: {
  label: string; value: ReactNode; hint?: ReactNode;
  small?: boolean; href?: string; icon?: ReactNode;
}) {
  const body = (
    <>
      <div className="stat__label">{icon}{label}</div>
      <div className={small ? 'stat__value stat__value--sm' : 'stat__value'}>{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </>
  );
  if (href) return <Link href={href} className="stat stat--link">{body}</Link>;
  return <div className="stat">{body}</div>;
}

/* --------------------------------------------------------------- controls -- */

export function SearchInput({
  value, onChange, placeholder = 'Search…',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="search">
      <IconSearch />
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

export function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">
        {label}{required && <span className="field__req"> *</span>}
      </span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function Select({
  value, onChange, options, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel?: string;
}) {
  return (
    <select className="select" value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Checkbox({
  state, onToggle, disabled, label,
}: {
  state: 'on' | 'off' | 'mixed';
  onToggle?: () => void;
  disabled?: boolean;
  label: string;
}) {
  const cls = ['cb'];
  if (state === 'on') cls.push('cb--on');
  if (state === 'mixed') cls.push('cb--mixed');
  return (
    <button
      type="button"
      className={cls.join(' ')}
      disabled={disabled}
      onClick={onToggle}
      aria-label={label}
      aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
      role="checkbox"
      title={disabled ? 'Not declared in this application’s manifest' : label}
    >
      {state === 'on' && <IconCheck />}
    </button>
  );
}

export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={active === t.id ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- feedback -- */

export function EmptyState({
  title, text, action,
}: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__icon"><IconDoc width={22} height={22} /></div>
      <div className="empty__title">{title}</div>
      {text && <p className="empty__text">{text}</p>}
      {action && <div className="mt-14">{action}</div>}
    </div>
  );
}

export function Notice({
  children, tone = 'neutral',
}: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' }) {
  const cls = ['notice'];
  if (tone !== 'neutral') cls.push(`notice--${tone}`);
  return (
    <div className={cls.join(' ')}>
      {tone === 'warn' ? <IconWarn /> : <IconInfo />}
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ modal -- */

export function Modal({
  title, onClose, children, footer, size = 'md',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className={`modal modal--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal__head">
          <h2 className="card__title">{title}</h2>
          <button className="btn btn--ghost btn--icon modal__x" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

/**
 * Demo-only guard. The console is read-only against mock data; any mutating
 * control routes here rather than pretending to write.
 */
export function useDemoNotice() {
  const [open, setOpen] = useState<string | null>(null);
  const notice = open ? (
    <Modal
      title={open}
      size="sm"
      onClose={() => setOpen(null)}
      footer={<button className="btn btn--primary" onClick={() => setOpen(null)}>Understood</button>}
    >
      <Notice tone="accent">
        This build is a <b>frontend demo</b> running on the mock dataset in{' '}
        <span className="mono">db/rbac_mock.sql</span>. Write operations are disabled until the
        RBAC Core API is connected.
      </Notice>
      <p className="muted small mt-14" style={{ margin: '14px 0 0' }}>
        Once <span className="mono">lib/api-client.ts</span> points at the live Admin API, this
        action will issue the corresponding request and the change will be recorded in the audit log.
      </p>
    </Modal>
  ) : null;
  return { notice, prompt: setOpen };
}

/* --------------------------------------------------------------- data grid -- */

export function TableCard<T>({
  rows, columns, empty, rowKey, onRowClick, toolbar, footer,
}: {
  rows: T[];
  columns: Array<{
    key: string;
    header: ReactNode;
    render: (row: T) => ReactNode;
    align?: 'left' | 'right';
    width?: string;
    nowrap?: boolean;
  }>;
  empty: ReactNode;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="card">
      {toolbar && <div className="card__head">{toolbar}</div>}
      {rows.length === 0 ? (
        empty
      ) : (
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} style={{ width: c.width, textAlign: c.align === 'right' ? 'right' : 'left' }}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={onRowClick ? 'is-clickable' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={[c.align === 'right' ? 'num' : '', c.nowrap ? 'nowrap' : ''].filter(Boolean).join(' ')}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footer && <div className="card__foot">{footer}</div>}
    </section>
  );
}

export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <span className="muted small tabnum">
      {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
    </span>
  );
}
