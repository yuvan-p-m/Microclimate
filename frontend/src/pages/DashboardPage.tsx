import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer } from '../components/map/MapContainer';
import { ForecastCard } from '../components/dashboard/ForecastCard';
import { TerrainCard } from '../components/dashboard/TerrainCard';
import { ClimateZoneCard } from '../components/dashboard/ClimateZoneCard';
import { DonorPanchayatCard } from '../components/dashboard/DonorPanchayatCard';
import { FarmerFeedbackForm } from '../components/dashboard/FarmerFeedbackForm';
import { WeatherTrendChart } from '../components/charts/WeatherTrendChart';
import { ScientificStatusBanner } from '../components/dashboard/ScientificStatusBanner';
import { PANCHAYATS_DATA } from '../data/panchayats';
import { panchayatApi } from '../services/panchayatApi';
import type { PanchayatDownscaleResponse } from '../types/weather';
import { Calendar, RefreshCw, AlertCircle, MapPin, Sparkles, Clock } from 'lucide-react';

const DATE_PRESETS = [
  {
    label: 'Monsoon Peak',
    date: '2024-07-15',
    icon: '🌧️',
    activeClasses:
      'bg-gradient-to-br from-cyan-500/30 to-blue-600/40 text-cyan-100 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20 font-bold',
    inactiveClasses:
      'bg-slate-900/80 text-cyan-300/90 hover:text-cyan-100 border-cyan-500/25 hover:border-cyan-500/60 hover:bg-cyan-950/40',
  },
  {
    label: 'Pre-Monsoon Summer',
    date: '2024-05-15',
    icon: '☀️',
    activeClasses:
      'bg-gradient-to-br from-amber-500/30 to-orange-600/40 text-amber-100 border-amber-400 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 font-bold',
    inactiveClasses:
      'bg-slate-900/80 text-amber-300/90 hover:text-amber-100 border-amber-500/25 hover:border-amber-500/60 hover:bg-amber-950/40',
  },
  {
    label: 'Winter Minimum',
    date: '2024-01-15',
    icon: '❄️',
    activeClasses:
      'bg-gradient-to-br from-sky-500/30 to-indigo-600/40 text-sky-100 border-sky-400 ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/20 font-bold',
    inactiveClasses:
      'bg-slate-900/80 text-sky-300/90 hover:text-sky-100 border-sky-500/25 hover:border-sky-500/60 hover:bg-sky-950/40',
  },
  {
    label: 'Post-Monsoon Autumn',
    date: '2024-10-15',
    icon: '🍂',
    activeClasses:
      'bg-gradient-to-br from-emerald-500/30 to-teal-600/40 text-emerald-100 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20 font-bold',
    inactiveClasses:
      'bg-slate-900/80 text-emerald-300/90 hover:text-emerald-100 border-emerald-500/25 hover:border-emerald-500/60 hover:bg-emerald-950/40',
  },
  {
    label: 'Latest Archive',
    date: '2024-12-31',
    icon: '⚡',
    activeClasses:
      'bg-gradient-to-br from-purple-500/30 to-pink-600/40 text-purple-100 border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20 font-bold',
    inactiveClasses:
      'bg-slate-900/80 text-purple-300/90 hover:text-purple-100 border-purple-500/25 hover:border-purple-500/60 hover:bg-purple-950/40',
  },
];

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

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

      {/* Control Bar: Panchayat & Large Vibrant Date Simulation Selection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Top Control Bar Header */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-sky-950/40 border-b border-slate-800/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/20 border border-indigo-500/40 rounded-lg text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
              Simulation Controls & Historical Dataset
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Dataset Range: <strong className="text-slate-200 font-mono">1981-01-01</strong> to{' '}
              <strong className="text-slate-200 font-mono">2024-12-31</strong>
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Target Panchayat Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-3 bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Target Panchayat (Source of Truth)</span>
                </label>
                <select
                  value={selectedPanchayatId}
                  onChange={(e) => setSelectedPanchayatId(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-700 hover:border-emerald-500/50 focus:border-emerald-400 text-slate-100 text-sm font-semibold rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer"
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

              {selectedMaster && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex-wrap gap-2">
                  <span>
                    Block: <strong className="text-slate-200">{selectedMaster.block_name}</strong>
                  </span>
                  <span>
                    Elevation: <strong className="text-emerald-400">{selectedMaster.elevation_m.toFixed(0)}m</strong>
                  </span>
                  <span>
                    Slope: <strong className="text-slate-200">{selectedMaster.slope_deg.toFixed(1)}°</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Date Selection Panel (7 cols) - Big & Vibrant! */}
            <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-sky-950/30 border border-indigo-500/30 p-4.5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3.5">
              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 relative z-10">
                <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Choose Simulation Date</span>
                </label>
                <span className="text-xs px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-500/40 font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <span>📅</span>
                  <span>{formatDisplayDate(selectedDate)}</span>
                </span>
              </div>

              {/* Main Date Input + Simulate Button */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={selectedDate}
                    min="1981-01-01"
                    max="2024-12-31"
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-950/90 border-2 border-indigo-500/50 hover:border-sky-400 focus:border-sky-400 text-white text-base sm:text-lg font-bold font-mono rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/40 shadow-inner transition-all cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchForecastData(selectedPanchayatId, selectedDate)}
                  disabled={loading}
                  title="Run Downscaling Simulation for Date"
                  className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-600 hover:from-indigo-500 hover:via-sky-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-white' : ''}`} />
                  <span>Simulate</span>
                </button>
              </div>

              {/* Quick Date Presets / Seasons */}
              <div className="pt-2 border-t border-slate-800/80 relative z-10 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span className="text-slate-300">Quick Historical Seasons & Epochs:</span>
                  <span className="text-[10px] text-slate-500">Click preset to load</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {DATE_PRESETS.map((preset) => {
                    const isSelected = selectedDate === preset.date;
                    return (
                      <button
                        key={preset.date}
                        type="button"
                        onClick={() => setSelectedDate(preset.date)}
                        className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer border flex flex-col justify-between gap-1.5 ${
                          isSelected ? preset.activeClasses : preset.inactiveClasses
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{preset.icon}</span>
                          {isSelected && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[11px] leading-tight truncate">
                            {preset.label}
                          </div>
                          <div className="text-[10px] opacity-75 font-mono mt-0.5">
                            {preset.date}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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

        {/* Primary Forecast and Terrain Panel */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          <ForecastCard forecast={forecast} loading={loading} />
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
