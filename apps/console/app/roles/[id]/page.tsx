import { listRoles } from '../../../lib/api-client';
import RoleDetailView from './view';

export function generateStaticParams() {
  return listRoles().map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoleDetailView id={id} />;
}
