import { useQuery } from '@tanstack/react-query';
import { Utensils, Star, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { storesService } from '../services/storesService';
import { Card, CardContent } from '@/components/ui/card';
import { MenuTable } from '@/components/menu/MenuTable';

export function MenuPage() {
  const { data: storesData, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: storesService.list,
  });

  // Calcular métricas
  const allStoreItems = storesData?.stores?.flatMap((store) =>
    store.storeItems
      .filter((si) => si.active)
      .map((si) => ({
        ...si.item,
        price: si.price,
        active: si.active,
        storeName: store.name,
        categoryName: store.storeCategories.find((sc) => sc.categoryId === si.item.categoryId)?.category.name || 'Uncategorized',
      }))
  ) || [];

  const activeItems = allStoreItems;
  const totalItems = activeItems.length;
  const avgPrice = totalItems > 0
    ? activeItems.reduce((sum, item) => sum + Number(item.price), 0) / totalItems
    : 0;

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

  if (!storesData?.stores || storesData.stores.length === 0) {
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
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Categories</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {storesData.stores.reduce((sum, store) => sum + store._count.storeCategories, 0)}
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
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Stores</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{storesData.count}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Menu Items
          </h2>
          <MenuTable stores={storesData.stores} />
        </div>
      </div>
    </main>
  );
}
