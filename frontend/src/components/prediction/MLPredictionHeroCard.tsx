import React from 'react';
import type { ProcessedCurrentWeather, ProcessedDailyForecast } from '../../types/prediction';
import type { PanchayatMasterRecord } from '../../types/panchayat';
import { getWeatherCodeInfo } from '../../utils/weatherCodes';
import {
  CloudRain,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  Wind,
  Compass,
  MapPin,
  Layers,
  Clock,
} from 'lucide-react';

interface MLPredictionHeroCardProps {
  current: ProcessedCurrentWeather;
  todayDaily?: ProcessedDailyForecast;
  panchayat: PanchayatMasterRecord;
}

export const MLPredictionHeroCard: React.FC<MLPredictionHeroCardProps> = ({
  current,
  todayDaily,
  panchayat,
}) => {
  const codeInfo = getWeatherCodeInfo(current.weatherCode);
  const IconComponent = codeInfo.icon;

  // Format timestamp
  let formattedTime = current.time;
  try {
    const [, time] = current.time.split('T');
    if (time) {
      const [h, m] = time.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      formattedTime = `${displayHour}:${m} ${ampm}`;
    }
  } catch {
    // fallback
  }

  const rainValue = todayDaily ? todayDaily.precipitationSum : current.precipitation;
  const maxTemp = todayDaily ? todayDaily.tempMax : current.temperature;
  const minTemp = todayDaily ? todayDaily.tempMin : current.temperature;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-md relative overflow-hidden">
      {/* Background subtle atmospheric gradient */}
      <div
        className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${codeInfo.bgGradient} rounded-full blur-3xl -z-0 pointer-events-none opacity-40`}
      />

      <div className="relative z-10 space-y-6">
        {/* Top Header: ML Prediction Title & Location Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                ML Panchayat Weather Prediction
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {panchayat.panchayat_id}
              </span>
            </div>
            <p className="text-xs text-sky-300 font-medium mt-1">
              Historical weather patterns + local environmental features
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <strong className="text-slate-200">{panchayat.name}</strong> ({panchayat.block_name} Block, {panchayat.district})
              </span>
              <span>&bull;</span>
              <span className="font-mono text-slate-300">
                {panchayat.latitude.toFixed(4)}° N, {panchayat.longitude.toFixed(4)}° E
              </span>
              <span>&bull;</span>
              <span>Elevation: {panchayat.elevation_m.toFixed(0)} m</span>
              <span>&bull;</span>
              <span className="text-emerald-400">{panchayat.climate_zone.split('(')[0].trim()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Latest Forecast: <strong className="text-slate-100">{formattedTime}</strong></span>
          </div>
        </div>

        {/* Hero Section: Condition & Temperature Snapshot */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-inner">
              <IconComponent className={`w-14 h-14 ${codeInfo.colorClass}`} />
            </div>

            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-extrabold tracking-tight text-white">
                  {Math.round(current.temperature)}°C
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  Feels like {Math.round(current.apparentTemperature)}°C
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-base font-semibold ${codeInfo.colorClass}`}>
                  {codeInfo.label}
                </span>
                <span className="text-xs text-slate-400">&bull; {codeInfo.description}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Microclimate Zone:</span>
            <span className="text-emerald-300 font-medium">{panchayat.land_use}</span>
          </div>
        </div>

        {/* Primary Predicted Weather Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* 1. Rainfall */}
          <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Rainfall</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-white">
                {rainValue.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {current.rain > 0 ? `Current: ${current.rain.toFixed(1)} mm` : 'Expected today'}
              </div>
            </div>
          </div>

          {/* 2. Maximum Temperature */}
          <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Max Temp</span>
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                <ThermometerSun className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-rose-300">
                {Math.round(maxTemp)}° <span className="text-xs font-normal text-slate-400">C</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Projected maximum
              </div>
            </div>
          </div>

          {/* 3. Minimum Temperature */}
          <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Min Temp</span>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                <ThermometerSnowflake className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-sky-300">
                {Math.round(minTemp)}° <span className="text-xs font-normal text-slate-400">C</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Projected minimum
              </div>
            </div>
          </div>

          {/* 4. Relative Humidity */}
          <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Humidity</span>
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-teal-300">
                {current.humidity} <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {current.humidity > 80 ? 'High moisture' : current.humidity < 40 ? 'Dry air' : 'Moderate'}
              </div>
            </div>
          </div>

          {/* 5. Wind Speed & Direction */}
          <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Wind</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-indigo-300">
                {Math.round(current.windSpeed)} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                <Compass className="w-3 h-3 text-slate-400" />
                {current.windDirectionCompass} ({current.windDirection}°)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
