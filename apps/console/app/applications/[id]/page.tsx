import { listApplications } from '../../../lib/api-client';
import ApplicationDetailView from './view';

/** Static export enumerates every application route at build time. */
export function generateStaticParams() {
  return listApplications().map((a) => ({ id: a.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}
