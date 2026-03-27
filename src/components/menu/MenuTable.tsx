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

interface MenuTableProps {
  items: MenuItem[];
}

export function MenuTable({ items }: MenuTableProps) {
  const formatPrice = (item: MenuItem): string => {
    if (item.minPrice === item.maxPrice) {
      return `$${item.minPrice.toFixed(2)}`;
    }
    return `$${item.minPrice.toFixed(2)} - $${item.maxPrice.toFixed(2)}`;
  };

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
            <TableHead>Stores</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
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
              <TableCell>
                <StoresPopover stores={item.stores as StoreInfo[]} storeCount={item.storeCount} />
              </TableCell>
              <TableCell>
                <ImageModal imageUrl={item.imageUrl} itemName={item.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
