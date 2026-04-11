import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Utensils, Store, Package, DollarSign, Grid3x3, X, Filter } from 'lucide-react';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { menuService } from '../services/menuService';
import { MenuTable } from '@/components/menu/MenuTable';
import { StoreSelector, type StoreWithPlatform } from '@/components/menu/StoreSelector';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Move StatCard outside component to prevent re-creation
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}

const colorClassesMap = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30',
  green: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30',
} as const;

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorClassesMap[color as keyof typeof colorClassesMap]} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Memoize StatCard to prevent unnecessary re-renders
const MemoizedStatCard = React.memo(StatCard);

export function MenuPage() {
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu-items', selectedStoreIds],
    queryFn: () =>
      menuService.getItems({
        storeIds: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
      }),
  });

  const { data: integrationsData } = useQuery({
    queryKey: ['platform-integrations'],
    queryFn: platformIntegrationsService.list,
  });

  const storesWithPlatform: StoreWithPlatform[] = useMemo(() => {
    if (!menuData?.items) return [];

    const defaultPlatform = integrationsData?.integrations?.[0]?.platform || 'PEDIDOS_YA';

    const uniqueStores = new Map<string, StoreWithPlatform>();
    menuData.items.forEach((item) => {
      item.stores.forEach((store) => {
        if (!uniqueStores.has(store.id)) {
          uniqueStores.set(store.id, {
            id: store.id,
            name: store.name,
            chainName: '',
            platform: defaultPlatform,
          });
        }
      });
    });

    return Array.from(uniqueStores.values());
  }, [menuData, integrationsData]);

  const filteredItems = useMemo(() => {
    if (!menuData?.items) return [];
    if (!selectedCategory) return menuData.items;
    return menuData.items.filter((item) => item.categoryName === selectedCategory);
  }, [menuData, selectedCategory]);

  const totalItems = filteredItems.length;
  const avgPrice = useMemo(() =>
    totalItems > 0
      ? filteredItems.reduce((sum, item) => sum + item.minPrice, 0) / totalItems
      : 0,
  [filteredItems, totalItems]
  );

  const categoryStats = useMemo(() => menuData?.categories || [], [menuData]);
  const uniqueCategories = categoryStats.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (!menuData?.items || menuData.items.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Utensils className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No hay datos de menú
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Conecta una plataforma de delivery y sincroniza tus datos para ver tu menú y analizar el rendimiento de tus productos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Menú y Catálogo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analiza el rendimiento de tus productos y categorías
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <MemoizedStatCard
          title="Productos Totales"
          value={totalItems}
          icon={Grid3x3}
          color="blue"
        />
        <MemoizedStatCard
          title="Categorías"
          value={uniqueCategories}
          icon={Package}
          color="purple"
        />
        <MemoizedStatCard
          title="Precio Promedio"
          value={`$${avgPrice.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <MemoizedStatCard
          title="Locales"
          value={storesWithPlatform.length}
          icon={Store}
          color="orange"
        />
      </div>

      {/* Categories Sidebar + Menu Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Categorías
                  </h3>
                </div>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <X className="h-3 w-3" />
                    Limpiar
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group",
                    !selectedCategory
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  )}
                >
                  <span>Todos</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    !selectedCategory
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}>
                    {menuData.stats.totalItems}
                  </span>
                </button>

                {categoryStats.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group",
                      selectedCategory === category.name
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    )}
                  >
                    <span className="truncate">{category.name}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2",
                      selectedCategory === category.name
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}>
                      {category.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Table Section */}
        <div className="lg:col-span-3 space-y-4">
          {/* Table Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedCategory || 'Todos los Productos'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {totalItems} producto{totalItems !== 1 ? 's' : ''}
                  {selectedCategory && ` en ${selectedCategory}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedStoreIds.length > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0">
                    <Store className="h-3 w-3" />
                    {selectedStoreIds.length} local{selectedStoreIds.length > 1 ? 'es' : ''}
                    <button
                      onClick={() => setSelectedStoreIds([])}
                      className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <StoreSelector
                  stores={storesWithPlatform}
                  selectedStoreIds={selectedStoreIds}
                  onSelectionChange={setSelectedStoreIds}
                  mode="multi"
                />
              </div>
            </div>
          </div>

          {/* Menu Table */}
          <MenuTable items={filteredItems} />
        </div>
      </div>
    </div>
  );
}
