import React from 'react';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  title?: string;
  value: 'today' | 'week' | 'month' | 'year';
  onChange: (filter: 'today' | 'week' | 'month' | 'year') => void;
  darkMode?: boolean;
  compact?: boolean;
}

const DateFilter: React.FC<DateFilterProps> = ({ 
  title = "Filtrar por:", 
  value, 
  onChange,
  darkMode = false,
  compact = false,
}) => {
  const filters: Array<{ key: 'today' | 'week' | 'month' | 'year'; label: string }> = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap justify-end">
       {/* <Calendar className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} /> */}

      <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {title && (
          <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'} ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {title}
          </span>
        )}

      </span>
      <div className="flex gap-1">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onChange(filter.key)}
            className={`
              ${compact ? 'px-2 py-0.5 text-xs rounded-md' : 'px-3 py-1.5 text-sm rounded-lg'}
              font-medium transition-colors
              ${
                value === filter.key
                  ? 'bg-blue-500 text-white shadow'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

    </div>
  );
};

export default DateFilter;
