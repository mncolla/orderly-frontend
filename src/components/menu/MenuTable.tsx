import type { MenuItem } from '@/services/menuService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StoresPopover, type StoreInfo } from './StoresPopover';
import { ImageModal } from './ImageModal';
import { ItemOptionsModal } from './ItemOptionsModal';
import { ListChecks } from 'lucide-react';
import { useState, memo, useCallback } from 'react';

interface MenuTableProps {
  items: MenuItem[];
}

// Move formatPrice outside component to prevent re-creation
const formatPrice = (item: MenuItem): string => {
  if (item.minPrice === item.maxPrice) {
    return `$${item.minPrice.toFixed(2)}`;
  }
  return `$${item.minPrice.toFixed(2)} - $${item.maxPrice.toFixed(2)}`;
};

// Memoize the entire table to prevent re-renders from parent
export const MenuTable = memo(function MenuTable({ items }: MenuTableProps) {
  const [selectedItem, setSelectedItem] = useState<{
    storeId: string;
    itemName: string;
    itemOptionIds?: string[];
  } | null>(null);

  const handleOpenOptions = useCallback((storeId: string, itemName: string, itemOptionIds?: string[]) => {
    setSelectedItem({ storeId, itemName, itemOptionIds });
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No menu items found. Sync your stores to see menu items.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell w-16">Img</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="hidden md:table-cell max-w-xs">
                Description
              </TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden sm:table-cell">Options</TableHead>
              <TableHead>Stores</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const firstStoreId = item.stores[0]?.id;
              const optionCount = item.itemOptionIds?.length || 0;

              return (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No img</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {item.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline">{item.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(item)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {firstStoreId && (
                      <button
                        onClick={() => handleOpenOptions(firstStoreId, item.name, item.itemOptionIds)}
                        className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!firstStoreId}
                      >
                        <div className="flex items-center gap-1.5">
                          <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          {optionCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                                <span className="font-semibold">{optionCount}</span>
                              </Badge>
                              <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                                opción{optionCount !== 1 ? 'es' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 flex items-center gap-1">
                              <span>Sin opciones</span>
                              <span className="text-gray-400">→</span>
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <StoresPopover stores={item.stores as StoreInfo[]} storeCount={item.storeCount} />
                  </TableCell>
                  <TableCell>
                    <ImageModal imageUrl={item.imageUrl} itemName={item.name} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Item Options Modal */}
      {selectedItem && (
        <ItemOptionsModal
          storeId={selectedItem.storeId}
          itemName={selectedItem.itemName}
          itemOptionIds={selectedItem.itemOptionIds}
          open={!!selectedItem}
          onOpenChange={(open) => !open && handleCloseModal()}
        />
      )}
    </>
  );
});
