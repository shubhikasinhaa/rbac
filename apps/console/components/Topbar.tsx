'use client';

import { permissionVersion } from '../lib/api-client';
import { CURRENT_USER } from '../lib/session';
import { Badge } from './ui';
import { IconShield } from './icons';

export function Topbar() {
  return (
    <header className="topbar">
      <Badge tone="accent">
        <IconShield width={12} height={12} />
        Internal · Confidential
      </Badge>
      <div className="topbar__spacer" />
      <div className="topbar__version" title="Global permission version — bumped on every role or assignment change">
        permission_version <b>{permissionVersion}</b>
      </div>
      <span className="faint">·</span>
      <span className="small muted">{CURRENT_USER.email}</span>
    </header>
  );
}
