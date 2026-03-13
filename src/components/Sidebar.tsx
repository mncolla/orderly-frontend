import { Link, useLocation } from 'wouter';
import { BarChart3, ShoppingBag, Utensils, Megaphone, Lightbulb, LogOut, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const sidebarItems = [
  { href: '/overview', label: 'Overview', icon: BarChart3 },
  { href: '/operations', label: 'Operations', icon: ShoppingBag },
  { href: '/menu', label: 'Menu', icon: Utensils },
  { href: '/suggestions', label: 'Suggestions', icon: Lightbulb },
  { href: '/history', label: 'History', icon: Calendar },
  { href: '/integrations', label: 'Integrations', icon: Megaphone },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-10 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-lg">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Orderly</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      {/* Logout */}
      <div className="p-4">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}
