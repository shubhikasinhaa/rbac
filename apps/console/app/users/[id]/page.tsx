import { listUsers } from '../../../lib/api-client';
import UserDetailView from './view';

export function generateStaticParams() {
  return listUsers().map((u) => ({ id: u.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserDetailView id={id} />;
}
