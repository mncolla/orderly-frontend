import { useState } from 'react';
import { Search, Building2, Users, Store, Globe } from 'lucide-react';
import { useOrganizations } from '../hooks/useOrganizations';
import { OrganizationCard } from '../components/OrganizationCard';

export function AgencyOrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const { data: organizationsData, isLoading, error } = useOrganizations(
    countryFilter !== 'all' ? { country: countryFilter } : undefined
  );

  const organizations = organizationsData?.organizations || [];

  // Filter organizations by search term
  const filteredOrganizations = organizations.filter((org: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.owner.name.toLowerCase().includes(searchLower) ||
      org.owner.email.toLowerCase().includes(searchLower)
    );
  });

  // Get unique countries
  const countries = Array.from(new Set(organizations.map((org: any) => org.country)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Cargando organizaciones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 dark:text-red-400">
          Error al cargar las organizaciones
        </div>
      </div>
    );
  }

  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Building2 className="h-8 w-8 mr-3" />
                Organizaciones
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gestiona y monitorea todas las organizaciones
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Organizaciones</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {organizations.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Locales</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {organizations.reduce((sum: number, org: any) => sum + (org._count?.stores || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Owners</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {new Set(organizations.map((org: any) => org.ownerId)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, owner o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* Country Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
            >
              <option value="all">Todos los países</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrganizations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || countryFilter !== 'all' ? 'No se encontraron organizaciones' : 'No hay organizaciones registradas'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || countryFilter !== 'all'
                ? 'Intenta con otros filtros de búsqueda'
                : 'Las organizaciones aparecerán aquí cuando los owners se registren'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org: any) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
