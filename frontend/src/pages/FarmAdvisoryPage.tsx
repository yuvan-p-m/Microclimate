import React, { useState, useEffect, useCallback } from 'react';
import { PANCHAYATS_DATA } from '../data/panchayats';
import { getWeatherPrediction } from '../services/weatherPredictionApi';
import { generateFarmAdvisory } from '../services/farmAdvisoryService';
import type { FarmAdvisoryReport, CropRuleDefinition } from '../types/advisory';
import type { LiveWeatherPredictionData } from '../types/prediction';
import { RecommendedCropHeroCard } from '../components/advisory/RecommendedCropHeroCard';
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
  // Source of truth state for selected Panchayat
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>(initialPanchayatId);

  // Cached live weather data for the current panchayat
  const [weatherData, setWeatherData] = useState<LiveWeatherPredictionData | null>(null);

  // Optional manual crop override (defaults to null so automatic recommendation is used)
  const [customCrop, setCustomCrop] = useState<CropRuleDefinition | null>(null);

  // Advisory state (Automatically recommended crop + operational guidance)
  const [advisoryReport, setAdvisoryReport] = useState<FarmAdvisoryReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedPanchayat =
    PANCHAYATS_DATA.find((p) => p.panchayat_id === selectedPanchayatId) || PANCHAYATS_DATA[0];

  const blocks = Array.from(new Set(PANCHAYATS_DATA.map((p) => p.block_name))).sort();

  const handlePanchayatSelect = (panchayatId: string) => {
    setSelectedPanchayatId(panchayatId);
    setCustomCrop(null); // Reset manual override on location change
    if (onPanchayatChange) {
      onPanchayatChange(panchayatId);
    }
  };

  const handleSelectCrop = (crop: CropRuleDefinition) => {
    setCustomCrop(crop);
    if (selectedPanchayat && weatherData) {
      const report = generateFarmAdvisory(selectedPanchayat, weatherData, crop);
      setAdvisoryReport(report);
    }
  };

  const handleResetToRecommended = () => {
    setCustomCrop(null);
    if (selectedPanchayat && weatherData) {
      const report = generateFarmAdvisory(selectedPanchayat, weatherData, undefined);
      setAdvisoryReport(report);
    }
  };

  const loadAdvisory = useCallback(async () => {
    if (!selectedPanchayat) return;

    setLoading(true);
    setError(null);
    setAdvisoryReport(null);

    try {
      const liveWeather = await getWeatherPrediction(
        selectedPanchayat.latitude,
        selectedPanchayat.longitude
      );
      setWeatherData(liveWeather);

      // Automatically recommend the optimal crop and generate the comprehensive advisory
      const report = generateFarmAdvisory(selectedPanchayat, liveWeather, customCrop || undefined);
      setAdvisoryReport(report);
    } catch (err: unknown) {
      setAdvisoryReport(null);
      setWeatherData(null);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(
        errorMsg || 'Unable to generate crop recommendation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPanchayat, customCrop]);

  // Fetch forecast and recommend crop when Panchayat changes
  useEffect(() => {
    let isCancelled = false;

    async function execute() {
      if (!selectedPanchayat) return;
      setLoading(true);
      setError(null);
      setAdvisoryReport(null);

      try {
        const liveWeather = await getWeatherPrediction(
          selectedPanchayat.latitude,
          selectedPanchayat.longitude
        );
        if (!isCancelled) {
          setWeatherData(liveWeather);
          const report = generateFarmAdvisory(selectedPanchayat, liveWeather, customCrop || undefined);
          setAdvisoryReport(report);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setAdvisoryReport(null);
          setWeatherData(null);
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(
            errorMsg || 'Unable to generate crop recommendation. Please try again.'
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
  }, [selectedPanchayat, customCrop]);

  const isCustomCropSelected = Boolean(
    customCrop &&
    advisoryReport &&
    customCrop.id !== advisoryReport.recommendation.crop.id
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Control Bar: Panchayat Selection */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Target Panchayat Selector */}
          <div className="flex-1 w-full lg:w-auto">
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

          {/* Location & Refresh Controls */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-mono text-slate-300">
              <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">{selectedPanchayat.latitude.toFixed(4)}° N</strong>,{' '}
                <strong className="text-white">{selectedPanchayat.longitude.toFixed(4)}° E</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={loadAdvisory}
              disabled={loading}
              title="Refresh Advisory"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Advisory</span>
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

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-rose-200">Unable to generate crop recommendation</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
            <p className="mt-2 text-rose-400 text-[11px]">
              Please check your network connection or try again. No synthetic fallback crops are substituted.
            </p>
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
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Sprout className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Analyzing Local Weather and Environmental Conditions...</h3>
            <p className="text-xs text-slate-400">
              Evaluating elevation, temperature, moisture, and seasonal rules to recommend the optimal crop for {selectedPanchayat.name}
            </p>
          </div>
        </div>
      )}

      {/* Main Advisory Content Driven by Recommended or Selected Crop */}
      {!loading && advisoryReport && (
        <>
          {/* Top Hero: Recommended Crop Profile + Switch Crop Modal + Current Conditions */}
          <RecommendedCropHeroCard
            report={advisoryReport}
            onSelectCrop={handleSelectCrop}
            onResetToRecommended={handleResetToRecommended}
            isCustomCropSelected={isCustomCropSelected}
          />

          {/* Operational Advisory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {/* 1. Sowing & Field Preparation */}
            <AdvisoryCard advisory={advisoryReport.sowing} />

            {/* 2. Irrigation Management */}
            <AdvisoryCard advisory={advisoryReport.irrigation} />

            {/* 3. Fertilizer & Nutrient Guidance */}
            <AdvisoryCard advisory={advisoryReport.fertilizer} />

            {/* 4. Disease & Pest Risk (Spray Window) */}
            <AdvisoryCard advisory={advisoryReport.cropProtection} />

            {/* 5. Harvest & Weather Risk Window */}
            <AdvisoryCard advisory={advisoryReport.harvest} />
          </div>

          {/* Bottom Methodology & Automation Workflow Box */}
          <AdvisoryMethodologyBox />
        </>
      )}
    </div>
  );
};
