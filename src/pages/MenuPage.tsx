import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Utensils, Loader2, Store, Package, DollarSign } from 'lucide-react';
import { platformIntegrationsService } from '../services/platformIntegrationsService';
import { menuService } from '../services/menuService';
import { Card, CardContent } from '@/components/ui/card';
import { MenuTable } from '@/components/menu/MenuTable';
import { StoreSelector, type StoreWithPlatform } from '@/components/menu/StoreSelector';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MenuPage() {
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch menu items from backend with filters
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

  // Get store list for selector from menu items
  const storesWithPlatform: StoreWithPlatform[] = useMemo(() => {
    if (!menuData?.items) return [];

    const defaultPlatform = integrationsData?.integrations?.[0]?.platform || 'PEDIDOS_YA';

    // Extract unique stores from menu items
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

  // Filter items by selected category (client-side)
  const filteredItems = useMemo(() => {
    if (!menuData?.items) return [];
    if (!selectedCategory) return menuData.items;
    return menuData.items.filter((item) => item.categoryName === selectedCategory);
  }, [menuData, selectedCategory]);

  const totalItems = filteredItems.length;
  const avgPrice =
    totalItems > 0
      ? filteredItems.reduce((sum, item) => sum + item.minPrice, 0) / totalItems
      : 0;

  const categoryStats = menuData?.categories || [];
  const uniqueCategories = categoryStats.length;

  // Handle clear selections
  const handleClearStoreSelection = () => {
    setSelectedStoreIds([]);
  };

  const handleClearCategorySelection = () => {
    setSelectedCategory(null);
  };

  if (isLoading) {
    return (
      <main className="py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </main>
    );
  }

  if (!menuData?.items || menuData.items.length === 0) {
    return (
      <main className="py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay datos de menú
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Conecta una plataforma y sincroniza tus datos para ver tu menú.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menu / Catalog Performance</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Analyze your menu items and catalog performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Utensils className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Items</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{totalItems}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Categories</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {uniqueCategories}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Avg. Price</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      ${avgPrice.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Store className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Stores</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {storesWithPlatform.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Sidebar + Menu Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Categories
                </h3>
                {selectedCategory && (
                  <button
                    onClick={handleClearCategorySelection}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !selectedCategory
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  All Items
                  <span className="ml-2 text-xs opacity-70">({menuData.stats.totalItems})</span>
                </button>
                {categoryStats.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === category.name
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{category.name}</span>
                      <span className="ml-2 text-xs opacity-70 flex-shrink-0">
                        ({category.itemCount})
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Table Section */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedCategory || 'All Items'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                  {selectedCategory && ` in ${selectedCategory}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedStoreIds.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedStoreIds.length} store{selectedStoreIds.length > 1 ? 's' : ''} filtered
                    <button
                      onClick={handleClearStoreSelection}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
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
            <MenuTable items={filteredItems} />
          </div>
        </div>
      </div>
    </main>
  );
}
