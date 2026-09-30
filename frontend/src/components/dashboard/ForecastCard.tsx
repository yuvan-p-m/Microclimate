import React from 'react';
import { CloudRain, Thermometer, ArrowUpRight, ArrowDownRight, Layers, HelpCircle } from 'lucide-react';
import type { PanchayatDownscaleResponse } from '../../types/weather';

interface ForecastCardProps {
  forecast?: PanchayatDownscaleResponse | null;
  loading?: boolean;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-400 text-sm animate-pulse">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="h-5 bg-slate-800 rounded w-48"></div>
          <div className="h-5 bg-slate-800 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-20 bg-slate-800/60 rounded-lg"></div>
          <div className="h-20 bg-slate-800/60 rounded-lg"></div>
          <div className="h-20 bg-slate-800/60 rounded-lg"></div>
          <div className="h-20 bg-slate-800/60 rounded-lg"></div>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">Loading Panchayat forecast from ML engine...</p>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-400 text-sm">
        Select a Panchayat and date above to load verified forecast data.
      </div>
    );
  }

  const { final_prediction, input_weather, raw_prediction, metadata } = forecast;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">Hyper local Downscaled weather history</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {metadata.model_type} {metadata.model_version}
          </span>
        </div>
      </div>

      {/* Main Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
        {/* Rainfall Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5">
            <CloudRain className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium">Downscaled Rainfall</p>
            <p className="text-2xl font-black text-white tracking-tight">
              {final_prediction.rainfall_mm.toFixed(2)} <span className="text-sm font-normal text-slate-400">mm</span>
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex justify-between text-[11px] text-slate-400">
              <span>Coarse Grid: {input_weather.coarse_rainfall_mm.toFixed(2)} mm</span>
              <span>Raw RF: {raw_prediction.rainfall_mm.toFixed(2)} mm</span>
            </div>
          </div>
        </div>

        {/* Tmax Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg mt-0.5">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium">Maximum Temperature (Tmax)</p>
            <p className="text-2xl font-black text-white tracking-tight">
              {final_prediction.tmax_c.toFixed(2)} <span className="text-sm font-normal text-slate-400">°C</span>
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex justify-between text-[11px] text-slate-400">
              <span>Coarse Grid: {input_weather.coarse_tmax_c.toFixed(2)} °C</span>
              <span>Raw RF: {raw_prediction.tmax_c.toFixed(2)} °C</span>
            </div>
          </div>
        </div>

        {/* Tmin Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg mt-0.5">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium">Minimum Temperature (Tmin)</p>
            <p className="text-2xl font-black text-white tracking-tight">
              {final_prediction.tmin_c.toFixed(2)} <span className="text-sm font-normal text-slate-400">°C</span>
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex justify-between text-[11px] text-slate-400">
              <span>Coarse Grid: {input_weather.coarse_tmin_c.toFixed(2)} °C</span>
              <span>Raw RF: {raw_prediction.tmin_c.toFixed(2)} °C</span>
            </div>
          </div>
        </div>

        {/* Diurnal Range Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg mt-0.5">
            <Thermometer className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium">Diurnal Temperature Range</p>
            <p className="text-2xl font-black text-white tracking-tight">
              {final_prediction.diurnal_range_c.toFixed(2)} <span className="text-sm font-normal text-slate-400">°C</span>
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex justify-between text-[11px] text-slate-400">
              <span>Physical Tmax - Tmin</span>
              <span className="text-emerald-400 font-medium">Validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input meteorological baseline reference */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>INDmet Input Grid ({input_weather.weather_grid_latitude.toFixed(3)}°N, {input_weather.weather_grid_longitude.toFixed(3)}°E)</span>
        </div>
        <span className="text-slate-500">Distance to Grid Cell: <strong className="text-slate-300 font-normal">{input_weather.grid_distance_km.toFixed(2)} km</strong></span>
      </div>
    </div>
  );
};
