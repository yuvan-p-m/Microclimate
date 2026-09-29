import React, { useState, useEffect, useCallback } from 'react';
import { PANCHAYATS_DATA } from '../data/panchayats';
import { panchayatApi } from '../services/panchayatApi';
import { calculateConfidenceAnalysis } from '../services/confidenceCalculator';
import type { PanchayatDownscaleResponse } from '../types/weather';
import type { CalculatedConfidenceAnalysis } from '../types/confidence';
import { OverallScoreHeroCard } from '../components/confidence/OverallScoreHeroCard';
import { ConfidenceFactorBarsCard } from '../components/confidence/ConfidenceFactorBarsCard';
import { WhyThisScoreCard } from '../components/confidence/WhyThisScoreCard';
import { PanchayatParametersCard } from '../components/confidence/PanchayatParametersCard';
import { HistoricalDatasetCard } from '../components/confidence/HistoricalDatasetCard';
import { PrototypeScientificStatusBox } from '../components/confidence/PrototypeScientificStatusBox';
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  Cpu,
  Compass,
} from 'lucide-react';

interface ConfidenceScorePageProps {
  initialPanchayatId?: string;
  onPanchayatChange?: (panchayatId: string) => void;
}

export const ConfidenceScorePage: React.FC<ConfidenceScorePageProps> = ({
  initialPanchayatId = 'TN_NIL_OOTY_01',
  onPanchayatChange,
}) => {
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>(initialPanchayatId);

  // Confidence analysis state
  const [analysis, setAnalysis] = useState<CalculatedConfidenceAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPanchayat =
    PANCHAYATS_DATA.find((p) => p.panchayat_id === selectedPanchayatId) || PANCHAYATS_DATA[0];

  const blocks = Array.from(new Set(PANCHAYATS_DATA.map((p) => p.block_name))).sort();

  const handlePanchayatSelect = (panchayatId: string) => {
    setSelectedPanchayatId(panchayatId);
    if (onPanchayatChange) {
      onPanchayatChange(panchayatId);
    }
  };

  const loadConfidenceData = useCallback(async (panchayatId: string) => {
    if (!panchayatId) return;

    setLoading(true);
    setError(null);

    const panchayat = PANCHAYATS_DATA.find((p) => p.panchayat_id === panchayatId) || selectedPanchayat;

    try {
      // Retrieve backend downscaling response to integrate backend confidence service
      let forecastData: PanchayatDownscaleResponse | null = null;
      try {
        forecastData = await panchayatApi.getPanchayatForecast(panchayatId, '2024-07-15');
      } catch {
        forecastData = null;
      }

      const calculated = calculateConfidenceAnalysis(panchayat, forecastData, null);
      setAnalysis(calculated);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || 'Unable to calculate confidence analysis.');
    } finally {
      setLoading(false);
    }
  }, [selectedPanchayat]);

  useEffect(() => {
    let isCancelled = false;

    async function execute() {
      if (!selectedPanchayat) return;
      setLoading(true);
      setError(null);

      try {
        let forecastData: PanchayatDownscaleResponse | null = null;
        try {
          forecastData = await panchayatApi.getPanchayatForecast(selectedPanchayat.panchayat_id, '2024-07-15');
        } catch {
          forecastData = null;
        }

        if (!isCancelled) {
          const calculated = calculateConfidenceAnalysis(selectedPanchayat, forecastData, null);
          setAnalysis(calculated);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg || 'Unable to calculate confidence analysis.');
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
  }, [selectedPanchayat]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Control Bar: Panchayat Selection */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Target Panchayat Selector */}
          <div className="flex-1 w-full lg:w-auto">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Panchayat for Confidence Analysis</span>
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

          {/* Location Badges & Refresh Button */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 font-mono text-slate-300">
              <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">{selectedPanchayat.latitude.toFixed(4)}° N</strong>,{' '}
                <strong className="text-white">{selectedPanchayat.longitude.toFixed(4)}° E</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => loadConfidenceData(selectedPanchayatId)}
              disabled={loading}
              title="Recalculate Confidence"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Recalculate</span>
            </button>
          </div>
        </div>

        {/* Quick Parameters Overview Subtitle */}
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
            <h4 className="font-bold text-sm text-rose-200">Analysis Error</h4>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadConfidenceData(selectedPanchayatId)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && !analysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-300 shadow-sm flex flex-col items-center justify-center space-y-4">
          <Cpu className="w-10 h-10 text-emerald-400 animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Computing AI Confidence Factors...</h3>
            <p className="text-xs text-slate-400">
              Analyzing historical coverage and topographic representations for {selectedPanchayat.name}
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Display */}
      {analysis && (
        <>
          {/* Overall Score Hero Card */}
          <OverallScoreHeroCard analysis={analysis} />

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Factors Breakdown & Historical Dataset (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <ConfidenceFactorBarsCard factors={analysis.factors} />
              <HistoricalDatasetCard summary={analysis.historicalData} />
            </div>

            {/* Right Column: Why This Score? & Environmental Parameters (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <WhyThisScoreCard explanations={analysis.explanations} />
              <PanchayatParametersCard analysis={analysis} />
            </div>
          </div>

          {/* Bottom Prototype Scientific Status Banner Box */}
          <PrototypeScientificStatusBox />
        </>
      )}
    </div>
  );
};
