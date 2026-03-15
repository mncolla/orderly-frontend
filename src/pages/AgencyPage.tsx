import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'APPLIED';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  createdAt: string;
  appliedAt?: string;
  evaluationEnd?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface PlatformIntegration {
  id: string;
  platform: string;
  email: string;
  owner: User;
}

/**
 * PAGINA ÚNICA DE AGENCIA - SIMPLIFICADA
 *
 * Una sola pantalla con:
 * 1. Selector de usuario (dueño/restaurante)
 * 2. Lista de sus sugerencias
 * 3. Formulario inline para crear sugerencias
 */
export function AgencyPage() {
  // Estado
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    type: 'PRICE_CHANGE',
    title: '',
    description: '',
    action: '{}'
  });

  // Cargar usuarios al montar
  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para cargar usuarios (obtener owners)
  const fetchUsers = async () => {
    try {
      // Obtener todas las platformIntegrations
      const response = await api.get('/platform-integrations');
      const data = response as { integrations: PlatformIntegration[] };

      // Extraer usuarios únicos (owners)
      const uniqueUsers = Array.from(
        new Map(data.integrations.map((int: PlatformIntegration) => [int.owner.id, int.owner] as [string, User]))
        .values()
      );

      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Función para cargar sugerencias del usuario seleccionado
  const fetchSuggestions = async (userId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/suggestions?userId=${userId}&status=PENDING,ACCEPTED`);
      const data = response as { suggestions: Suggestion[] };

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cuando se selecciona un usuario, cargar sus sugerencias
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setShowCreateForm(false);
    if (userId) {
      fetchSuggestions(userId);
    } else {
      setSuggestions([]);
    }
  };

  // Crear nueva sugerencia
  const handleCreateSuggestion = async () => {
    if (!selectedUserId || !newSuggestion.title || !newSuggestion.description) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const action = {
        type: newSuggestion.type,
        description: newSuggestion.description,
        priority: 'MEDIUM'
      };

      await api.post('/suggestions', {
        userId: selectedUserId,
        type: newSuggestion.type,
        title: newSuggestion.title,
        description: newSuggestion.description,
        action: JSON.stringify(action)
      });

      // Resetear formulario y recargar sugerencias
      setNewSuggestion({
        type: 'PRICE_CHANGE',
        title: '',
        description: '',
        action: '{}'
      });
      setShowCreateForm(false);

      // Recargar sugerencias
      fetchSuggestions(selectedUserId);

      alert('Sugerencia creada exitosamente');
    } catch (error) {
      console.error('Error creating suggestion:', error);
      alert('Error al crear sugerencia');
    }
  };

  // Obtener badge de estado
  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3" />
          Pendiente
        </span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <TrendingUp className="w-3 h-3" />
          En progreso
        </span>;
      case 'APPLIED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3" />
          Aplicada
        </span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3" />
          Rechazada
        </span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simple */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Panel de Agencia
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selecciona un usuario y gestiona sus sugerencias
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de Usuario */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Usuario</CardTitle>
              <CardDescription>
                Elige el dueño/restaurante para ver y gestionar sus sugerencias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">Usuario</Label>
                  <select
                    id="user-select"
                    value={selectedUserId}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecciona un usuario...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUserId && suggestions.length === 0 && !loading && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Este usuario no tiene sugerencias pendientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Sugerencias */}
        {selectedUserId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sugerencias
              </h2>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? 'Cancelar' : '+ Nueva Sugerencia'}
              </Button>
            </div>

            {/* Formulario de creación inline */}
            {showCreateForm && (
              <Card className="border-2 border-blue-500 dark:border-blue-600">
                <CardHeader>
                  <CardTitle>Crear Nueva Sugerencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateSuggestion(); }} className="space-y-4">
                    <div>
                      <Label htmlFor="suggestion-type">Tipo</Label>
                      <select
                        id="suggestion-type"
                        value={newSuggestion.type}
                        onChange={(e) => setNewSuggestion({...newSuggestion, type: e.target.value as string})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="PRICE_CHANGE">Cambio de Precio</option>
                        <option value="PROMOTION">Promoción</option>
                        <option value="CATEGORY_CHANGE">Categoría</option>
                        <option value="STATUS_CHANGE">Estado</option>
                        <option value="SCHEDULE_CHANGE">Horario</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="suggestion-title">Título</Label>
                      <Input
                        id="suggestion-title"
                        value={newSuggestion.title}
                        onChange={(e) => setNewSuggestion({...newSuggestion, title: e.target.value})}
                        placeholder="Ej: Aumentar precio de hamburguesa"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="suggestion-description">Descripción</Label>
                      <Textarea
                        id="suggestion-description"
                        value={newSuggestion.description}
                        onChange={(e) => setNewSuggestion({...newSuggestion, description: e.target.value})}
                        placeholder="Describe la sugerencia y el beneficio esperado..."
                        rows={3}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Crear Sugerencia
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de sugerencias */}
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Cargando sugerencias...
              </div>
            ) : suggestions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay sugerencias para este usuario
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(suggestion.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(suggestion.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {suggestion.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                          {suggestion.appliedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Aplicada: {new Date(suggestion.appliedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Estado vacío inicial */}
        {!selectedUserId && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                👆 Selecciona un usuario arriba para comenzar
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
