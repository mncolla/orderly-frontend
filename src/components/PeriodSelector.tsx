import type { OperationsPeriod } from '@/services/operationsService';

export interface PeriodSelectorProps {
  value: OperationsPeriod;
  onChange: (period: OperationsPeriod) => void;
}

const periods: { value: OperationsPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'thisMonth', label: 'Este mes' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1 bg-white dark:bg-gray-800">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all
            ${value === period.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
