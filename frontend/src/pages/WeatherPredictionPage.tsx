import React, { useState, useEffect, useCallback } from 'react';
import { PANCHAYATS_DATA } from '../data/panchayats';
import { getWeatherPrediction } from '../services/weatherPredictionApi';
import type { LiveWeatherPredictionData } from '../types/prediction';
import { CurrentWeatherCard } from '../components/prediction/CurrentWeatherCard';
import { DailyForecastCard } from '../components/prediction/DailyForecastCard';
import { HourlyForecastSection } from '../components/prediction/HourlyForecastSection';
import { LocationMetaCard } from '../components/prediction/LocationMetaCard';
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  Radio,
  Compass,
} from 'lucide-react';

interface WeatherPredictionPageProps {
  initialPanchayatId?: string;
  onPanchayatChange?: (panchayatId: string) => void;
}

export const WeatherPredictionPage: React.FC<WeatherPredictionPageProps> = ({
  initialPanchayatId = 'TN_NIL_OOTY_01',
  onPanchayatChange,
}) => {
  // Source of truth state for selected Panchayat
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>(initialPanchayatId);

  // Live forecast state
  const [forecastData, setForecastData] = useState<LiveWeatherPredictionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Find currently selected Panchayat master record
  const selectedPanchayat =
    PANCHAYATS_DATA.find((p) => p.panchayat_id === selectedPanchayatId) || PANCHAYATS_DATA[0];

  // Group panchayats by block for clean dropdown
  const blocks = Array.from(new Set(PANCHAYATS_DATA.map((p) => p.block_name))).sort();

  // Fetch forecast function
  const fetchLiveForecast = useCallback(async (panchayat = selectedPanchayat) => {
    if (!panchayat) return;

    setLoading(true);
    setError(null);
    setForecastData(null); // Prevent showing stale data of previous panchayat while loading

    try {
      const data = await getWeatherPrediction(panchayat.latitude, panchayat.longitude);
      setForecastData(data);
    } catch (err: unknown) {
      setForecastData(null); // Strict: Never substitute fake fallback weather
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || 'Unable to retrieve the live weather forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPanchayat]);

  // Handle dropdown change
  const handlePanchayatSelect = (panchayatId: string) => {
    setSelectedPanchayatId(panchayatId);
    if (onPanchayatChange) {
      onPanchayatChange(panchayatId);
    }
  };

  // Fetch when selected Panchayat changes
  useEffect(() => {
    let isCancelled = false;

    async function executeFetch() {
      if (!selectedPanchayat) return;
      setLoading(true);
      setError(null);
      setForecastData(null); // Avoid stale data

      try {
        const data = await getWeatherPrediction(
          selectedPanchayat.latitude,
          selectedPanchayat.longitude
        );
        if (!isCancelled) {
          setForecastData(data);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setForecastData(null);
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg || 'Unable to retrieve the live weather forecast. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    executeFetch();

    return () => {
      isCancelled = true;
    };
  }, [selectedPanchayat]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Panchayat Selection & Location Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Target Panchayat Selector */}
          <div className="flex-1 w-full lg:w-auto">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Select Panchayat for Live Forecast</span>
            </label>
            <div className="relative">
              <select
                value={selectedPanchayatId}
                onChange={(e) => handlePanchayatSelect(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
              >
                {blocks.map((block) => (
                  <optgroup
                    key={block}
                    label={`${block} Block`}
                    className="bg-slate-900 text-slate-300 font-semibold"
                  >
                    {PANCHAYATS_DATA.filter((p) => p.block_name === block).map((p) => (
                      <option
                        key={p.panchayat_id}
                        value={p.panchayat_id}
                        className="bg-slate-800 text-slate-100"
                      >
                        {p.name} ({p.panchayat_id}) — {p.elevation_m.toFixed(0)}m
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Location Summary Badges & Refresh */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 font-mono">
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                <strong className="text-white">{selectedPanchayat.latitude.toFixed(4)}° N</strong>,{' '}
                <strong className="text-white">{selectedPanchayat.longitude.toFixed(4)}° E</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => fetchLiveForecast(selectedPanchayat)}
              disabled={loading}
              title="Refresh Live Forecast"
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Panchayat Quick Info Subtitle */}
        <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Block:</span>{' '}
            <strong className="text-slate-300">{selectedPanchayat.block_name}</strong>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">District:</span>{' '}
            <strong className="text-slate-300">{selectedPanchayat.district}</strong>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Elevation:</span>{' '}
            <strong className="text-slate-300">{selectedPanchayat.elevation_m.toFixed(0)} m</strong>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Climate:</span>{' '}
            <strong className="text-emerald-400">{selectedPanchayat.climate_zone.split('(')[0].trim()}</strong>
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-300 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="relative flex items-center justify-center">
            <Radio className="w-10 h-10 text-sky-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sky-400 animate-ping" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Loading Live Weather Forecast...</h3>
            <p className="text-xs text-slate-400">
              Querying Open-Meteo numerical forecast for {selectedPanchayat.name} ({selectedPanchayat.latitude.toFixed(4)}° N, {selectedPanchayat.longitude.toFixed(4)}° E)
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-4 shadow-md">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-rose-200">Unable to retrieve the live weather forecast</h4>
            <p className="mt-1 leading-relaxed text-rose-300/90">{error}</p>
            <p className="mt-2 text-rose-400 text-[11px]">
              Please verify your internet connection or try again. No synthetic fallback forecast is used.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchLiveForecast(selectedPanchayat)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Forecast Content */}
      {!loading && forecastData && (
        <>
          {/* Top Row: Current Weather Hero */}
          <CurrentWeatherCard
            current={forecastData.current}
            todayDaily={forecastData.daily[0]}
            panchayat={selectedPanchayat}
          />

          {/* 7-Day Upcoming Daily Forecast */}
          <DailyForecastCard daily={forecastData.daily} />

          {/* Hourly Forecast (Next 36 Hours) */}
          <HourlyForecastSection hourly={forecastData.hourly} />

          {/* Topographic & Geographic Profile */}
          <LocationMetaCard
            panchayat={selectedPanchayat}
            forecastData={forecastData}
          />
        </>
      )}
    </div>
  );
};
