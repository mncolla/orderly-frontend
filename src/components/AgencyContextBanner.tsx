import { useLocation } from 'wouter';
import { Store, User, ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface AgencyContextBannerProps {
  userName?: string;
  storeName?: string;
  onViewChange?: (view: 'overview' | 'operations') => void;
  currentView?: 'overview' | 'operations';
}

export function AgencyContextBanner({
  userName,
  storeName,
  onViewChange,
  currentView = 'overview'
}: AgencyContextBannerProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Parse search params from location
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const agencyView = searchParams.get('agencyView') === 'true';

  // Don't render if not in agency mode
  if (!agencyView) {
    return null;
  }

  const handleBackToAgency = () => {
    setLocation('/agency');
  };

  const switchView = (view: 'overview' | 'operations') => {
    setLocation(`/${view}?${searchParams.toString()}`);
    onViewChange?.(view);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 text-white">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back button + Context info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToAgency}
              className="text-white hover:bg-white/10 border-white/20"
              title="Volver al Panel de Agencia"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Agencia</span>
            </Button>

            <div className="h-6 w-px bg-white/20" />

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {userName || 'Cargando...'}
                </span>
              </div>

              {storeName && (
                <>
                  <span className="text-white/40">→</span>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                    <Store className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {storeName}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: View switcher + Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View switcher tabs */}
            <div className="hidden md:flex items-center bg-white/10 rounded-lg p-1">
              <button
                onClick={() => switchView('overview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'overview'
                    ? 'bg-white text-indigo-600'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => switchView('operations')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'operations'
                    ? 'bg-white text-indigo-600'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Operaciones
              </button>
            </div>

            {/* Mobile dropdown */}
            <div className="md:hidden relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 hover:bg-white/20 transition-colors"
              >
                <span className="text-sm font-medium">
                  {currentView === 'overview' ? 'Dashboard' : 'Operaciones'}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 min-w-[150px] z-50">
                  <button
                    onClick={() => {
                      switchView('overview');
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      currentView === 'overview'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      switchView('operations');
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      currentView === 'operations'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Operaciones
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-white/20" />

            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Vista Agencia
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
