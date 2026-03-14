import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Building2, Mail, MapPin, Store, ShoppingCart, TrendingUp, Settings } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AgencyOrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const organizationId = params.id;

  const { data: organizationData, isLoading, error } = useOrganization(organizationId);
  const organization = organizationData?.organization;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Cargando organización...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 dark:text-red-400">
          Error al cargar la organización
        </div>
      </div>
    );
  }

  const objectives = organization.settings?.objectives || [];
  const stores = organization.stores || [];

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/agency/organizations')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Organizaciones
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {organization.name}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {organization.country}
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {organization.owner?.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate(`/overview?organizationId=${organization.id}`)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Overview
              </Button>
              <Button onClick={() => navigate(`/agency/suggestions/create?organizationId=${organization.id}`)}>
                <Settings className="h-4 w-4 mr-2" />
                Crear Sugerencia
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Locales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Store className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stores.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Órdenes Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stores.reduce((sum: number, store: any) => sum + (store._count?.orders || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Objetivos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {objectives.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-2" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organization.owner?.name || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives */}
        {objectives.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Objetivos Configurados</CardTitle>
              <CardDescription>
                Metas y objetivos establecidos por el owner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objectives.map((objective: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {objective.type === 'sales' && 'Ventas'}
                          {objective.type === 'margins' && 'Márgenes'}
                          {objective.type === 'cancellation_rate' && 'Tasa de Cancelación'}
                          {objective.type === 'average_ticket' && 'Ticket Promedio'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Objetivo: {objective.target}{objective.type === 'cancellation_rate' ? '%' : objective.type === 'sales' || objective.type === 'average_ticket' ? '$' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={objective.frequency === 'daily' ? 'default' : 'secondary'}>
                      {objective.frequency === 'daily' && 'Diario'}
                      {objective.frequency === 'weekly' && 'Semanal'}
                      {objective.frequency === 'monthly' && 'Mensual'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stores */}
        {stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Locales</CardTitle>
              <CardDescription>
                Todos los locales de esta organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Categorías</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store: any) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{store.platform}</Badge>
                      </TableCell>
                      <TableCell>{store.country}</TableCell>
                      <TableCell>{store._count?.orders || 0}</TableCell>
                      <TableCell>{store._count?.items || 0}</TableCell>
                      <TableCell>{store._count?.categories || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* No Stores Message */}
        {stores.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay locales configurados
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
 Esta organización aún no tiene sincronizados sus locales de delivery.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
