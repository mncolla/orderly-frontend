import { Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface StoreInfo {
  id: string;
  name: string;
  price: number;
}

interface StoresPopoverProps {
  stores: StoreInfo[];
  storeCount: number;
}

export function StoresPopover({ stores, storeCount }: StoresPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-7">
          <Store className="w-3 h-3" />
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            {storeCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Available in {storeCount} store{storeCount !== 1 ? 's' : ''}:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex justify-between items-center text-sm py-1"
              >
                <span className="text-gray-900 dark:text-white truncate flex-1 pr-2">
                  {store.name}
                </span>
                <span className="text-muted-foreground font-medium whitespace-nowrap">
                  ${store.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
