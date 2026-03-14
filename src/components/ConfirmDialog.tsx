import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  type: 'accept' | 'reject' | 'complete';
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  type,
  isPending = false,
}: ConfirmDialogProps) {
  const config = {
    accept: {
      icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
      confirmText: 'Aceptar',
      confirmVariant: 'default' as const,
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
    },
    reject: {
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      confirmText: 'Rechazar',
      confirmVariant: 'destructive' as const,
      confirmClass: 'bg-red-600 hover:bg-red-700',
    },
    complete: {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      confirmText: 'Completar',
      confirmVariant: 'default' as const,
      confirmClass: 'bg-green-600 hover:bg-green-700',
    },
  };

  const currentConfig = config[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {currentConfig.icon}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            className={currentConfig.confirmClass}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Procesando...' : currentConfig.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
