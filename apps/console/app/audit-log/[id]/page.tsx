import { listAuditLogs } from '../../../lib/api-client';
import AuditDetailView from './view';

export function generateStaticParams() {
  return listAuditLogs().map((e) => ({ id: e.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditDetailView id={id} />;
}
