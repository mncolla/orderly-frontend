import { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSuggestions, useApplySuggestion, useDismissSuggestion, useCompleteSuggestion } from '../hooks/useSuggestions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const typeLabels: Record<string, string> = {
  ITEM_OPTIMIZATION: 'Optimización de Item',
  MENU_ACTIVATION: 'Activación de Menú',
  PRICE_ADJUSTMENT: 'Ajuste de Precio',
  PROMOTION: 'Promoción',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function SuggestionsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('ALL');
  const { data, isLoading, error } = useSuggestions();
  const applyMutation = useApplySuggestion();
  const dismissMutation = useDismissSuggestion();
  const completeMutation = useCompleteSuggestion();

  // Modal states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'accept' | 'reject' | 'complete';
    suggestionId: string;
    suggestionTitle: string;
  }>({
    open: false,
    type: 'accept',
    suggestionId: '',
    suggestionTitle: '',
  });

  const handleAccept = (suggestionId: string, suggestionTitle: string) => {
    setConfirmDialog({
      open: true,
      type: 'accept',
      suggestionId,
      suggestionTitle,
    });
  };

  const handleReject = (suggestionId: string, suggestionTitle: string) => {
    setConfirmDialog({
      open: true,
      type: 'reject',
      suggestionId,
      suggestionTitle,
    });
  };

  const handleComplete = (suggestionId: string, suggestionTitle: string) => {
    setConfirmDialog({
      open: true,
      type: 'complete',
      suggestionId,
      suggestionTitle,
    });
  };

  const handleConfirmAction = async () => {
    const { type, suggestionId, suggestionTitle } = confirmDialog;

    try {
      if (type === 'accept') {
        await applyMutation.mutateAsync(suggestionId);
        toast.success(`"${suggestionTitle}" aceptada correctamente`);
      } else if (type === 'reject') {
        await dismissMutation.mutateAsync(suggestionId);
        toast.success(`"${suggestionTitle}" rechazada`);
      } else if (type === 'complete') {
        await completeMutation.mutateAsync(suggestionId);
        toast.success(`"${suggestionTitle}" completada - Reporte final generado`);
      }
      setConfirmDialog({ open: false, type: 'accept', suggestionId: '', suggestionTitle: '' });
    } catch (error) {
      toast.error('Hubo un problema al procesar tu solicitud');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600 dark:text-red-400">
          Error al cargar las sugerencias
        </div>
      </div>
    );
  }

  const stats = data?.stats || { pending: 0, accepted: 0, completed: 0, rejected: 0 };
  const suggestions = data?.suggestions || [];

  const filteredSuggestions = filter === 'ALL'
    ? suggestions
    : suggestions.filter(s => s.status === filter);

  const isOwner = user?.role === 'OWNER';
  const isAgency = user?.role === 'AGENCY' || user?.role === 'ADMIN';

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suggestions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Optimizaciones sugeridas para mejorar tu negocio
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-l-4 border-yellow-500">
            <CardContent className="p-5">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Progreso</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardContent className="p-5">
              <div className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-500">
            <CardContent className="p-5">
              <div className="flex items-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rechazadas</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {status === 'ALL' ? 'Todas' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Suggestions List */}
        <div className="space-y-6">
          {filteredSuggestions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No hay sugerencias
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {filter === 'ALL'
                    ? 'No tienes sugerencias en este momento'
                    : `No hay sugerencias con estado "${filter.toLowerCase()}"`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{suggestion.title}</CardTitle>
                        <Badge className={statusColors[suggestion.status]}>
                          {suggestion.status === 'PENDING' && 'Pendiente'}
                          {suggestion.status === 'ACCEPTED' && 'En Progreso'}
                          {suggestion.status === 'COMPLETED' && 'Completada'}
                          {suggestion.status === 'REJECTED' && 'Rechazada'}
                        </Badge>
                        <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                          {typeLabels[suggestion.type]}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {suggestion.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Items affected */}
                  {suggestion.items && suggestion.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Items afectados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
                          >
                            {item.item.imageUrl && (
                              <img
                                src={item.item.imageUrl}
                                alt={item.item.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.item.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ${item.item.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics Before/After */}
                  {suggestion.status === 'COMPLETED' && suggestion.metricsBefore && suggestion.metricsAfter && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Resultados:
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Ventas antes:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            ${suggestion.metricsBefore.totalSales.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Ventas después:</span>
                          <span className="ml-2 font-medium text-green-600">
                            ${suggestion.metricsAfter.totalSales.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Pedidos antes:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {suggestion.metricsBefore.orderCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Pedidos después:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {suggestion.metricsAfter.orderCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Potential Impact */}
                  {suggestion.potentialImpact && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Impacto potencial:
                      </span>
                      <span className="ml-2 text-sm text-green-600 dark:text-green-400 font-medium">
                        {suggestion.potentialImpact}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {suggestion.status === 'PENDING' && isOwner && (
                      <>
                        <Button
                          onClick={() => handleAccept(suggestion.id, suggestion.title)}
                          disabled={applyMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {applyMutation.isPending ? 'Aplicando...' : 'Aceptar'}
                        </Button>
                        <Button
                          onClick={() => handleReject(suggestion.id, suggestion.title)}
                          disabled={dismissMutation.isPending}
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {dismissMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                        </Button>
                      </>
                    )}

                    {suggestion.status === 'ACCEPTED' && isAgency && (
                      <Button
                        onClick={() => handleComplete(suggestion.id, suggestion.title)}
                        disabled={completeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {completeMutation.isPending ? 'Completando...' : 'Completar Medición'}
                      </Button>
                    )}
                  </div>

                  {/* Created by */}
                  {suggestion.createdBy && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      Creado por {suggestion.createdBy.name} ({suggestion.createdBy.role})
                      {' • '}
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            setConfirmDialog({ ...confirmDialog, open })
          }
          onConfirm={handleConfirmAction}
          title={
            confirmDialog.type === 'accept'
              ? '¿Aceptar sugerencia?'
              : confirmDialog.type === 'reject'
              ? '¿Rechazar sugerencia?'
              : '¿Completar medición?'
          }
          description={
            confirmDialog.type === 'accept'
              ? `Esta acción aceptará "${confirmDialog.suggestionTitle}" y comenzará a medir su impacto.`
              : confirmDialog.type === 'reject'
              ? `Esta acción rechazará "${confirmDialog.suggestionTitle}". Esta acción no se puede deshacer.`
              : `Esta acción completará la medición de "${confirmDialog.suggestionTitle}" y generará el reporte final de impacto.`
          }
          type={confirmDialog.type}
          isPending={
            confirmDialog.type === 'accept'
              ? applyMutation.isPending
              : confirmDialog.type === 'reject'
              ? dismissMutation.isPending
              : completeMutation.isPending
          }
        />
      </div>
    </main>
  );
}
