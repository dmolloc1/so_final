import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  borderColor?: string;   //para el borde izquierdo
  iconColor?: string;     //color del ícono
  iconSize?: string;      //tamaño del ícono
  trend?: {
    value: number;
    isPositive: boolean;
  } | string;
  loading?: boolean;
  darkMode?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  borderColor = "border-blue-500",
  iconColor = "text-blue-500",
  iconSize = "w-8 h-8",
  trend,
  loading = false,
  darkMode = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse border-l-4 border-gray-300">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-7 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 border-l-4 ${borderColor}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value}</p>
          {subtitle && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>}
        </div>

        {icon && (
          <div className={`${iconColor} ${iconSize}`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div
          className={`flex items-center gap-1 text-xs mt-2 font-medium ${
            typeof trend === 'string' ? 'text-green-600' : trend.isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {typeof trend === 'string' ? (
            <>
              <TrendingUp className="w-3 h-3" />
              <span>{trend}</span>
            </>
          ) : (
            <>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
