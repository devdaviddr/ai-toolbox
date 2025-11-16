import { type ReactNode } from 'react';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-grow">
        <main className="flex-grow" id="main-content">
          <div className="px-4 sm:px-6 lg:px-8 py-12">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
