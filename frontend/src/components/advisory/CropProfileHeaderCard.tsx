import React from 'react';
import type { FarmAdvisoryReport } from '../../types/advisory';
import {
  Sprout,
  Thermometer,
  Mountain,
  Droplets,
  Wind,
  CloudRain,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CropProfileHeaderCardProps {
  report: FarmAdvisoryReport;
}

export const CropProfileHeaderCard: React.FC<CropProfileHeaderCardProps> = ({ report }) => {
  const { crop, currentWeatherSnapshot, forecastSummary7Days, environmentalContext } = report;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-md space-y-6 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Top Bar: Crop Title + Rule-Based Model Badge */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{crop.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {crop.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 italic font-serif">
              {crop.scientificName} &bull; {crop.description}
            </p>
          </div>
        </div>

        {/* Rule-Based Advisory Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            RULE-BASED ADVISORY
          </span>
        </div>
      </div>

      {/* 2-Column Grid: Agronomic Target Ranges (Left) & Live Weather Forecast Snapshot (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 text-xs">
        {/* Left: Agronomic Crop Thresholds */}
        <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Agronomic Suitability Profile
          </h4>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/40">
              <div className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Ideal Temperature
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {crop.idealTempRangeC[0]}°C – {crop.idealTempRangeC[1]}°C
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/40">
              <div className="text-slate-400 flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                Ideal Elevation
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {crop.idealElevationRangeM[0]}m – {crop.idealElevationRangeM[1]}m
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 pt-1 space-y-1">
            <div>
              <span className="text-slate-400 font-medium">Sowing Seasons:</span>{' '}
              <strong className="text-slate-200">{crop.sowingSeasonNames}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Panchayat Elevation:</span>{' '}
              <span className="text-slate-200">{environmentalContext.elevationM.toFixed(0)}m</span>{' '}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  environmentalContext.isElevationSuitable
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {environmentalContext.isElevationSuitable ? 'Within range' : 'Marginal elevation'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Meteorological Inputs */}
        <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-sky-400" />
            Live Forecast Inputs (Open-Meteo)
          </h4>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
              <div className="text-slate-400 text-[11px]">Current Temp</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {Math.round(currentWeatherSnapshot.tempC)}°C
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentWeatherSnapshot.weatherDescription}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
              <div className="text-slate-400 text-[11px]">Humidity</div>
              <div className="text-base font-extrabold text-teal-400 mt-0.5">
                {currentWeatherSnapshot.humidityPct}%
              </div>
              <div className="text-[10px] text-slate-400">Relative</div>
            </div>

            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
              <div className="text-slate-400 text-[11px]">7-Day Rain</div>
              <div className="text-base font-extrabold text-sky-400 mt-0.5">
                {forecastSummary7Days.totalRainfallMm.toFixed(1)} <span className="text-[10px]">mm</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {forecastSummary7Days.rainyDaysCount} rainy days
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              Wind: <strong className="text-slate-200">{Math.round(currentWeatherSnapshot.windKmh)} km/h {currentWeatherSnapshot.windDirectionCompass}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              Next 48h Rain: <strong className="text-slate-200">{forecastSummary7Days.next48hRainMm.toFixed(1)} mm</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
