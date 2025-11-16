import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Tabs, TabItem } from 'flowbite-react';

// Lazy load tab components for performance
const SystemStatusTab = lazy(() => import('../components/SystemStatusTab'));
const UserAccountTab = lazy(() => import('../components/UserAccountTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
    <span className="ml-3 text-slate-300">Loading...</span>
  </div>
);

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && activeTab > 0) {
        setActiveTab(activeTab - 1);
      } else if (event.key === 'ArrowRight' && activeTab < 1) {
        setActiveTab(activeTab + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeTab < 1) {
      setActiveTab(activeTab + 1);
    } else if (isRightSwipe && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-300 text-lg">System configuration and status</p>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden"
      >
        <Tabs
          aria-label="Settings tabs"
          onActiveTabChange={setActiveTab}
          variant="underline"
          className="transition-all duration-300 [&_[role='tab'][aria-selected='true']]:!text-white [&_[role='tab'][aria-selected='true']]:!font-bold [&_[role='tab']]:!text-slate-400 [&_[role='tab']]:hover:!text-slate-300 [&_[role='tab'][aria-selected='true']]:!border-blue-500"
        >
          <TabItem
            title="System Status"
            active={activeTab === 0}
            aria-controls="system-status-panel"
            aria-selected={activeTab === 0}
            id="system-status-tab"
          >
            <div
              id="system-status-panel"
              role="tabpanel"
              aria-labelledby="system-status-tab"
              className={`transition-all duration-300 ease-in-out md:relative md:opacity-100 ${
                activeTab === 0
                  ? 'opacity-100 md:translate-x-0'
                  : 'opacity-0 md:absolute md:inset-0 md:translate-x-full md:pointer-events-none'
              }`}
            >
              <Suspense fallback={<LoadingFallback />}>
                <SystemStatusTab />
              </Suspense>
            </div>
          </TabItem>
          <TabItem
            title="User Account"
            active={activeTab === 1}
            aria-controls="user-account-panel"
            aria-selected={activeTab === 1}
            id="user-account-tab"
          >
            <div
              id="user-account-panel"
              role="tabpanel"
              aria-labelledby="user-account-tab"
              className={`transition-all duration-300 ease-in-out md:relative md:opacity-100 ${
                activeTab === 1
                  ? 'opacity-100 md:translate-x-0'
                  : 'opacity-0 md:absolute md:inset-0 md:-translate-x-full md:pointer-events-none'
              }`}
            >
              <Suspense fallback={<LoadingFallback />}>
                <UserAccountTab />
              </Suspense>
            </div>
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}
