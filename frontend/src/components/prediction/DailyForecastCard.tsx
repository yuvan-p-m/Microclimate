import React from 'react';
import type { ProcessedDailyForecast } from '../../types/prediction';
import { getWeatherCodeInfo } from '../../utils/weatherCodes';
import { Calendar, Umbrella, Droplets, Wind } from 'lucide-react';

interface DailyForecastCardProps {
  daily: ProcessedDailyForecast[];
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({ daily }) => {
  if (!daily || daily.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-base">7-Day Downscaled Weather Outlook</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Multi-Day Microclimate Prognosis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
        {daily.map((day, idx) => {
          const codeInfo = getWeatherCodeInfo(day.weatherCode);
          const IconComponent = codeInfo.icon;
          const isToday = idx === 0;

          return (
            <div
              key={day.date}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-150 ${
                isToday
                  ? 'bg-slate-800/90 border-sky-500/50 shadow-md ring-1 ring-sky-500/20'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
              }`}
            >
              {/* Day Header */}
              <div className="text-center pb-2 border-b border-slate-700/40">
                <div className="flex items-center justify-center gap-1">
                  <span className={`text-sm font-bold ${isToday ? 'text-sky-300' : 'text-slate-200'}`}>
                    {day.dayLabel}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {day.date.substring(5)}
                </div>
              </div>

              {/* Weather Condition Icon & Label */}
              <div className="py-3 flex flex-col items-center text-center">
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/40 mb-2">
                  <IconComponent className={`w-7 h-7 ${codeInfo.colorClass}`} />
                </div>
                <span className="text-xs font-semibold text-slate-200 line-clamp-1" title={day.weatherDescription}>
                  {day.weatherDescription}
                </span>
              </div>

              {/* High / Low Temp */}
              <div className="space-y-2 pt-2 border-t border-slate-700/40 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-400">Temp</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-rose-300">{Math.round(day.tempMax)}°</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-sky-300">{Math.round(day.tempMin)}°</span>
                  </div>
                </div>

                {/* Rain Probability & Sum */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Umbrella className="w-3 h-3 text-blue-400" />
                    Rain Prob
                  </span>
                  <span className={`font-semibold ${day.precipitationProbabilityMax > 50 ? 'text-blue-300' : 'text-slate-400'}`}>
                    {day.precipitationProbabilityMax}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-teal-400" />
                    Rain Total
                  </span>
                  <span className="font-mono text-slate-300 font-medium">
                    {day.precipitationSum.toFixed(1)} mm
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-indigo-400" />
                    Wind Max
                  </span>
                  <span className="font-mono text-slate-300 font-medium">
                    {Math.round(day.windSpeedMax)} km/h
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
