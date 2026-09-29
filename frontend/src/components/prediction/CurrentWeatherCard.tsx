import React from 'react';
import type { ProcessedCurrentWeather, ProcessedDailyForecast } from '../../types/prediction';
import type { PanchayatMasterRecord } from '../../types/panchayat';
import { getWeatherCodeInfo } from '../../utils/weatherCodes';
import {
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  Compass,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react';

interface CurrentWeatherCardProps {
  current: ProcessedCurrentWeather;
  todayDaily?: ProcessedDailyForecast;
  panchayat: PanchayatMasterRecord;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  current,
  todayDaily,
  panchayat,
}) => {
  const codeInfo = getWeatherCodeInfo(current.weatherCode);
  const IconComponent = codeInfo.icon;

  // Format current ISO time
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-md relative overflow-hidden">
      {/* Subtle background glow based on weather condition */}
      <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${codeInfo.bgGradient} rounded-full blur-3xl -z-0 pointer-events-none opacity-60`} />

      <div className="relative z-10 space-y-6">
        {/* Top Header: Panchayat Location & Timestamp */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-xl font-bold tracking-tight text-white">{panchayat.name}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {panchayat.panchayat_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>{panchayat.block_name} Block, {panchayat.district}, {panchayat.state}</span>
              <span>&bull;</span>
              <span className="font-mono text-slate-300">
                {panchayat.latitude.toFixed(4)}° N, {panchayat.longitude.toFixed(4)}° E
              </span>
              <span>&bull;</span>
              <span>Elevation: {panchayat.elevation_m.toFixed(0)} m</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Observation: <strong className="text-slate-100">{formattedTime}</strong></span>
          </div>
        </div>

        {/* Hero Section: Temp, Icon & Weather Summary */}
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

          {/* Today's High / Low Range */}
          {todayDaily && (
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto bg-slate-800/50 sm:bg-transparent p-3 sm:p-0 rounded-lg border border-slate-700/40 sm:border-0">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Today's Range</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold mt-1">
                <span className="text-rose-400 flex items-center gap-0.5">
                  &uarr; {Math.round(todayDaily.tempMax)}°C
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-sky-400 flex items-center gap-0.5">
                  &darr; {Math.round(todayDaily.tempMin)}°C
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Rain / Precipitation */}
          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Precipitation</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {current.precipitation.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {current.rain > 0 ? `Rain: ${current.rain.toFixed(1)} mm` : 'No active rain'}
              </div>
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg mt-0.5">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Relative Humidity</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {current.humidity}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {current.humidity > 80 ? 'High moisture' : current.humidity < 40 ? 'Dry air' : 'Optimal'}
              </div>
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg mt-0.5">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Wind Velocity</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {current.windSpeed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                <Compass className="w-3 h-3 text-slate-400" />
                {current.windDirectionCompass} ({current.windDirection}°)
              </div>
            </div>
          </div>

          {/* Climate Context */}
          <div className="bg-slate-800/60 border border-slate-700/50 p-3.5 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg mt-0.5">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Climate Zone</div>
              <div className="text-xs font-bold text-slate-100 mt-1 line-clamp-1" title={panchayat.climate_zone}>
                {panchayat.climate_zone.split('(')[0].trim()}
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5 line-clamp-1">
                {panchayat.land_use}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
