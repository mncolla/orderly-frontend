import { Building2, Users, Store, ShoppingCart, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizations } from '../hooks/useOrganizations';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AgencyDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: organizationsData, isLoading, error } = useOrganizations();

  const organizations = organizationsData?.organizations || [];

  // Calculate aggregate stats
  const totalStores = organizations.reduce((sum: number, org: any) => sum + (org._count?.stores || 0), 0);
  const totalOrders = organizations.reduce((sum: number, org: any) => sum + (org._count?.orders || 0), 0);
  const uniqueOwners = new Set(organizations.map((org: any) => org.ownerId)).size;

  // Get recent organizations (last 5)
  const recentOrganizations = [...organizations]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 dark:text-red-400">
          Error al cargar el dashboard
        </div>
      </div>
    );
  }

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard de Agencia
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Bienvenido, {user?.name}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Organizations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Organizaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {organizations.length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Total registradas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owners */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {uniqueOwners}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Usuarios únicos
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Locales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Store className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {totalStores}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Total sincronizados
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-orange-600 dark:text-orange-400 mr-3" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {totalOrders.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Total procesadas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* View Organizations */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/agency/organizations')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Ver Organizaciones
              </CardTitle>
              <CardDescription>
                Gestiona y monitorea todas las organizaciones registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {organizations.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Organizaciones activas
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Create Suggestion */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/agency/suggestions/create')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Crear Sugerencia
              </CardTitle>
              <CardDescription>
                Genera sugerencias optimizadas para las organizaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {organizations.length > 0
                      ? 'Crea una sugerencia para cualquier organización'
                      : 'Registra una organización primero'}
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Organizations */}
        {recentOrganizations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Organizaciones Recientes</CardTitle>
              <CardDescription>
                Últimas organizaciones registradas en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrganizations.map((org: any) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => navigate(`/agency/organizations/${org.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {org.owner.name} • {org.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 mr-1" />
                        {org._count?.stores || 0}
                      </div>
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {org._count?.orders || 0}
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
              {organizations.length > 5 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/agency/organizations')}
                  >
                    Ver todas las organizaciones
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {organizations.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No hay organizaciones registradas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Las organizaciones aparecerán aquí cuando los owners se registren en la plataforma.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <p>Los owners pueden registrarse en el formulario de registro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
