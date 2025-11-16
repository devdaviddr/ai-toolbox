import { Outlet } from 'react-router-dom';

export default function SettingsLayout() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-300 text-lg">System configuration and status</p>
      </div>

      <Outlet />
    </div>
  );
}