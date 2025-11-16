import { Tabs, TabItem } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsTabs() {
  const navigate = useNavigate();

  const handleTabChange = (tabIndex: number) => {
    const path = tabIndex === 0 ? '/settings/system-status' : '/settings/user-account';
    navigate(path);
  };

  return (
    <div className="border-b border-slate-700">
      <Tabs
        aria-label="Settings tabs"
        onActiveTabChange={handleTabChange}
        className="[&_[role='tab'][aria-selected='true']]:!text-white [&_[role='tab'][aria-selected='true']]:!font-bold [&_[role='tab']]:!text-slate-400 [&_[role='tab']]:hover:!text-slate-300 [&_[role='tab'][aria-selected='true']]:!border-blue-500"
      >
        <TabItem title="System Status" />
        <TabItem title="User Account" />
      </Tabs>
    </div>
  );
}