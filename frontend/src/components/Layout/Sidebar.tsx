import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, memo, type ComponentType, type SVGProps } from 'react';
import { MdHome, MdViewModule, MdSettings, MdLogout } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: MdHome },
    { to: '/modules', label: 'Modules', icon: MdViewModule },
    { to: '/settings', label: 'Settings', icon: MdSettings },
  ];

  const NavItem = memo(({ item, isExpanded, isActive }: {
    item: { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };
    isExpanded: boolean;
    isActive: boolean;
  }) => (
    <Link
      to={item.to}
      className={`flex items-center gap-3 text-slate-400 hover:text-white transition-colors py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        isActive ? 'bg-slate-800 text-white' : ''
      } ${isExpanded ? 'justify-start' : 'justify-center'}`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={isExpanded ? undefined : item.label}
    >
      <item.icon className="w-5 h-5" aria-hidden="true" />
      {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  ));

  NavItem.displayName = 'NavItem';

  return (
    <aside
      className={`hidden md:flex bg-slate-950 border-r border-slate-700 flex-col items-center py-4 h-screen transition-all duration-300 ${
        isExpanded ? 'w-48' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 rounded"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isExpanded}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          {isExpanded && <span className="text-xl font-bold text-white ml-2">AI Toolbox</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            isExpanded={isExpanded}
            isActive={location.pathname === item.to}
          />
        ))}
      </nav>

      {/* User Avatar at bottom */}
      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity">
            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
          </div>
          {isExpanded && <span className="text-white font-medium text-sm ml-3">{user?.name || 'User'}</span>}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 text-slate-400 hover:text-white transition-colors py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
            isExpanded ? 'justify-start w-full' : 'justify-center'
          }`}
          aria-label={isExpanded ? undefined : 'Logout'}
        >
          <MdLogout className="w-5 h-5" aria-hidden="true" />
          {isExpanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
