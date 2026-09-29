import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer } from '../components/map/MapContainer';
import { ForecastCard } from '../components/dashboard/ForecastCard';
import { TerrainCard } from '../components/dashboard/TerrainCard';
import { ClimateZoneCard } from '../components/dashboard/ClimateZoneCard';
import { DonorPanchayatCard } from '../components/dashboard/DonorPanchayatCard';
import { ConfidenceScoreCard } from '../components/dashboard/ConfidenceScoreCard';
import { FarmerFeedbackForm } from '../components/dashboard/FarmerFeedbackForm';
import { WeatherTrendChart } from '../components/charts/WeatherTrendChart';
import { ScientificStatusBanner } from '../components/dashboard/ScientificStatusBanner';
import { PANCHAYATS_DATA } from '../data/panchayats';
import { panchayatApi } from '../services/panchayatApi';
import type { PanchayatDownscaleResponse } from '../types/weather';
import { Calendar, RefreshCw, AlertCircle, MapPin } from 'lucide-react';

const DATE_PRESETS = [
  { label: 'Monsoon Peak', date: '2024-07-15' },
  { label: 'Pre-Monsoon', date: '2024-05-15' },
  { label: 'Winter', date: '2024-01-15' },
  { label: 'Post-Monsoon', date: '2024-10-15' },
  { label: 'Latest (2024-12-31)', date: '2024-12-31' },
];

export const DashboardPage: React.FC = () => {
  // Source of truth state
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>('TN_NIL_OOTY_01');
  const [selectedDate, setSelectedDate] = useState<string>('2024-07-15');

  // API State
  const [forecast, setForecast] = useState<PanchayatDownscaleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected master record
  const selectedMaster = PANCHAYATS_DATA.find((p) => p.panchayat_id === selectedPanchayatId) || null;

  // Group panchayats by block for easy selection
  const blocks = Array.from(new Set(PANCHAYATS_DATA.map((p) => p.block_name))).sort();

  // Fetch forecast handler
  const fetchForecastData = useCallback(async (panchayatId: string, date: string) => {
    if (!panchayatId || !date) return;

    setLoading(true);
    setError(null);

    try {
      const data = await panchayatApi.getPanchayatForecast(panchayatId, date);
      setForecast(data);
    } catch (err: unknown) {
      setForecast(null); // STRICT: Never substitute fake fallback weather
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger fetch when selection changes
  useEffect(() => {
    let isCancelled = false;

    async function executeFetch() {
      if (!selectedPanchayatId || !selectedDate) return;
      setLoading(true);
      setError(null);

      try {
        const data = await panchayatApi.getPanchayatForecast(selectedPanchayatId, selectedDate);
        if (!isCancelled) {
          setForecast(data);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setForecast(null);
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg);
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
  }, [selectedPanchayatId, selectedDate]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Scientific Disclaimer Banner */}
      <ScientificStatusBanner metadata={forecast?.metadata} />

      {/* Control Bar: Panchayat & Date Selection */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Target Panchayat Selector */}
          <div className="flex-1 w-full lg:w-auto">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Panchayat (Source of Truth)</span>
            </label>
            <div className="relative">
              <select
                value={selectedPanchayatId}
                onChange={(e) => setSelectedPanchayatId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                {blocks.map((block) => (
                  <optgroup key={block} label={`${block} Block`} className="bg-slate-900 text-slate-300 font-semibold">
                    {PANCHAYATS_DATA.filter((p) => p.block_name === block).map((p) => (
                      <option key={p.panchayat_id} value={p.panchayat_id} className="bg-slate-800 text-slate-100">
                        {p.name} ({p.panchayat_id}) — {p.elevation_m.toFixed(0)}m
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selector */}
          <div className="w-full lg:w-auto">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Forecast Date (1981-01-01 to 2024-12-31)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                min="1981-01-01"
                max="2024-12-31"
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => fetchForecastData(selectedPanchayatId, selectedDate)}
                disabled={loading}
                title="Refresh Forecast"
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 text-[11px] font-medium">Quick Dates:</span>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.date}
              type="button"
              onClick={() => setSelectedDate(preset.date)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedDate === preset.date
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-rose-200">Forecast Retrieval Error</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
            <p className="mt-2 text-rose-400 text-[11px]">
              Note: The historical meteorological dataset currently supports dates from 1981-01-01 through 2024-12-31.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchForecastData(selectedPanchayatId, selectedDate)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Interactive Map (Left) & Forecast/Confidence/Terrain Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Section */}
        <div className="lg:col-span-6 xl:col-span-7 h-[580px]">
          <MapContainer
            panchayats={PANCHAYATS_DATA}
            selectedPanchayatId={selectedPanchayatId}
            donorPanchayatId={forecast?.donor?.id}
            onSelectPanchayat={(id) => setSelectedPanchayatId(id)}
          />
        </div>

        {/* Primary Forecast, Confidence, and Terrain Panel */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          <ForecastCard forecast={forecast} loading={loading} />
          <ConfidenceScoreCard confidence={forecast?.confidence} />
          <TerrainCard panchayatSummary={forecast?.panchayat} masterRecord={selectedMaster} />
        </div>
      </div>

      {/* Secondary Row: Donor Matching, Climate Zone & Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <DonorPanchayatCard donor={forecast?.donor} correction={forecast?.correction} />
        <ClimateZoneCard panchayat={forecast?.panchayat} />
        <FarmerFeedbackForm panchayatId={selectedPanchayatId} />
      </div>

      {/* Resolution Comparison Chart */}
      <WeatherTrendChart forecast={forecast} />
    </div>
  );
};
