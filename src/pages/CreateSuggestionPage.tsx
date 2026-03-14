import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Lightbulb, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizations } from '../hooks/useOrganizations';
import { useCreateSuggestion, useAnalyzeSuggestions } from '../hooks/useSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const suggestionTypes = [
  { value: 'ITEM_OPTIMIZATION', label: 'Optimización de Item', description: 'Mejorar rendimiento de productos específicos' },
  { value: 'MENU_ACTIVATION', label: 'Activación de Menú', description: 'Activar o promocionar categorías de menú' },
  { value: 'PRICE_ADJUSTMENT', label: 'Ajuste de Precio', description: 'Ajustar precios para optimizar márgenes' },
  { value: 'PROMOTION', label: 'Promoción', description: 'Crear promociones o descuentos' },
];

export function CreateSuggestionPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: organizationsData } = useOrganizations();
  const createMutation = useCreateSuggestion();
  const analyzeMutation = useAnalyzeSuggestions();

  // Get organizationId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedOrgId = searchParams.get('organizationId');

  const organizations = organizationsData?.organizations || [];

  // Form state
  const [organizationId, setOrganizationId] = useState(preselectedOrgId || '');
  const [type, setType] = useState('ITEM_OPTIMIZATION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [autoApply, setAutoApply] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (preselectedOrgId && !organizationId) {
      setOrganizationId(preselectedOrgId);
    }
  }, [preselectedOrgId, organizationId]);

  const handleAnalyze = async () => {
    if (!organizationId) {
      toast.error('Selecciona una organización primero');
      return;
    }

    try {
      const result = await analyzeMutation.mutateAsync(organizationId);
      setAiSuggestions(result.suggestions || []);

      if (result.suggestions.length === 0) {
        toast('Análisis completado: No se detectaron oportunidades de optimización');
      } else {
        toast.success(`Se generaron ${result.suggestions.length} sugerencias automáticas`);
      }
    } catch (error) {
      toast.error('Hubo un problema al analizar la organización');
    }
  };

  const useSuggestion = (suggestion: any) => {
    setType(suggestion.type);
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    if (suggestion.itemIds) {
      // Note: En una versión futura podríamos pre-seleccionar los items
      setContext(`Items afectados: ${suggestion.itemIds.length}\nImpacto potencial: ${suggestion.potentialImpact || 'N/A'}`);
    }
  };

  if (!user || (user.role !== 'AGENCY' && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 dark:text-red-400">
          No tienes permisos para crear sugerencias
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!organizationId) newErrors.organizationId = 'Selecciona una organización';
    if (!title.trim()) newErrors.title = 'El título es requerido';
    if (!description.trim()) newErrors.description = 'La descripción es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createMutation.mutateAsync({
        organizationId,
        type,
        title,
        description,
        context: context || undefined,
        autoApply,
      });

      toast.success('Sugerencia creada - Enviada al owner');

      // Navigate back to suggestions or organization detail
      if (preselectedOrgId) {
        navigate(`/agency/organizations/${preselectedOrgId}`);
      } else {
        navigate('/agency/organizations');
      }
    } catch (error) {
      toast.error('Hubo un problema al crear la sugerencia');
    }
  };

  const selectedOrg = organizations.find((org: any) => org.id === organizationId);

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/agency/organizations')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Crear Sugerencia
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Crea una nueva sugerencia de optimización para una organización
              </p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        {organizationId && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Análisis Automático con IA
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Genera sugerencias automáticamente basadas en análisis de datos
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {analyzeMutation.isPending ? 'Analizando...' : 'Analizar Organización'}
                </Button>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Sugerencias Generadas ({aiSuggestions.length})
                  </h4>
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition-colors"
                      onClick={() => useSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {suggestion.title}
                            </h5>
                            <Badge
                              variant="outline"
                              className={
                                suggestion.priority === 'HIGH'
                                  ? 'border-red-500 text-red-700 dark:text-red-300'
                                  : suggestion.priority === 'MEDIUM'
                                  ? 'border-yellow-500 text-yellow-700 dark:text-yellow-300'
                                  : 'border-blue-500 text-blue-700 dark:text-blue-300'
                              }
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                          {suggestion.potentialImpact && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                              💡 {suggestion.potentialImpact}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            useSuggestion(suggestion);
                          }}
                        >
                          Usar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Define los detalles básicos de la sugerencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization */}
              <div>
                <Label htmlFor="organization">Organización *</Label>
                <select
                  id="organization"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecciona una organización</option>
                  {organizations.map((org: any) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.country})
                    </option>
                  ))}
                </select>
                {errors.organizationId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organizationId}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <Label htmlFor="type">Tipo de Sugerencia *</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {suggestionTypes.map((sugType) => (
                    <option key={sugType.value} value={sugType.value}>
                      {sugType.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {suggestionTypes.find(t => t.value === type)?.description}
                </p>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Ajustar precios de combos"
                  className="mt-2"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe la sugerencia en detalle..."
                  rows={4}
                  className="mt-2"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>

              {/* Context */}
              <div>
                <Label htmlFor="context">Contexto (opcional)</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Información adicional sobre el contexto de esta sugerencia..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Auto Apply */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoApply"
                  checked={autoApply}
                  onChange={(e) => setAutoApply(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="autoApply" className="cursor-pointer">
                  Aplicar automáticamente cuando el owner acepte
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Organization Info */}
          {selectedOrg && (
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {selectedOrg.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedOrg.country} • {selectedOrg._count?.stores || 0} locales
                    </p>
                  </div>
                  <Badge variant="outline">Organización seleccionada</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agency/organizations')}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Sugerencia'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
