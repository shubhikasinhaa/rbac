/** Single-stroke 16px icon set. Inline SVG so the static export ships no icon font. */
import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, ...p,
});

export const IconGrid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>
);
export const IconApps = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 6h12" /><circle cx="4.2" cy="4.5" r=".5" fill="currentColor" stroke="none" /></svg>
);
export const IconLayers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 1.8 14 5 8 8.2 2 5l6-3.2Z" /><path d="m2 8 6 3.2L14 8" /><path d="m2 11 6 3.2L14 11" /></svg>
);
export const IconShield = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 1.6 13 3.4v4.2c0 3-2.1 5.6-5 6.8-2.9-1.2-5-3.8-5-6.8V3.4L8 1.6Z" /><path d="m5.9 7.9 1.5 1.5 2.8-2.8" /></svg>
);
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="6" cy="5.2" r="2.4" /><path d="M1.8 13.4c0-2.3 1.9-3.9 4.2-3.9s4.2 1.6 4.2 3.9" /><path d="M10.6 3.2a2.4 2.4 0 0 1 0 4.6" /><path d="M11.6 9.8c1.6.3 2.6 1.6 2.6 3.6" /></svg>
);
export const IconLink = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6.6 9.4a2.6 2.6 0 0 0 3.9.3l2-2a2.6 2.6 0 0 0-3.7-3.7l-1.1 1.1" /><path d="M9.4 6.6a2.6 2.6 0 0 0-3.9-.3l-2 2a2.6 2.6 0 0 0 3.7 3.7l1.1-1.1" /></svg>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6.2" /><path d="M8 4.4V8l2.4 1.4" /></svg>
);
export const IconGear = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="2.1" /><path d="M12.7 9.9a1.1 1.1 0 0 0 .2 1.2l.1.1a1.3 1.3 0 1 1-1.9 1.9l-.1-.1a1.1 1.1 0 0 0-1.2-.2 1.1 1.1 0 0 0-.7 1v.2a1.3 1.3 0 1 1-2.6 0v-.1a1.1 1.1 0 0 0-.7-1 1.1 1.1 0 0 0-1.2.2l-.1.1a1.3 1.3 0 1 1-1.9-1.9l.1-.1a1.1 1.1 0 0 0 .2-1.2 1.1 1.1 0 0 0-1-.7h-.2a1.3 1.3 0 1 1 0-2.6h.1a1.1 1.1 0 0 0 1-.7 1.1 1.1 0 0 0-.2-1.2l-.1-.1a1.3 1.3 0 1 1 1.9-1.9l.1.1a1.1 1.1 0 0 0 1.2.2h.1a1.1 1.1 0 0 0 .7-1v-.2a1.3 1.3 0 1 1 2.6 0v.1a1.1 1.1 0 0 0 .7 1 1.1 1.1 0 0 0 1.2-.2l.1-.1a1.3 1.3 0 1 1 1.9 1.9l-.1.1a1.1 1.1 0 0 0-.2 1.2v.1a1.1 1.1 0 0 0 1 .7h.2a1.3 1.3 0 1 1 0 2.6h-.1a1.1 1.1 0 0 0-1 .7Z" /></svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><circle cx="7.2" cy="7.2" r="4.6" /><path d="m10.6 10.6 3 3" /></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><path d="M8 3.2v9.6M3.2 8h9.6" /></svg>
);
export const IconChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 12, height: 12, viewBox: '0 0 16 16', ...p })}><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
);
export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 12, height: 12, viewBox: '0 0 16 16', ...p })}><path d="m3.5 6 4.5 4.5L12.5 6" /></svg>
);
export const IconExternal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><path d="M9.5 2.5H13V6" /><path d="M13 2.5 7.5 8" /><path d="M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" /></svg>
);
export const IconSync = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><path d="M13.6 7A5.6 5.6 0 0 0 3.6 4.4L2.4 5.6" /><path d="M2.4 9a5.6 5.6 0 0 0 10 2.6l1.2-1.2" /><path d="M2.4 2.6v3h3M13.6 13.4v-3h-3" /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 14, height: 14, viewBox: '0 0 16 16', ...p })}><path d="m4 4 8 8M12 4l-8 8" /></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 10, height: 10, viewBox: '0 0 16 16', strokeWidth: 2.6, stroke: '#fff', ...p })}><path d="m3 8.4 3.4 3.4L13 5.2" /></svg>
);
export const IconTree = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><rect x="6" y="1.6" width="8" height="3.4" rx=".8" /><rect x="6" y="11" width="8" height="3.4" rx=".8" /><rect x="6" y="6.3" width="8" height="3.4" rx=".8" /><path d="M2.6 3.3v9.4M2.6 3.3h3.4M2.6 8h3.4M2.6 12.7h3.4" /></svg>
);
export const IconWarn = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 14, height: 14, viewBox: '0 0 16 16', ...p })}><path d="M8 2.2 14.4 13H1.6L8 2.2Z" /><path d="M8 6.4v3M8 11.4h.01" /></svg>
);
export const IconInfo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 14, height: 14, viewBox: '0 0 16 16', ...p })}><circle cx="8" cy="8" r="6.2" /><path d="M8 7.4v3.4M8 5.2h.01" /></svg>
);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><path d="M2.6 4.2h10.8M6 4.2V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2" /><path d="M12.2 4.2 11.7 13a1 1 0 0 1-1 .9H5.3a1 1 0 0 1-1-.9L3.8 4.2" /></svg>
);
export const IconKey = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><circle cx="5.4" cy="5.4" r="3.2" /><path d="m7.7 7.7 5 5M11 11l1.4-1.4M12.7 12.7 14 11.4" /></svg>
);
export const IconDoc = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 1.8H4.5a1 1 0 0 0-1 1v10.4a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.3L9 1.8Z" /><path d="M9 1.8v3.5h3.5" /></svg>
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ width: 13, height: 13, viewBox: '0 0 16 16', ...p })}><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);
