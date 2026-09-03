/**
 * Single source of truth for the RBAC mock dataset.
 *
 * `db/seed/generate.mjs` renders this into:
 *   - db/rbac_mock.sql                        (MS SQL Server schema + seed, per the technology stack)
 *   - apps/console/lib/mock/dataset.generated.ts  (typed fixtures consumed by the console)
 *
 * Keeping one source means the SQL a backend team runs and the data the demo UI
 * renders can never drift apart.
 */
import { createHash } from 'node:crypto';

/** Deterministic UUIDv5-style id so regenerating never churns the diff. */
export function uuid(seed) {
  const h = createHash('sha1').update(`rbac:${seed}`).digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '5' + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join('-');
}

export const PERMISSION_VERSION = 4471;

// ---------------------------------------------------------------- actions ---
export const STANDARD_ACTIONS = [
  { key: 'read',    name: 'Read',    description: 'View / Read data' },
  { key: 'write',   name: 'Write',   description: 'Create new data' },
  { key: 'update',  name: 'Update',  description: 'Update existing data' },
  { key: 'delete',  name: 'Delete',  description: 'Delete data' },
  { key: 'export',  name: 'Export',  description: 'Export data to file' },
  { key: 'approve', name: 'Approve', description: 'Approve records' },
  { key: 'publish', name: 'Publish', description: 'Publish content / data' },
];

// ----------------------------------------------------------- applications ---
export const APPLICATIONS = [
  {
    key: 'saarthi_fx',
    name: 'Saarthi-FX®',
    owner: 'Workplace Management Team',
    status: 'Active',
    manifestVersion: '2025.05.20',
    lastSyncAt: '2026-05-20T10:30:00',
    manifestEndpoint: 'https://api.saarthi-fx.com/manifest/v1/ms',
    description:
      'Integrated workplace management suite for asset tracking, compliance, occupancy, feedback and facility inspections.',
  },
  {
    key: 'foodbook',
    name: 'FoodBook',
    owner: 'Culinary Systems Team',
    status: 'Active',
    manifestVersion: '2025.05.19',
    lastSyncAt: '2026-05-19T16:15:00',
    manifestEndpoint: 'https://api.foodbook.compass.com/manifest/v1',
    description:
      'Recipe, menu engineering and nutrition management platform used across Compass Group catering units.',
  },
  {
    key: 'medirest',
    name: 'Medirest App',
    owner: 'Healthcare Services Team',
    status: 'Active',
    manifestVersion: '2025.05.18',
    lastSyncAt: '2026-05-18T11:45:00',
    manifestEndpoint: 'https://api.medirest.compass.com/manifest/v1',
    description:
      'Patient dining, ward service and clinical nutrition workflows for healthcare sites.',
  },
  {
    key: 'shield',
    name: 'Shield',
    owner: 'HSE & Risk Team',
    status: 'Active',
    manifestVersion: '2025.05.20',
    lastSyncAt: '2026-05-20T09:10:00',
    manifestEndpoint: 'https://api.shield.compass.com/manifest/v1',
    description:
      'Health, safety and environmental incident reporting, risk assessment and corrective action tracking.',
  },
  {
    key: 'insights',
    name: 'Insights',
    owner: 'Data & Analytics Team',
    status: 'Active',
    manifestVersion: '2025.05.17',
    lastSyncAt: '2026-05-17T14:25:00',
    manifestEndpoint: 'https://api.insights.compass.com/manifest/v1',
    description:
      'Cross-platform reporting and analytics workspace covering operational and commercial performance.',
  },
  {
    key: 'smartq',
    name: 'SmartQ Platforms',
    owner: 'Digital Retail Team',
    status: 'Active',
    manifestVersion: '2025.05.16',
    lastSyncAt: '2026-05-16T13:05:00',
    manifestEndpoint: 'https://api.smartq.compass.com/manifest/v1',
    description:
      'Cashless payments, pre-ordering and queue management for on-site retail outlets.',
  },
  {
    key: 'learning',
    name: 'Learning Platform',
    owner: 'People & Capability Team',
    status: 'Active',
    manifestVersion: '2025.05.14',
    lastSyncAt: '2026-05-14T15:30:00',
    manifestEndpoint: 'https://api.learning.compass.com/manifest/v1',
    description:
      'Course authoring, assignment and certification tracking for frontline and management colleagues.',
  },
  {
    key: 'rbac_console',
    name: 'RBAC Console',
    owner: 'Platform Engineering Team',
    status: 'Active',
    manifestVersion: '2026.05.20',
    lastSyncAt: '2026-05-20T08:00:00',
    manifestEndpoint: 'https://api.rbac.compass.com/manifest/v1',
    description:
      'The RBAC administration console itself, registered as an application so it is governed by the same permission model it serves.',
  },
];

// --------------------------------------------------------------- resources ---
// [key, name, parentKey|null]. Order defines display order.
// A manifest resource may declare a narrower action list than the application
// catalogue (see the project brief: `invoices` offers 5 actions, its
// `credit_note` child only read + write). `actions: null` means "all of them".
const T = (key, name, parent = null, actions = null) => ({ key, name, parent, actions });

/** Common narrow action sets. */
const VIEW = ['read', 'export'];
const VIEW_ONLY = ['read'];
const NO_PUBLISH = ['read', 'write', 'update', 'delete', 'export', 'approve'];

export const RESOURCES = {
  // 32 active screens + 1 orphaned, matching the Application Detail stat card.
  saarthi_fx: [
    T('dashboard', 'Dashboard'),
    T('asset_management', 'Asset Management'),
    T('asset_management.asset_list', 'Asset List', 'asset_management'),
    T('asset_management.asset_details', 'Asset Details', 'asset_management'),
    T('asset_management.asset_transfer', 'Asset Transfer', 'asset_management'),
    T('asset_management.asset_disposal', 'Asset Disposal', 'asset_management'),
    T('compliance', 'Compliance'),
    T('compliance.audit', 'Audit', 'compliance'),
    T('compliance.checklist', 'Checklist', 'compliance'),
    T('compliance.incidents', 'Incidents', 'compliance'),
    T('compliance.certifications', 'Certifications', 'compliance'),
    T('occupancy', 'Occupancy'),
    T('occupancy.floor_plans', 'Floor Plans', 'occupancy'),
    T('occupancy.space_bookings', 'Space Bookings', 'occupancy'),
    T('occupancy.utilisation', 'Utilisation', 'occupancy'),
    T('feedback', 'Feedback'),
    T('feedback.surveys', 'Surveys', 'feedback'),
    T('feedback.responses', 'Responses', 'feedback'),
    T('feedback.nps', 'NPS Trends', 'feedback'),
    T('inspections', 'Inspections'),
    T('inspections.schedules', 'Schedules', 'inspections'),
    T('inspections.templates', 'Templates', 'inspections'),
    T('inspections.findings', 'Findings', 'inspections'),
    T('work_orders', 'Work Orders'),
    T('work_orders.open', 'Open Orders', 'work_orders'),
    T('work_orders.closed', 'Closed Orders', 'work_orders'),
    T('work_orders.sla', 'SLA Tracking', 'work_orders'),
    T('vendors', 'Vendors'),
    T('vendors.vendor_list', 'Vendor List', 'vendors'),
    T('vendors.contracts', 'Contracts', 'vendors'),
    T('reports', 'Reports'),
    T('reports.operational', 'Operational Reports', 'reports'),
    // Removed from the manifest but still referenced by a role -> Orphaned, never deleted.
    { ...T('reports.legacy_summary', 'Legacy Summary', 'reports'), status: 'Orphaned' },
  ],
  foodbook: [
    T('dashboard', 'Dashboard'),
    T('recipes', 'Recipes'),
    T('recipes.library', 'Recipe Library', 'recipes'),
    T('recipes.costing', 'Recipe Costing', 'recipes', VIEW),
    T('menus', 'Menus'),
    T('menus.cycles', 'Menu Cycles', 'menus'),
    T('menus.publishing', 'Menu Publishing', 'menus'),
    T('nutrition', 'Nutrition'),
    T('nutrition.allergens', 'Allergens', 'nutrition'),
    T('nutrition.labels', 'Nutrition Labels', 'nutrition', ['read', 'update', 'export', 'publish']),
    T('suppliers', 'Suppliers', null, ['read', 'write', 'update', 'export']),
    T('reports', 'Reports', null, VIEW),
  ],
  medirest: [
    T('dashboard', 'Dashboard'),
    T('patients', 'Patient Services'),
    T('patients.meal_orders', 'Meal Orders', 'patients'),
    T('patients.dietary', 'Dietary Requirements', 'patients'),
    T('wards', 'Ward Management'),
    T('wards.rounds', 'Ward Rounds', 'wards'),
    T('wards.stock', 'Ward Stock', 'wards'),
    T('clinical', 'Clinical Nutrition'),
    T('reports', 'Reports'),
  ],
  shield: [
    T('dashboard', 'Dashboard'),
    T('incidents', 'Incidents'),
    T('incidents.reporting', 'Incident Reporting', 'incidents'),
    T('incidents.investigation', 'Investigation', 'incidents'),
    T('risk', 'Risk Assessment'),
    T('risk.assessments', 'Assessments', 'risk'),
    T('risk.controls', 'Controls', 'risk'),
    T('actions', 'Corrective Actions'),
    T('audits', 'Safety Audits'),
    T('reports', 'Reports'),
  ],
  insights: [
    T('dashboard', 'Dashboard'),
    T('reports', 'Reports'),
    T('reports.operational', 'Operational', 'reports', VIEW),
    T('reports.commercial', 'Commercial', 'reports', VIEW),
    T('datasets', 'Datasets', null, VIEW_ONLY),
    T('datasets.catalogue', 'Data Catalogue', 'datasets', VIEW_ONLY),
    T('exports', 'Scheduled Exports', null, ['read', 'write', 'update', 'delete', 'export']),
  ],
  smartq: [
    T('dashboard', 'Dashboard'),
    T('outlets', 'Outlets'),
    T('outlets.terminals', 'Terminals', 'outlets'),
    T('outlets.menus', 'Outlet Menus', 'outlets'),
    T('orders', 'Orders'),
    T('orders.live', 'Live Queue', 'orders'),
    T('orders.history', 'Order History', 'orders', VIEW),
    T('payments', 'Payments'),
    T('payments.reconciliation', 'Reconciliation', 'payments', ['read', 'export', 'approve']),
    T('reports', 'Reports'),
  ],
  learning: [
    T('dashboard', 'Dashboard'),
    T('courses', 'Courses'),
    T('courses.authoring', 'Course Authoring', 'courses'),
    T('courses.catalogue', 'Course Catalogue', 'courses'),
    T('assignments', 'Assignments'),
    T('certifications', 'Certifications'),
    T('reports', 'Reports'),
  ],
  rbac_console: [
    T('dashboard', 'Dashboard'),
    T('applications', 'Applications'),
    T('screens_actions', 'Screens & Actions'),
    T('roles', 'Roles'),
    T('users', 'Users'),
    T('assignments', 'Assignments'),
    T('audit_log', 'Audit Log'),
    T('settings', 'Settings'),
  ],
};

/** Applications that carry a non-standard action on top of the seven defaults. */
export const CUSTOM_ACTIONS = {
  foodbook: [{ key: 'archive', name: 'Archive', description: 'Archive a recipe or menu cycle' }],
  learning: [{ key: 'assign', name: 'Assign', description: 'Assign a course to a colleague' }],
};

/** Actions deprecated by a manifest sync but still referenced by a role. */
export const DEPRECATED_ACTIONS = {
  medirest: ['publish'],
};

// ------------------------------------------------------------------- roles ---
// `grant` describes how the role's permission set is generated:
//   { all: true }                      -> every permission in the application
//   { actions: [...] }                 -> those actions on every screen
//   { subtrees: [...], actions: [...] }-> those actions on those screens + descendants
export const ROLES = [
  // Saarthi-FX® — the five roles shown in the Roles wireframe.
  { app: 'saarthi_fx', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  {
    app: 'saarthi_fx', name: 'Operations Manager', description: 'Manage operations screens and related tasks.', status: 'Active',
    grant: {
      subtrees: ['dashboard', 'asset_management', 'compliance', 'work_orders', 'inspections'],
      actions: ['read', 'write', 'update', 'export'],
      plus: [{ subtrees: ['compliance', 'work_orders'], actions: ['approve'] }],
      // Still references a screen dropped from the manifest -> that screen is Orphaned, not deleted.
      extra: [['reports.legacy_summary', 'read']],
    },
  },
  {
    app: 'saarthi_fx', name: 'Compliance Officer', description: 'Compliance & Audit access', status: 'Active',
    grant: {
      subtrees: ['dashboard', 'compliance', 'inspections', 'reports'],
      actions: ['read', 'write', 'update', 'export', 'approve'],
      extra: [['compliance', 'delete'], ['compliance.audit', 'delete'], ['compliance.checklist', 'delete']],
    },
  },
  {
    app: 'saarthi_fx', name: 'Facility Executive', description: 'Facility related access', status: 'Active',
    grant: {
      subtrees: ['dashboard', 'asset_management', 'occupancy', 'work_orders'],
      actions: ['read', 'write', 'update'],
      plus: [{ subtrees: ['asset_management', 'occupancy'], actions: ['export'] }],
      // compliance.checklist:read granted 18 May 2026 — see the audit log.
      extra: [['compliance', 'read'], ['compliance.checklist', 'read'], ['reports', 'read']],
    },
  },
  { app: 'saarthi_fx', name: 'Viewer', description: 'Read only access', status: 'Active', grant: { actions: ['read'] } },
  {
    app: 'saarthi_fx', name: 'Vendor Coordinator', description: 'Vendor and contract management only', status: 'Inactive',
    grant: { subtrees: ['dashboard', 'vendors'], actions: ['read', 'write', 'update'] },
  },

  // FoodBook
  { app: 'foodbook', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  { app: 'foodbook', name: 'Menu Planner', description: 'Build and publish menu cycles', status: 'Active', grant: { subtrees: ['dashboard', 'recipes', 'menus'], actions: ['read', 'write', 'update', 'publish'] } },
  { app: 'foodbook', name: 'Nutritionist', description: 'Allergen and nutrition label management', status: 'Active', grant: { subtrees: ['dashboard', 'nutrition', 'recipes'], actions: ['read', 'update', 'export'] } },
  { app: 'foodbook', name: 'Viewer', description: 'Read only access', status: 'Active', grant: { actions: ['read'] } },

  // Medirest App
  { app: 'medirest', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  { app: 'medirest', name: 'Ward Supervisor', description: 'Ward rounds and stock control', status: 'Active', grant: { subtrees: ['dashboard', 'wards'], actions: ['read', 'write', 'update'] } },
  { app: 'medirest', name: 'Dietitian', description: 'Clinical nutrition and dietary requirements', status: 'Active', grant: { subtrees: ['dashboard', 'clinical', 'patients'], actions: ['read', 'write', 'update', 'approve'] } },

  // Shield
  { app: 'shield', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  { app: 'shield', name: 'Compliance Officer', description: 'Compliance & Audit access', status: 'Active', grant: { subtrees: ['dashboard', 'audits', 'incidents', 'reports'], actions: ['read', 'write', 'update', 'export', 'approve'] } },
  { app: 'shield', name: 'Safety Inspector', description: 'Raise incidents and complete assessments', status: 'Active', grant: { subtrees: ['dashboard', 'incidents', 'risk'], actions: ['read', 'write', 'update'] } },

  // Insights
  { app: 'insights', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  { app: 'insights', name: 'Analyst', description: 'Build and export reports', status: 'Active', grant: { subtrees: ['dashboard', 'reports', 'datasets', 'exports'], actions: ['read', 'write', 'export'] } },
  { app: 'insights', name: 'Viewer', description: 'Read only access', status: 'Active', grant: { actions: ['read'] } },

  // SmartQ Platforms
  { app: 'smartq', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  { app: 'smartq', name: 'Operations Manager', description: 'Manage outlets, queues and menus', status: 'Active', grant: { subtrees: ['dashboard', 'outlets', 'orders'], actions: ['read', 'write', 'update', 'export'] } },
  { app: 'smartq', name: 'Finance Reviewer', description: 'Payment reconciliation and reporting', status: 'Active', grant: { subtrees: ['dashboard', 'payments', 'reports'], actions: ['read', 'export', 'approve'] } },

  // Learning Platform
  { app: 'learning', name: 'Admin', description: 'Full access to all modules', status: 'Active', grant: { all: true } },
  { app: 'learning', name: 'Course Author', description: 'Author and publish course content', status: 'Active', grant: { subtrees: ['dashboard', 'courses'], actions: ['read', 'write', 'update', 'publish'] } },
  { app: 'learning', name: 'Viewer', description: 'Read only access', status: 'Active', grant: { actions: ['read'] } },

  // RBAC Console — self-governed, seeded by the bootstrap migration.
  { app: 'rbac_console', name: 'SUPER_ADMIN', description: 'Full control of the RBAC platform, including settings and bootstrap.', status: 'Active', grant: { all: true } },
  { app: 'rbac_console', name: 'SECURITY_ADMIN', description: 'Manage roles, users and assignments. Cannot change system settings.', status: 'Active', grant: { subtrees: ['dashboard', 'applications', 'screens_actions', 'roles', 'users', 'assignments', 'audit_log'], actions: ['read', 'write', 'update', 'export'] } },
  { app: 'rbac_console', name: 'READ_ONLY_ADMIN', description: 'View-only access to every RBAC console module.', status: 'Active', grant: { actions: ['read'] } },
];

// ------------------------------------------------------------------- users ---
const U = (name, email, status = 'Active', lastLogin = null) => ({ name, email, status, lastLogin });

export const USERS = [
  U('Arjun Mehta',     'arjun.mehta@compass.com',     'Active',   '2026-05-20T09:12:00'),
  U('Neha Sharma',     'neha.sharma@compass.com',     'Active',   '2026-05-19T17:40:00'),
  U('Ravi Kumar',      'ravi.kumar@compass.com',      'Active',   '2026-05-20T08:05:00'),
  U('Pooja Singh',     'pooja.singh@compass.com',     'Active',   '2026-05-18T14:22:00'),
  U('Mohit Verma',     'mohit.verma@compass.com',     'Inactive', '2026-05-10T11:03:00'),
  U('Sanjana Iyer',    'sanjana.iyer@compass.com',    'Active',   '2026-05-20T07:55:00'),
  U('Imran Qureshi',   'imran.qureshi@compass.com',   'Active',   '2026-05-19T12:31:00'),
  U('Kavita Nair',     'kavita.nair@compass.com',     'Active',   '2026-05-20T10:02:00'),
  U('Deepak Joshi',    'deepak.joshi@compass.com',    'Active',   '2026-05-17T16:48:00'),
  U('Farhan Sheikh',   'farhan.sheikh@compass.com',   'Active',   '2026-05-19T09:27:00'),
  U('Meera Krishnan',  'meera.krishnan@compass.com',  'Active',   '2026-05-18T13:14:00'),
  U('Rohit Bansal',    'rohit.bansal@compass.com',    'Active',   '2026-05-20T08:44:00'),
  U('Ananya Ghosh',    'ananya.ghosh@compass.com',    'Active',   '2026-05-16T15:09:00'),
  U('Vikram Rao',      'vikram.rao@compass.com',      'Inactive', '2026-04-28T10:17:00'),
  U('Shalini Menon',   'shalini.menon@compass.com',   'Active',   '2026-05-19T11:52:00'),
  U('Aditya Kulkarni', 'aditya.kulkarni@compass.com', 'Active',   '2026-05-20T09:38:00'),
  U('Priya Desai',     'priya.desai@compass.com',     'Active',   '2026-05-18T17:05:00'),
  U('Nikhil Chawla',   'nikhil.chawla@compass.com',   'Active',   '2026-05-17T10:41:00'),
];

// ------------------------------------------------------------- assignments ---
// [userEmailPrefix, appKey, roleName, assignedOn, assignedByEmailPrefix]
export const ASSIGNMENTS = [
  ['arjun.mehta',     'saarthi_fx',   'Admin',              '2026-05-10T10:20:00', 'neha.sharma'],
  ['arjun.mehta',     'saarthi_fx',   'Operations Manager', '2026-05-10T10:24:00', 'neha.sharma'],
  ['arjun.mehta',     'foodbook',     'Admin',              '2026-05-11T09:15:00', 'neha.sharma'],
  ['arjun.mehta',     'shield',       'Compliance Officer', '2026-05-11T09:20:00', 'neha.sharma'],
  ['arjun.mehta',     'insights',     'Viewer',             '2026-05-12T11:00:00', 'neha.sharma'],
  ['arjun.mehta',     'smartq',       'Operations Manager', '2026-05-12T11:05:00', 'neha.sharma'],
  ['arjun.mehta',     'rbac_console', 'SUPER_ADMIN',        '2026-05-01T08:00:00', 'arjun.mehta'],
  ['neha.sharma',     'foodbook',     'Admin',              '2026-05-12T09:30:00', 'arjun.mehta'],
  ['neha.sharma',     'saarthi_fx',   'Compliance Officer', '2026-05-12T09:35:00', 'arjun.mehta'],
  ['neha.sharma',     'shield',       'Admin',              '2026-05-13T14:10:00', 'arjun.mehta'],
  ['neha.sharma',     'rbac_console', 'SECURITY_ADMIN',     '2026-05-02T09:00:00', 'arjun.mehta'],
  ['ravi.kumar',      'shield',       'Compliance Officer', '2026-05-11T15:45:00', 'neha.sharma'],
  ['ravi.kumar',      'saarthi_fx',   'Facility Executive', '2026-05-13T10:12:00', 'neha.sharma'],
  ['ravi.kumar',      'medirest',     'Ward Supervisor',    '2026-05-14T11:30:00', 'neha.sharma'],
  ['pooja.singh',     'insights',     'Viewer',             '2026-05-13T13:20:00', 'arjun.mehta'],
  ['pooja.singh',     'learning',     'Course Author',      '2026-05-14T09:50:00', 'arjun.mehta'],
  ['mohit.verma',     'learning',     'Viewer',             '2026-05-08T16:00:00', 'neha.sharma'],
  ['sanjana.iyer',    'saarthi_fx',   'Operations Manager', '2026-05-14T10:05:00', 'neha.sharma'],
  ['sanjana.iyer',    'smartq',       'Finance Reviewer',   '2026-05-15T12:40:00', 'neha.sharma'],
  ['imran.qureshi',   'saarthi_fx',   'Facility Executive', '2026-05-15T09:18:00', 'arjun.mehta'],
  ['imran.qureshi',   'shield',       'Safety Inspector',   '2026-05-15T09:22:00', 'arjun.mehta'],
  ['kavita.nair',     'medirest',     'Dietitian',          '2026-05-15T14:55:00', 'neha.sharma'],
  ['kavita.nair',     'foodbook',     'Nutritionist',       '2026-05-16T10:30:00', 'neha.sharma'],
  ['deepak.joshi',    'saarthi_fx',   'Viewer',             '2026-05-16T11:12:00', 'arjun.mehta'],
  ['deepak.joshi',    'insights',     'Analyst',            '2026-05-16T11:15:00', 'arjun.mehta'],
  ['farhan.sheikh',   'smartq',       'Operations Manager', '2026-05-17T09:44:00', 'neha.sharma'],
  ['farhan.sheikh',   'saarthi_fx',   'Viewer',             '2026-05-17T09:48:00', 'neha.sharma'],
  ['meera.krishnan',  'foodbook',     'Menu Planner',       '2026-05-17T13:26:00', 'arjun.mehta'],
  ['meera.krishnan',  'medirest',     'Dietitian',          '2026-05-18T10:08:00', 'arjun.mehta'],
  ['rohit.bansal',    'insights',     'Analyst',            '2026-05-18T11:35:00', 'neha.sharma'],
  ['rohit.bansal',    'saarthi_fx',   'Operations Manager', '2026-05-18T11:40:00', 'neha.sharma'],
  ['ananya.ghosh',    'learning',     'Course Author',      '2026-05-18T15:20:00', 'arjun.mehta'],
  ['vikram.rao',      'shield',       'Safety Inspector',   '2026-04-25T10:00:00', 'neha.sharma'],
  ['shalini.menon',   'saarthi_fx',   'Compliance Officer', '2026-05-19T09:30:00', 'neha.sharma'],
  ['shalini.menon',   'rbac_console', 'READ_ONLY_ADMIN',    '2026-05-19T09:35:00', 'arjun.mehta'],
  ['aditya.kulkarni', 'saarthi_fx',   'Admin',              '2026-05-19T14:15:00', 'arjun.mehta'],
  ['aditya.kulkarni', 'smartq',       'Admin',              '2026-05-19T14:18:00', 'arjun.mehta'],
  ['priya.desai',     'foodbook',     'Viewer',             '2026-05-19T16:02:00', 'neha.sharma'],
  ['priya.desai',     'learning',     'Viewer',             '2026-05-19T16:05:00', 'neha.sharma'],
  ['nikhil.chawla',   'medirest',     'Ward Supervisor',    '2026-05-20T08:20:00', 'arjun.mehta'],
];

// --------------------------------------------------------------- settings ---
export const SETTINGS = [
  { key: 'session_timeout_mins',    label: 'Session Timeout (mins)',    value: '60',      type: 'select', options: ['15', '30', '60', '120'] },
  { key: 'password_policy',         label: 'Password Policy',           value: 'Strong',  type: 'select', options: ['Standard', 'Strong', 'Very Strong'] },
  { key: 'mfa',                     label: 'MFA',                       value: 'Enabled', type: 'select', options: ['Enabled', 'Disabled'] },
  { key: 'hybrid_access_key',       label: 'Hybrid Access Key',         value: 'Enabled', type: 'select', options: ['Enabled', 'Disabled'] },
  { key: 'manifest_sync_interval',  label: 'Manifest Sync Interval (hrs)', value: '24',   type: 'select', options: ['6', '12', '24', '48'] },
  { key: 'audit_log_retention',     label: 'Audit Log Retention (days)',   value: '365',  type: 'select', options: ['90', '180', '365', '730'] },
];

// -------------------------------------------------------------- audit log ---
// Immutable trail. `before`/`after` are stored as JSON snapshots (NVARCHAR(MAX)).
const A = (timestamp, actor, app, entityType, entityId, entity, eventType, details, before, after) =>
  ({ timestamp, actor, app, entityType, entityId, entity, eventType, details, before, after });

export const AUDIT_LOG = [
  A('2026-05-20T10:30:00', 'neha.sharma', 'saarthi_fx', 'Role', 'role:saarthi_fx:Operations Manager',
    'Operations Manager', 'Role Updated', 'Permissions updated',
    { name: 'Operations Manager', screens: 10, permissions: 74, description: 'Manage operations screens.', status: 'Active' },
    { name: 'Operations Manager', screens: 12, permissions: 86, description: 'Manage operations screens and related tasks.', status: 'Active' }),

  A('2026-05-20T10:20:00', 'arjun.mehta', 'saarthi_fx', 'Assignment', 'assignment:arjun.mehta:saarthi_fx:Admin',
    'Arjun Mehta — Admin (Saarthi-FX®)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Arjun Mehta', email: 'arjun.mehta@compass.com', application: 'Saarthi-FX®', role: 'Admin', assigned_by: 'Neha Sharma' }),

  A('2026-05-20T09:15:00', 'arjun.mehta', 'rbac_console', 'Settings', 'settings:global',
    'System Settings', 'Settings Updated', 'Audit retention changed',
    { session_timeout_mins: '60', mfa: 'Enabled', audit_log_retention: '180' },
    { session_timeout_mins: '60', mfa: 'Enabled', audit_log_retention: '365' }),

  A('2026-05-20T08:00:00', 'arjun.mehta', 'rbac_console', 'Manifest', 'manifest:rbac_console:2026.05.20',
    'RBAC Console', 'Application Synced', 'Manifest v2026.05.20',
    { manifest_version: '2026.05.19', screens: 8, actions: 7 },
    { manifest_version: '2026.05.20', screens: 8, actions: 7, created: 0, updated: 8, orphaned: 0, deleted: 0 }),

  A('2026-05-19T15:45:00', 'ravi.kumar', 'shield', 'Role', 'role:shield:Compliance Officer',
    'Compliance Officer', 'Role Created', 'New role created',
    null,
    { name: 'Compliance Officer', description: 'Compliance & Audit access', status: 'Active', permissions: 0 }),

  A('2026-05-19T14:15:00', 'arjun.mehta', 'saarthi_fx', 'Assignment', 'assignment:aditya.kulkarni:saarthi_fx:Admin',
    'Aditya Kulkarni — Admin (Saarthi-FX®)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Aditya Kulkarni', application: 'Saarthi-FX®', role: 'Admin', assigned_by: 'Arjun Mehta' }),

  A('2026-05-19T09:35:00', 'arjun.mehta', 'rbac_console', 'Assignment', 'assignment:shalini.menon:rbac_console:READ_ONLY_ADMIN',
    'Shalini Menon — READ_ONLY_ADMIN (RBAC Console)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Shalini Menon', application: 'RBAC Console', role: 'READ_ONLY_ADMIN', assigned_by: 'Arjun Mehta' }),

  A('2026-05-19T16:15:00', 'neha.sharma', 'foodbook', 'Manifest', 'manifest:foodbook:2025.05.19',
    'FoodBook', 'Application Synced', 'Manifest v2025.05.19',
    { manifest_version: '2025.05.18', screens: 11, actions: 8 },
    { manifest_version: '2025.05.19', screens: 12, actions: 8, created: 1, updated: 11, orphaned: 0, deleted: 0 }),

  A('2026-05-18T11:45:00', 'neha.sharma', 'saarthi_fx', 'Permission', 'permission:compliance.checklist:read',
    'Checklist (Read)', 'Permission Changed', 'Permission updated',
    { role: 'Facility Executive', permission: 'compliance.checklist:read', granted: false },
    { role: 'Facility Executive', permission: 'compliance.checklist:read', granted: true }),

  A('2026-05-18T10:08:00', 'arjun.mehta', 'medirest', 'Assignment', 'assignment:meera.krishnan:medirest:Dietitian',
    'Meera Krishnan — Dietitian (Medirest App)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Meera Krishnan', application: 'Medirest App', role: 'Dietitian', assigned_by: 'Arjun Mehta' }),

  A('2026-05-17T14:25:00', 'arjun.mehta', 'shield', 'Manifest', 'manifest:shield:2025.05.17',
    'Shield', 'Application Synced', 'Manifest v2025.05.17',
    { manifest_version: '2025.05.16', screens: 10, actions: 7 },
    { manifest_version: '2025.05.17', screens: 10, actions: 7, created: 0, updated: 10, orphaned: 0, deleted: 0 }),

  A('2026-05-17T11:20:00', 'neha.sharma', 'saarthi_fx', 'Manifest', 'manifest:saarthi_fx:2025.05.20',
    'Saarthi-FX®', 'Application Synced', 'Manifest v2025.05.20 — 1 screen orphaned',
    { manifest_version: '2025.05.19', screens: 33, actions: 7 },
    { manifest_version: '2025.05.20', screens: 32, actions: 7, created: 2, updated: 30, orphaned: 1, deleted: 0, orphaned_keys: ['reports.legacy_summary'] }),

  A('2026-05-16T10:30:00', 'neha.sharma', 'foodbook', 'Assignment', 'assignment:kavita.nair:foodbook:Nutritionist',
    'Kavita Nair — Nutritionist (FoodBook)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Kavita Nair', application: 'FoodBook', role: 'Nutritionist', assigned_by: 'Neha Sharma' }),

  A('2026-05-15T16:40:00', 'arjun.mehta', 'saarthi_fx', 'Role', 'role:saarthi_fx:Vendor Coordinator',
    'Vendor Coordinator', 'Role Updated', 'Role deactivated',
    { name: 'Vendor Coordinator', status: 'Active', permissions: 9 },
    { name: 'Vendor Coordinator', status: 'Inactive', permissions: 9 }),

  A('2026-05-15T09:22:00', 'arjun.mehta', 'shield', 'Assignment', 'assignment:imran.qureshi:shield:Safety Inspector',
    'Imran Qureshi — Safety Inspector (Shield)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Imran Qureshi', application: 'Shield', role: 'Safety Inspector', assigned_by: 'Arjun Mehta' }),

  A('2026-05-14T15:30:00', 'neha.sharma', 'learning', 'Manifest', 'manifest:learning:2025.05.14',
    'Learning Platform', 'Application Synced', 'Manifest v2025.05.14',
    { manifest_version: '2025.05.13', screens: 7, actions: 8 },
    { manifest_version: '2025.05.14', screens: 7, actions: 8, created: 0, updated: 7, orphaned: 0, deleted: 0 }),

  A('2026-05-13T14:10:00', 'arjun.mehta', 'shield', 'Assignment', 'assignment:neha.sharma:shield:Admin',
    'Neha Sharma — Admin (Shield)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Neha Sharma', application: 'Shield', role: 'Admin', assigned_by: 'Arjun Mehta' }),

  A('2026-05-12T16:55:00', 'neha.sharma', 'insights', 'Role', 'role:insights:Analyst',
    'Analyst', 'Role Updated', 'Permissions updated',
    { name: 'Analyst', permissions: 12, description: 'Build reports' },
    { name: 'Analyst', permissions: 18, description: 'Build and export reports' }),

  A('2026-05-11T09:20:00', 'neha.sharma', 'shield', 'Assignment', 'assignment:arjun.mehta:shield:Compliance Officer',
    'Arjun Mehta — Compliance Officer (Shield)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Arjun Mehta', application: 'Shield', role: 'Compliance Officer', assigned_by: 'Neha Sharma' }),

  A('2026-05-10T14:05:00', 'arjun.mehta', 'smartq', 'Application', 'application:smartq',
    'SmartQ Platforms', 'Application Updated', 'Owner changed',
    { name: 'SmartQ Platforms', owner: 'Retail Team', status: 'Active' },
    { name: 'SmartQ Platforms', owner: 'Digital Retail Team', status: 'Active' }),

  A('2026-05-09T11:30:00', 'arjun.mehta', 'learning', 'Application', 'application:learning',
    'Learning Platform', 'Application Created', 'Application registered',
    null,
    { name: 'Learning Platform', app_key: 'learning', status: 'Active', owner: 'People & Capability Team' }),

  A('2026-05-08T16:00:00', 'neha.sharma', 'learning', 'Assignment', 'assignment:mohit.verma:learning:Viewer',
    'Mohit Verma — Viewer (Learning Platform)', 'User Assigned', 'Role assigned',
    null,
    { user: 'Mohit Verma', application: 'Learning Platform', role: 'Viewer', assigned_by: 'Neha Sharma' }),

  A('2026-05-07T10:12:00', 'neha.sharma', 'saarthi_fx', 'Assignment', 'assignment:tarun.pillai:saarthi_fx:Viewer',
    'Tarun Pillai — Viewer (Saarthi-FX®)', 'Assignment Revoked', 'Role revoked',
    { user: 'Tarun Pillai', application: 'Saarthi-FX®', role: 'Viewer', assigned_by: 'Neha Sharma' },
    null),

  A('2026-05-05T09:45:00', 'arjun.mehta', 'medirest', 'Action', 'action:medirest:publish',
    'Publish', 'Action Deprecated', 'Action removed from manifest',
    { action_key: 'publish', name: 'Publish', status: 'Active' },
    { action_key: 'publish', name: 'Publish', status: 'Deprecated' }),

  A('2026-05-01T08:00:00', 'arjun.mehta', 'rbac_console', 'Role', 'role:rbac_console:SUPER_ADMIN',
    'SUPER_ADMIN', 'Role Created', 'Bootstrap seed',
    null,
    { name: 'SUPER_ADMIN', description: 'Full control of the RBAC platform, including settings and bootstrap.', status: 'Active' }),
];
