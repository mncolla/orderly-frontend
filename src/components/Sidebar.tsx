import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { BarChart3, ShoppingBag, UtensilsCrossed, Lightbulb, LogOut, Calendar, Settings as SettingsIcon, Users, Menu, X, TrendingUp, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LastSyncStatus } from './LastSyncStatus';

const ownerSidebarItems = [
  { href: '/overview', label: 'sidebar.dashboard', icon: BarChart3 },
  { href: '/operations', label: 'sidebar.operations', icon: ShoppingBag },
  { href: '/menu', label: 'sidebar.menu', icon: UtensilsCrossed },
  { href: '/stores', label: 'sidebar.stores', icon: Store },
  { href: '/suggestions', label: 'sidebar.suggestions', icon: Lightbulb },
  { href: '/history', label: 'sidebar.history', icon: Calendar },
  { href: '/settings', label: 'sidebar.settings', icon: SettingsIcon },
];

const agencySidebarItems = [
  { href: '/agency', label: 'sidebar.agency', icon: Users },
  { href: '/users', label: 'sidebar.users', icon: Users },
  { href: '/settings', label: 'sidebar.settings', icon: SettingsIcon },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useTranslation();

  const sidebarItems = user?.role === 'AGENCY' ? agencySidebarItems : ownerSidebarItems;

  const handleNavigate = () => {
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            OrderlyAI
          </span>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* User Info - Removed role badge here, moved to bottom */}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavigate}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group
                    ${
                      isActive
                        ? 'bg-blue-600 !text-white shadow-lg shadow-blue-500/30'
                        : 'text-blue-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span className="flex-1">{t(item.label as any)}</span>
                  {isActive && (
                    <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Role Badge */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium">
          <span className="text-gray-700 dark:text-gray-300">
            {user?.name}
          </span>
          <span className="text-gray-400">•</span>
          <span className={
            user?.role === 'AGENCY'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-green-600 dark:text-green-400 font-semibold'
          }>
            {user?.role === 'AGENCY' ? t('sidebar.agency') : t('sidebar.owner')}
          </span>
        </div>
      </div>

      {/* Last Sync Status */}
      {user?.role !== 'AGENCY' && (
        <div className="px-4 py-2">
          <LastSyncStatus />
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={() => {
            logout();
            handleNavigate();
          }}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-900 dark:text-gray-100 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('sidebar.logout')}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on both mobile and desktop */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          ${isMobileOpen ? 'w-72' : 'w-0 lg:w-64'}
          transition-all duration-300 ease-in-out
          overflow-hidden
        `}
      >
        <div className="w-72 lg:w-64 h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
