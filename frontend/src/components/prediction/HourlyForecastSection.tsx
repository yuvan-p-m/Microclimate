import React, { useState } from 'react';
import type { ProcessedHourlyForecast } from '../../types/prediction';
import { getWeatherCodeInfo } from '../../utils/weatherCodes';
import {
  Clock,
  Droplets,
  Wind,
  Umbrella,
  BarChart2,
  List,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface HourlyForecastSectionProps {
  hourly: ProcessedHourlyForecast[];
}

export const HourlyForecastSection: React.FC<HourlyForecastSectionProps> = ({ hourly }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'chart'>('timeline');

  if (!hourly || hourly.length === 0) return null;

  // Format data for Recharts chart
  const chartData = hourly.slice(0, 24).map((h) => ({
    time: h.formattedTime,
    date: h.formattedDate,
    'Temperature (°C)': Number(h.temperature.toFixed(1)),
    'Precipitation (mm)': Number(h.precipitation.toFixed(1)),
    'Rain Probability (%)': h.precipitationProbability,
    'Wind Speed (km/h)': Number(h.windSpeed.toFixed(1)),
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">36-Hour Microclimate Progression</h3>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'chart'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Trend Chart</span>
          </button>
        </div>
      </div>

      {/* Timeline Card View */}
      {viewMode === 'timeline' && (
        <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex gap-3 min-w-max">
            {hourly.map((item, idx) => {
              const codeInfo = getWeatherCodeInfo(item.weatherCode);
              const IconComponent = codeInfo.icon;

              return (
                <div
                  key={`${item.time}-${idx}`}
                  className={`w-32 p-3 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                    item.isCurrentHour
                      ? 'bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-md'
                      : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Time & Date */}
                  <div className="w-full pb-1.5 border-b border-slate-700/40">
                    <div className="text-[11px] text-slate-400">{item.formattedDate}</div>
                    <div className={`text-xs font-bold ${item.isCurrentHour ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {item.formattedTime}
                    </div>
                  </div>

                  {/* Weather Icon & Condition */}
                  <div className="py-2.5 flex flex-col items-center">
                    <IconComponent className={`w-6 h-6 ${codeInfo.colorClass} mb-1`} />
                    <span className="text-[11px] font-medium text-slate-300 line-clamp-1" title={item.weatherDescription}>
                      {item.weatherDescription}
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="text-base font-extrabold text-white">
                    {Math.round(item.temperature)}°C
                  </div>

                  {/* Rain & Wind Details */}
                  <div className="w-full pt-2 mt-1 border-t border-slate-700/40 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Umbrella className="w-3 h-3 text-blue-400" />
                      </span>
                      <span className={`font-semibold ${item.precipitationProbability > 40 ? 'text-blue-300' : 'text-slate-400'}`}>
                        {item.precipitationProbability}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Droplets className="w-3 h-3 text-teal-400" />
                      </span>
                      <span className="font-mono text-slate-300">
                        {item.precipitation.toFixed(1)}mm
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Wind className="w-3 h-3 text-indigo-400" />
                      </span>
                      <span className="font-mono text-slate-300">
                        {Math.round(item.windSpeed)}kph
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recharts Chart View */}
      {viewMode === 'chart' && (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={40}
              />
              <YAxis
                yAxisId="left"
                stroke="#10b981"
                tick={{ fill: '#10b981', fontSize: 11 }}
                unit="°C"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#60a5fa"
                tick={{ fill: '#60a5fa', fontSize: 11 }}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                yAxisId="right"
                dataKey="Rain Probability (%)"
                fill="#3b82f6"
                opacity={0.4}
                radius={[4, 4, 0, 0]}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Temperature (°C)"
                stroke="#10b981"
                strokeWidth={2}
                fill="#10b981"
                fillOpacity={0.15}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
