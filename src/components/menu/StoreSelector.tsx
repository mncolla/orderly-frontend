import { useState, useMemo } from 'react';
import { Search, Store, X, Check, Filter } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface StoreWithPlatform {
  id: string;
  name: string;
  chainName: string;
  platform: string;
}

interface StoreSelectorProps {
  stores: StoreWithPlatform[];
  selectedStoreIds: string[];
  onSelectionChange: (storeIds: string[]) => void;
  mode?: 'multi' | 'single';
  triggerClassName?: string;
}

const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  PEDIDOS_YA: 'PedidosYa',
  RAPPI: 'Rappi',
  GLOVO: 'Glovo',
  UBER_EATS: 'Uber Eats',
};

export function StoreSelector({
  stores,
  selectedStoreIds,
  onSelectionChange,
  mode = 'multi',
  triggerClassName,
}: StoreSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const groupedStores = useMemo(() => {
    const groups = new Map<string, Map<string, StoreWithPlatform[]>>();

    stores.forEach((store) => {
      const platform = store.platform;
      if (!groups.has(platform)) {
        groups.set(platform, new Map());
      }
      const chainGroups = groups.get(platform)!;

      const chainName = store.chainName || 'Other';
      if (!chainGroups.has(chainName)) {
        chainGroups.set(chainName, []);
      }
      chainGroups.get(chainName)!.push(store);
    });

    return groups;
  }, [stores]);

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;

    const query = searchQuery.toLowerCase();
    return stores.filter(
      (store) =>
        store.name.toLowerCase().includes(query) ||
        store.chainName?.toLowerCase().includes(query) ||
        PLATFORM_DISPLAY_NAMES[store.platform]?.toLowerCase().includes(query)
    );
  }, [stores, searchQuery]);

  const filteredGroupedStores = useMemo(() => {
    const groups = new Map<string, Map<string, StoreWithPlatform[]>>();

    filteredStores.forEach((store) => {
      const platform = store.platform;
      if (!groups.has(platform)) {
        groups.set(platform, new Map());
      }
      const chainGroups = groups.get(platform)!;

      const chainName = store.chainName || 'Other';
      if (!chainGroups.has(chainName)) {
        chainGroups.set(chainName, []);
      }
      chainGroups.get(chainName)!.push(store);
    });

    return groups;
  }, [filteredStores]);

  const singlePlatform = groupedStores.size === 1;

  const handleToggleStore = (storeId: string) => {
    if (mode === 'single') {
      onSelectionChange([storeId]);
      return;
    }

    if (selectedStoreIds.includes(storeId)) {
      onSelectionChange(selectedStoreIds.filter((id) => id !== storeId));
    } else {
      onSelectionChange([...selectedStoreIds, storeId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStoreIds.length === filteredStores.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredStores.map((s) => s.id));
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isAllSelected = filteredStores.length > 0 && selectedStoreIds.length === filteredStores.length;

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start gap-2 border-2 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all',
            selectedStoreIds.length > 0 && 'border-blue-600 bg-blue-50 dark:bg-blue-900/20',
            triggerClassName
          )}
        >
          <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="flex-1 text-left font-medium">
            {selectedStoreIds.length === 0
              ? 'Filtrar por local'
              : `${selectedStoreIds.length} local${selectedStoreIds.length > 1 ? 'es' : ''}`}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-screen">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DrawerTitle className="text-gray-900 dark:text-white">
                Seleccionar Locales
              </DrawerTitle>
            </div>
            <div className="flex gap-2">
              {selectedStoreIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  Limpiar
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex flex-col h-full">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar locales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {mode === 'multi' && filteredStores.length > 0 && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="border-blue-600 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer font-medium text-gray-900 dark:text-white">
                  {isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'} ({filteredStores.length})
                </Label>
              </div>
            )}
          </div>

          {/* Store List */}
          <ScrollArea className="flex-1 px-4">
            <RadioGroup value={selectedStoreIds[0] || ''} onValueChange={handleToggleStore}>
              <div className="py-4 space-y-4">
                {Array.from(filteredGroupedStores.entries()).map(([platform, chainGroups]) => (
                  <div key={platform} className="space-y-3">
                    {/* Platform Section */}
                    {!singlePlatform && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs font-medium">
                          {PLATFORM_DISPLAY_NAMES[platform] || platform}
                        </Badge>
                        <Separator className="flex-1" />
                      </div>
                    )}

                    {/* Chain Groups */}
                    {Array.from(chainGroups.entries()).map(([chainName, chainStores]) => (
                      <div key={chainName} className="space-y-2">
                        {chainName !== 'Other' && (
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            {chainName}
                          </p>
                        )}
                        <div className="space-y-1">
                          {chainStores.map((store) => {
                            const isSelected = selectedStoreIds.includes(store.id);

                            return (
                              <div
                                key={store.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                )}
                                onClick={() => handleToggleStore(store.id)}
                              >
                                {mode === 'multi' ? (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => {
                                      handleToggleStore(store.id);
                                    }}
                                    className={cn(
                                      "border-2",
                                      isSelected
                                        ? "border-white bg-white text-blue-600"
                                        : "border-gray-300 dark:border-gray-600"
                                    )}
                                    aria-label={`Select ${store.name}`}
                                  />
                                ) : (
                                  <RadioGroupItem
                                    value={store.id}
                                    id={`store-${store.id}`}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm font-medium truncate",
                                    isSelected ? "text-white" : "text-gray-900 dark:text-white"
                                  )}>
                                    {store.name}
                                  </p>
                                  {store.chainName && store.chainName !== 'Other' && (
                                    <p className={cn(
                                      "text-xs truncate",
                                      isSelected ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                    )}>
                                      {store.chainName}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-white flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {filteredStores.length === 0 && (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron locales
                    </p>
                  </div>
                )}
              </div>
            </RadioGroup>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            <DrawerClose asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 font-medium">
                Aplicar {selectedStoreIds.length > 0 && `(${selectedStoreIds.length} local${selectedStoreIds.length > 1 ? 'es' : ''})`}
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
