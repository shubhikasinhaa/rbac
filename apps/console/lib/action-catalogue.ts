/**
 * The standard action set every new application is seeded with
 * (prd.md FR-3.3). An application can add its own custom actions on top
 * without a schema migration — actions are data, not an enum.
 */
export const STANDARD_ACTION_CATALOGUE = [
  { key: 'read',    name: 'Read',    description: 'View / Read data' },
  { key: 'write',   name: 'Write',   description: 'Create new data' },
  { key: 'update',  name: 'Update',  description: 'Update existing data' },
  { key: 'delete',  name: 'Delete',  description: 'Delete data' },
  { key: 'export',  name: 'Export',  description: 'Export data to file' },
  { key: 'approve', name: 'Approve', description: 'Approve records' },
  { key: 'publish', name: 'Publish', description: 'Publish content / data' },
];
