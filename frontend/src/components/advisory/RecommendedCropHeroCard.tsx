import React, { useState } from 'react';
import type { FarmAdvisoryReport, CropRuleDefinition } from '../../types/advisory';
import { CROPS_CATALOG } from '../../services/farmAdvisoryRules';
import {
  Sprout,
  Thermometer,
  Mountain,
  Wind,
  CloudRain,
  Calendar,
  CheckCircle2,
  Compass,
  ArrowRightLeft,
  RotateCcw,
  X,
} from 'lucide-react';

interface RecommendedCropHeroCardProps {
  report: FarmAdvisoryReport;
  onSelectCrop: (crop: CropRuleDefinition) => void;
  onResetToRecommended: () => void;
  isCustomCropSelected: boolean;
}

export const RecommendedCropHeroCard: React.FC<RecommendedCropHeroCardProps> = ({
  report,
  onSelectCrop,
  onResetToRecommended,
  isCustomCropSelected,
}) => {
  const {
    crop,
    activeCropEvaluation,
    recommendation,
    currentWeatherSnapshot,
    forecastSummary7Days,
    environmentalContext,
  } = report;
  const recommendedCrop = recommendation.crop;
  const activeEvaluation = activeCropEvaluation || {
    crop,
    suitabilityScorePct: recommendation.suitabilityScorePct,
    suitabilityReason: recommendation.recommendationReason,
    matchingFactors: recommendation.matchingFactors,
  };
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const handleCropChoose = (c: CropRuleDefinition) => {
    onSelectCrop(c);
    setIsSwitcherOpen(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-md space-y-6 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Top Section: Crop Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 border rounded-2xl shrink-0 mt-1 ${
              isCustomCropSelected
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <Sprout className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-bold uppercase tracking-wider font-mono ${
                  isCustomCropSelected ? 'text-sky-400' : 'text-emerald-400'
                }`}
              >
                {isCustomCropSelected ? 'Selected Advisory Crop' : 'Recommended Crop'}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {crop.category}
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  isCustomCropSelected
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {activeEvaluation.suitabilityScorePct}% Suitability Match
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {crop.name}
            </h2>
            <p className="text-xs text-slate-400 italic font-serif mt-0.5">
              {crop.scientificName} &bull; {crop.description}
            </p>
            {isCustomCropSelected ? (
              <p className="text-xs text-sky-300/90 font-medium mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>
                  Active farm advisory customized for {crop.name} (System recommendation: {recommendedCrop.name} &bull; {recommendation.suitabilityScorePct}% match).
                </span>
              </p>
            ) : (
              <p className="text-xs text-emerald-300/90 font-medium mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Recommended based on current weather and available environmental conditions.</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Small Crop Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          {isCustomCropSelected && (
            <button
              type="button"
              onClick={onResetToRecommended}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Recommended: {recommendedCrop.name}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Switch Crop</span>
          </button>
        </div>
      </div>

      {/* When a custom crop is currently active, show a distinct informative banner */}
      {isCustomCropSelected && (
        <div className="p-4 bg-sky-950/30 border border-sky-500/30 rounded-xl relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sky-300 text-sm">Selected Crop: {crop.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30 font-mono">
                {activeEvaluation.suitabilityScorePct}% Suitability
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-300">
                System Recommended: <strong className="text-emerald-400">{recommendedCrop.name}</strong> ({recommendation.suitabilityScorePct}%)
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              All crop properties, thresholds, and downstream operational advisory cards below are displaying rules tailored for <strong>{crop.name}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetToRecommended}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Use Recommended: {recommendedCrop.name}</span>
          </button>
        </div>
      )}

      {/* Recommendation / Suitability Explanation Box */}
      {isCustomCropSelected ? (
        <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl relative z-10 space-y-2">
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-sky-300">Suitability Analysis for {crop.name}: </strong>
            {activeEvaluation.suitabilityReason}
          </div>

          {/* Matching Factors Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
            {activeEvaluation.matchingFactors.map((factor, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{factor}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl relative z-10 space-y-2">
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-emerald-300">Why {recommendedCrop.name}: </strong>
            {recommendation.recommendationReason}
          </div>

          {/* Matching Factors Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
            {recommendation.matchingFactors.map((factor, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{factor}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Grid: Active Agronomic Crop Suitability Profile (Left) & Current Conditions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 text-xs">
        {/* Left: Active Crop Thresholds */}
        <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Agronomic Profile: {crop.name}
            </h4>
            {isCustomCropSelected && (
              <span className="text-[10px] text-sky-400 font-mono">Active in Advisory</span>
            )}
          </div>

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

        {/* Right: Current Weather & Environmental Conditions */}
        <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-sky-400" />
              Current Conditions & Forecast
            </h4>
            <span className="text-[11px] font-mono text-emerald-400">
              {environmentalContext.climateZone.split('(')[0].trim()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
              <div className="text-slate-400 text-[11px]">Temperature</div>
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
              <div className="text-slate-400 text-[11px]">Rainfall</div>
              <div className="text-base font-extrabold text-sky-400 mt-0.5">
                {currentWeatherSnapshot.rainMm > 0 ? `${currentWeatherSnapshot.rainMm.toFixed(1)} mm` : `${forecastSummary7Days.totalRainfallMm.toFixed(1)} mm`}
              </div>
              <div className="text-[10px] text-slate-400">
                {forecastSummary7Days.rainyDaysCount} rainy days / 7d
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              Wind: <strong className="text-slate-200">{Math.round(currentWeatherSnapshot.windKmh)} km/h {currentWeatherSnapshot.windDirectionCompass}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Slope: <strong className="text-slate-200">{environmentalContext.slopeDeg.toFixed(1)}°</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Switch Crop Modal / Dialog */}
      {isSwitcherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                  <span>Switch Crop for Farm Advisory</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a crop to evaluate custom operational rules for this Panchayat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {CROPS_CATALOG.map((c) => {
                const isRecommended = c.id === recommendedCrop.id;
                const isCurrentlyActive = c.id === crop.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCropChoose(c)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isCurrentlyActive
                        ? 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/30'
                        : isRecommended
                        ? 'bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                          {c.category}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold">
                            ★ Recommended
                          </span>
                        )}
                        {isCurrentlyActive && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Elevation: {c.idealElevationRangeM[0]}–{c.idealElevationRangeM[1]}m &bull; Temp: {c.idealTempRangeC[0]}–{c.idealTempRangeC[1]}°C
                      </div>
                    </div>

                    <div className="text-xs text-sky-400 font-medium">
                      Select &rarr;
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  onResetToRecommended();
                  setIsSwitcherOpen(false);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Use System Recommended ({recommendedCrop.name})
              </button>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
