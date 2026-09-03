import Link from 'next/link';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <>
      <div className="pagehead">
        <div className="pagehead__text">
          <h1>Page not found</h1>
          <div className="pagehead__sub">
            The route you followed does not exist in the RBAC console.
          </div>
        </div>
      </div>
      <section className="card">
        <EmptyState
          title="Nothing here"
          text="The link may be out of date, or the record it pointed to may have been removed from the registry."
          action={<Link href="/" className="btn btn--primary">Back to Dashboard</Link>}
        />
      </section>
    </>
  );
}
