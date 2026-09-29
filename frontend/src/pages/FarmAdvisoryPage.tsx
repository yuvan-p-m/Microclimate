import React, { useState, useEffect, useCallback } from 'react';
import { PANCHAYATS_DATA } from '../data/panchayats';
import { CROPS_CATALOG, getCropById } from '../services/farmAdvisoryRules';
import { getWeatherPrediction } from '../services/weatherPredictionApi';
import { generateFarmAdvisory } from '../services/farmAdvisoryService';
import type { FarmAdvisoryReport } from '../types/advisory';
import { CropProfileHeaderCard } from '../components/advisory/CropProfileHeaderCard';
import { AdvisoryCard } from '../components/advisory/AdvisoryCard';
import { AdvisoryMethodologyBox } from '../components/advisory/AdvisoryMethodologyBox';
import {
  MapPin,
  Sprout,
  RefreshCw,
  AlertCircle,
  Compass,
} from 'lucide-react';

interface FarmAdvisoryPageProps {
  initialPanchayatId?: string;
  onPanchayatChange?: (panchayatId: string) => void;
}

export const FarmAdvisoryPage: React.FC<FarmAdvisoryPageProps> = ({
  initialPanchayatId = 'TN_NIL_OOTY_01',
  onPanchayatChange,
}) => {
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>(initialPanchayatId);
  const [selectedCropId, setSelectedCropId] = useState<string>('potato');

  // Advisory state
  const [advisoryReport, setAdvisoryReport] = useState<FarmAdvisoryReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedPanchayat =
    PANCHAYATS_DATA.find((p) => p.panchayat_id === selectedPanchayatId) || PANCHAYATS_DATA[0];

  const selectedCrop = getCropById(selectedCropId);
  const blocks = Array.from(new Set(PANCHAYATS_DATA.map((p) => p.block_name))).sort();

  const handlePanchayatSelect = (panchayatId: string) => {
    setSelectedPanchayatId(panchayatId);
    if (onPanchayatChange) {
      onPanchayatChange(panchayatId);
    }
  };

  const loadAdvisory = useCallback(async () => {
    if (!selectedPanchayat) return;

    setLoading(true);
    setError(null);

    try {
      const liveWeather = await getWeatherPrediction(
        selectedPanchayat.latitude,
        selectedPanchayat.longitude
      );

      const report = generateFarmAdvisory(selectedPanchayat, selectedCrop, liveWeather);
      setAdvisoryReport(report);
    } catch (err: unknown) {
      setAdvisoryReport(null);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(
        errorMsg || 'Weather data unavailable. Farm advisory cannot be generated.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPanchayat, selectedCrop]);

  // Fetch forecast when Panchayat or Crop changes
  useEffect(() => {
    let isCancelled = false;

    async function execute() {
      if (!selectedPanchayat) return;
      setLoading(true);
      setError(null);

      try {
        const liveWeather = await getWeatherPrediction(
          selectedPanchayat.latitude,
          selectedPanchayat.longitude
        );
        if (!isCancelled) {
          const report = generateFarmAdvisory(selectedPanchayat, selectedCrop, liveWeather);
          setAdvisoryReport(report);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setAdvisoryReport(null);
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(
            errorMsg || 'Weather data unavailable. Farm advisory cannot be generated.'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    execute();

    return () => {
      isCancelled = true;
    };
  }, [selectedPanchayat, selectedCrop]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Control Bar: Panchayat & Crop Selection */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Target Panchayat Selector (5 cols) */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Panchayat</span>
            </label>
            <div className="relative">
              <select
                value={selectedPanchayatId}
                onChange={(e) => handlePanchayatSelect(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
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

          {/* Crop Selector (4 cols) */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Nilgiris Crop</span>
            </label>
            <div className="relative">
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                {CROPS_CATALOG.map((crop) => (
                  <option key={crop.id} value={crop.id} className="bg-slate-800 text-slate-100">
                    {crop.name} ({crop.category}) — {crop.scientificName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Refresh Controls (3 cols) */}
          <div className="lg:col-span-3 flex items-center gap-2 justify-between lg:justify-end">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 font-mono text-slate-300">
              <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {selectedPanchayat.latitude.toFixed(4)}° N, {selectedPanchayat.longitude.toFixed(4)}° E
              </span>
            </div>

            <button
              type="button"
              onClick={loadAdvisory}
              disabled={loading}
              title="Refresh Live Advisory"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Crop Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 text-[11px] font-medium">Quick Crops:</span>
          {CROPS_CATALOG.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCropId(c.id)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedCropId === c.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-rose-200">Weather data unavailable</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadAdvisory}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && !advisoryReport && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-300 shadow-sm flex flex-col items-center justify-center space-y-4">
          <Sprout className="w-10 h-10 text-emerald-400 animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Generating Rule-Based Farm Advisory...</h3>
            <p className="text-xs text-slate-400">
              Evaluating live Open-Meteo forecast and agronomic thresholds for {selectedCrop.name} in {selectedPanchayat.name}
            </p>
          </div>
        </div>
      )}

      {/* Main Advisory Content */}
      {!loading && advisoryReport && (
        <>
          {/* Top Hero: Crop Agronomic Profile + Live Weather Snapshot */}
          <CropProfileHeaderCard report={advisoryReport} />

          {/* 4 Main Operational Advisory Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* 1. Sowing & Planting */}
            <AdvisoryCard advisory={advisoryReport.sowing} />

            {/* 2. Irrigation Management */}
            <AdvisoryCard advisory={advisoryReport.irrigation} />

            {/* 3. Crop Protection (Spray Window) */}
            <AdvisoryCard advisory={advisoryReport.cropProtection} />

            {/* 4. Harvest Weather Window */}
            <AdvisoryCard advisory={advisoryReport.harvest} />
          </div>

          {/* Bottom Methodology & Prototype Disclaimer Box */}
          <AdvisoryMethodologyBox />
        </>
      )}
    </div>
  );
};
