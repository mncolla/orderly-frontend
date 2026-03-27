import { useState, useMemo } from 'react';
import { Search, Store, X, Check } from 'lucide-react';
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

  // Group stores by platform and chainName
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

  // Filter stores based on search
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

  // Group filtered stores
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

  // Check if all stores are from the same platform
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
          className={cn('justify-start gap-2', triggerClassName)}
        >
          <Store className="h-4 w-4" />
          <span className="flex-1 text-left">
            {selectedStoreIds.length === 0
              ? 'Select Stores'
              : `${selectedStoreIds.length} store${selectedStoreIds.length > 1 ? 's' : ''} selected`}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="border-b px-4 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle>Select Stores</DrawerTitle>
            <div className="flex gap-2">
              {selectedStoreIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex flex-col h-full">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {mode === 'multi' && filteredStores.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all stores"
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer">
                  {isAllSelected ? 'Deselect All' : 'Select All'} ({filteredStores.length})
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
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {PLATFORM_DISPLAY_NAMES[platform] || platform}
                          </Badge>
                          <Separator className="flex-1" />
                        </div>
                      </>
                    )}

                    {/* Chain Groups */}
                    {Array.from(chainGroups.entries()).map(([chainName, chainStores]) => (
                      <div key={chainName} className="space-y-2">
                        {chainName !== 'Other' && (
                          <p className="text-sm font-medium text-muted-foreground">
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
                                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                                  isSelected && "bg-muted border-primary"
                                )}
                                onClick={() => handleToggleStore(store.id)}
                              >
                                {mode === 'multi' ? (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => {
                                      handleToggleStore(store.id);
                                    }}
                                    aria-label={`Select ${store.name}`}
                                  />
                                ) : (
                                  <RadioGroupItem
                                    value={store.id}
                                    id={`store-${store.id}`}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{store.name}</p>
                                  {store.chainName && store.chainName !== 'Other' && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {store.chainName}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
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
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No stores found</p>
                  </div>
                )}
              </div>
            </RadioGroup>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <DrawerClose asChild>
              <Button className="w-full">
                Done {selectedStoreIds.length > 0 && `(${selectedStoreIds.length})`}
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
