import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const metadata: Metadata = {
  title: 'RBAC — Access Control Console',
  description:
    'Centralized role-based access control for Compass Group enterprise applications. Internal use only.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <div className="main">
            <Topbar />
            <main className="content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
