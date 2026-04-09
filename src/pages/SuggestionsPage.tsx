import { useState } from 'react';
import { Lightbulb, CheckCircle2, Clock, TrendingUp, XCircle, Sparkles, Target, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSuggestions, useApplySuggestion, useDismissSuggestion, useCompleteSuggestion } from '../hooks/useSuggestions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  PENDING: { color: 'yellow', label: 'Pendiente', icon: Clock },
  ACCEPTED: { color: 'blue', label: 'En Progreso', icon: TrendingUp },
  APPLIED: { color: 'green', label: 'Aplicada', icon: CheckCircle2 },
  REJECTED: { color: 'red', label: 'Rechazada', icon: XCircle },
};

export function SuggestionsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('ALL');
  const { data, isLoading, error } = useSuggestions();
  const applyMutation = useApplySuggestion();
  const dismissMutation = useDismissSuggestion();
  const completeMutation = useCompleteSuggestion();

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sugerencias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Error al cargar las sugerencias</p>
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

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => {
    const colorClasses = {
      yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/30',
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30',
      green: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30',
      red: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Sugerencias
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Optimizaciones sugeridas para mejorar tu negocio
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="En Progreso"
          value={stats.accepted}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Completadas"
          value={stats.completed}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Rechazadas"
          value={stats.rejected}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {['ALL', 'PENDING', 'ACCEPTED', 'APPLIED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${filter === status
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                }
              `}
            >
              {status === 'ALL' ? 'Todas' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay sugerencias
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'ALL'
                ? 'No tienes sugerencias en este momento'
                : `No hay sugerencias con estado "${statusConfig[filter]?.label || filter}"`
              }
            </p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => {
            const statusInfo = statusConfig[suggestion.status] || statusConfig.PENDING;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={suggestion.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          suggestion.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          suggestion.status === 'ACCEPTED' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          suggestion.status === 'APPLIED' ? 'bg-green-100 dark:bg-green-900/30' :
                          'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          <StatusIcon className={`h-5 w-5 ${
                            suggestion.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                            suggestion.status === 'ACCEPTED' ? 'text-blue-600 dark:text-blue-400' :
                            suggestion.status === 'APPLIED' ? 'text-green-600 dark:text-green-400' :
                            'text-red-600 dark:text-red-400'
                          }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {suggestion.title}
                        </h3>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>

                  {/* ITEM_IMPROVEMENT: Before/After Comparison */}
                  {suggestion.type === 'ITEM_IMPROVEMENT' && suggestion.action && (
                    <div className="mb-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                          Cambios Propuestos
                        </p>
                      </div>

                      {/* Calcular si hay cambios reales */}
                      {(() => {
                        const hasPriceChange = suggestion.action.proposedPrice && suggestion.action.proposedPrice !== suggestion.action.currentPrice;
                        const hasDescriptionChange = suggestion.action.proposedDescription && suggestion.action.proposedDescription !== suggestion.action.currentDescription;
                        const hasImageChange = suggestion.action.proposedImageUrl && suggestion.action.proposedImageUrl !== suggestion.action.currentImageUrl;
                        const hasAnyChanges = hasPriceChange || hasDescriptionChange || hasImageChange;

                        // Si no hay cambios, mostrar mensaje
                        if (!hasAnyChanges) {
                          return (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                No se detectaron cambios en esta sugerencia
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Antes */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">ANTES</span>
                                </div>
                              </div>

                              {/* Imagen actual */}
                              {suggestion.action.currentImageUrl && (
                                <div className="mb-3">
                                  <img
                                    src={suggestion.action.currentImageUrl}
                                    alt="Imagen actual"
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                  />
                                </div>
                              )}

                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Producto:</span>
                                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {suggestion.action.itemName}
                                  </p>
                                </div>

                                {/* Solo mostrar precio si va a cambiar */}
                                {hasPriceChange && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                                      ${suggestion.action.currentPrice}
                                    </p>
                                  </div>
                                )}

                                {/* Solo mostrar descripción si va a cambiar */}
                                {hasDescriptionChange && suggestion.action.currentDescription && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Descripción:</span>
                                    <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm leading-relaxed">
                                      {suggestion.action.currentDescription}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Después */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="px-3 py-1 bg-blue-600 rounded-full">
                                  <span className="text-xs font-semibold text-white">DESPUÉS</span>
                                </div>
                              </div>

                              {/* Nueva imagen solo si cambió */}
                              {hasImageChange && suggestion.action.proposedImageUrl && (
                                <div className="mb-3">
                                  <img
                                    src={suggestion.action.proposedImageUrl}
                                    alt="Nueva imagen"
                                    className="w-full h-32 object-cover rounded-lg border-2 border-blue-500 dark:border-blue-400"
                                  />
                                </div>
                              )}

                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Producto:</span>
                                  <p className="font-bold text-gray-900 dark:text-white mt-1">
                                    {suggestion.action.itemName}
                                  </p>
                                </div>

                                {/* Precio - solo si cambió */}
                                {hasPriceChange && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-gray-500 line-through">${suggestion.action.currentPrice}</span>
                                                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg font-bold text-green-700 dark:text-green-400">
                                        ${suggestion.action.proposedPrice}
                                                                      </span>
                                                                    </div>
                                                                  </div>
                                                                )}

                                                                {/* Descripción - solo si cambió */}
                                                                {hasDescriptionChange && suggestion.action.proposedDescription && (
                                                                  <div>
                                                                    <span className="text-gray-600 dark:text-gray-400">Descripción:</span>
                                                                    <p className="text-blue-700 dark:text-blue-300 mt-1 text-sm leading-relaxed font-medium">
                                                                      {suggestion.action.proposedDescription}
                                                                    </p>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        );
                                                      })()}

                                                      {/* Warning */}
                                                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                                        <div className="flex items-start gap-2">
                                                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">Importante:</span> Al aceptar esta sugerencia, los cambios se aplicarán directamente en PedidosYa y serán visibles para los clientes de inmediato.
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}

                  {/* Items affected */}
                  {suggestion.items && suggestion.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Items afectados:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {suggestion.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-600"
                          >
                            {item.item.imageUrl && (
                              <img
                                src={item.item.imageUrl}
                                alt={item.item.name}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
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
                  {suggestion.status === 'APPLIED' && suggestion.metricsBefore && suggestion.metricsAfter && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Resultados de la Optimización
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Ventas antes:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            ${suggestion.metricsBefore.totalSales.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Ventas después:</span>
                          <span className="ml-2 font-medium text-green-600">
                            ${suggestion.metricsAfter.totalSales.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Pedidos antes:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {suggestion.metricsBefore.orderCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Pedidos después:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {suggestion.metricsAfter.orderCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Potential Impact */}
                  {suggestion.potentialImpact && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Impacto potencial:
                          </span>
                          <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                            {suggestion.potentialImpact}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {suggestion.status === 'PENDING' && isOwner && (
                      <>
                        <Button
                          onClick={() => handleAccept(suggestion.id, suggestion.title)}
                          disabled={applyMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 font-medium"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {applyMutation.isPending ? 'Aplicando...' : 'Aceptar'}
                        </Button>
                        <Button
                          onClick={() => handleReject(suggestion.id, suggestion.title)}
                          disabled={dismissMutation.isPending}
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                        >
                          {dismissMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                        </Button>
                      </>
                    )}

                    {suggestion.status === 'ACCEPTED' && isAgency && (
                      <Button
                        onClick={() => handleComplete(suggestion.id, suggestion.title)}
                        disabled={completeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 font-medium"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {completeMutation.isPending ? 'Completando...' : 'Completar Medición'}
                      </Button>
                    )}
                  </div>

                  {/* Created by */}
                  {suggestion.createdBy && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      Creado por {suggestion.createdBy.name} ({suggestion.createdBy.role})
                      {' • '}
                      {new Date(suggestion.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
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
  );
}
