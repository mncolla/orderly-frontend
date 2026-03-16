import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  imageUrl: string | null;
  itemName: string;
}

export function ImageModal({ imageUrl, itemName }: ImageModalProps) {
  if (!imageUrl) {
    return <Eye className="w-4 h-4 text-gray-400 pointer-events-none" />;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`View image for ${itemName}`}
          className="h-7 w-7"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{itemName}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center bg-muted rounded-lg p-4">
          <img
            src={imageUrl}
            alt={itemName}
            className="max-w-full max-h-[60vh] object-contain rounded"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
