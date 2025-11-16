import { type ReactNode } from 'react';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto" id="main-content">
          <div className="px-4 sm:px-6 lg:px-8 py-12 min-h-full">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
