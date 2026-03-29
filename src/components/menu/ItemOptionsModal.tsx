import { useState } from 'react';
import { ListChecks, X, Package, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { itemOptionsService, type ItemOption } from '@/services/itemOptionsService';
import { useQuery } from '@tanstack/react-query';

interface ItemOptionsModalProps {
  storeId: string;
  itemName: string;
  itemOptionIds?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemOptionsModal({
  storeId,
  itemName,
  itemOptionIds,
  open,
  onOpenChange,
}: ItemOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<ItemOption | null>(null);

  // Fetch all options for the store
  const { data: optionsData, isLoading } = useQuery({
    queryKey: ['item-options', storeId],
    queryFn: () => itemOptionsService.getOptions(storeId),
    enabled: open && !!storeId,
  });

  // Filter options that belong to this item (if itemOptionIds provided)
  const itemOptions = itemOptionIds
    ? optionsData?.options.filter((opt) => itemOptionIds.includes(opt.externalId)) || []
    : optionsData?.options || [];

  const totalOptions = itemOptions.length;
  const totalValues = itemOptions.reduce((sum, opt) => sum + opt.values.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Opciones del Producto</DialogTitle>
              <DialogDescription className="text-sm">
                {itemName}
                {totalOptions > 0 && (
                  <span className="ml-2">
                    <Badge variant="secondary" className="ml-2">
                      {totalOptions} opción{totalOptions !== 1 ? 'es' : ''}
                    </Badge>
                    <Badge variant="secondary" className="ml-1">
                      {totalValues} valor{totalValues !== 1 ? 'es' : ''}
                    </Badge>
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : totalOptions === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Este producto no tiene opciones disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {itemOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  isExpanded={selectedOption?.id === option.id}
                  onToggle={() => setSelectedOption(selectedOption?.id === option.id ? null : option)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface OptionCardProps {
  option: ItemOption;
  isExpanded: boolean;
  onToggle: () => void;
}

function OptionCard({ option, isExpanded, onToggle }: OptionCardProps) {
  const getTypeLabel = (type: string) => {
    return type === 'CHOICES' ? 'Elección' : 'Bundle';
  };

  const getTypeColor = (type: string) => {
    return type === 'CHOICES'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Option Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {option.name}
              </span>
              <Badge variant="outline" className={getTypeColor(option.type)}>
                {getTypeLabel(option.type)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {option.minQuantity === option.maxQuantity
                  ? `${option.minQuantity} requerida`
                  : `${option.minQuantity} - ${option.maxQuantity || '∞'}`}
              </span>
              <span>•</span>
              <span>{option.values.length} valor{option.values.length !== 1 ? 'es' : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{option.values.length}</Badge>
          {isExpanded ? (
            <X className="h-4 w-4 text-gray-500" />
          ) : (
            <Package className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Option Values */}
      {isExpanded && (
        <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-4">
          <div className="space-y-2">
            {option.values.map((value) => (
              <div
                key={value.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {value.available ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {value.name}
                  </span>
                  {value.availabilityStatus && (
                    <Badge variant="outline" className="text-xs">
                      {value.availabilityStatus}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {value.unitPrice > 0 && (
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${value.unitPrice.toFixed(2)}
                    </span>
                  )}
                  {!value.available && (
                    <Badge variant="destructive" className="text-xs">
                      No disponible
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
