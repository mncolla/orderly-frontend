import { Calendar } from 'lucide-react';

export function HistoryPage() {
  return (
    <main className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registro de decisiones y medición de impacto
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">History</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Próximamente: estrategias aplicadas, cambios realizados, antes vs después
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
