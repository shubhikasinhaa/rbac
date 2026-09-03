'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconGrid, IconApps, IconLayers, IconShield, IconUsers,
  IconLink, IconClock, IconGear,
} from './icons';
import { Avatar } from './ui';
import { getDashboardStats } from '../lib/api-client';
import { CURRENT_USER } from '../lib/session';

const NAV = [
  {
    group: null,
    items: [{ href: '/', label: 'Dashboard', icon: IconGrid, count: undefined as number | undefined }],
  },
  {
    group: 'Configuration',
    items: [
      { href: '/applications', label: 'Applications', icon: IconApps, count: 'applications' as const },
      { href: '/screens-actions', label: 'Screens & Actions', icon: IconLayers, count: undefined },
      { href: '/roles', label: 'Roles', icon: IconShield, count: 'roles' as const },
    ],
  },
  {
    group: 'Access',
    items: [
      { href: '/users', label: 'Users', icon: IconUsers, count: 'users' as const },
      { href: '/assignments', label: 'Assignments', icon: IconLink, count: 'assignments' as const },
    ],
  },
  {
    group: 'Governance',
    items: [
      { href: '/audit-log', label: 'Audit Log', icon: IconClock, count: undefined },
      { href: '/settings', label: 'Settings', icon: IconGear, count: undefined },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname() ?? '/';
  const stats = getDashboardStats();
  const counts: Record<string, number> = {
    applications: stats.applications,
    roles: stats.roles,
    users: stats.users,
    assignments: stats.assignments,
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">RB</span>
        <span className="sidebar__name">RBAC</span>
        <span className="sidebar__env">Demo</span>
      </div>

      <nav className="sidebar__nav">
        {NAV.map((section, i) => (
          <div key={i}>
            {section.group && <div className="sidebar__group">{section.group}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? 'navitem navitem--active' : 'navitem'}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.count && <span className="navitem__count">{counts[item.count]}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__foot">
        <div className="whoami">
          <Avatar name={CURRENT_USER.name} size="sm" />
          <div className="whoami__meta">
            <div className="whoami__name">{CURRENT_USER.name}</div>
            <div className="whoami__role">{CURRENT_USER.consoleRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
