import React from 'react';
import { ShieldCheck, Info, AlertCircle } from 'lucide-react';
import type { ConfidenceDetails } from '../../types/weather';

interface ConfidenceScoreCardProps {
  confidence?: ConfidenceDetails | null;
}

export const ConfidenceScoreCard: React.FC<ConfidenceScoreCardProps> = ({ confidence }) => {
  if (!confidence) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-400 text-sm">
        No confidence data available.
      </div>
    );
  }

  const scoreValue = confidence.score;
  const percentage = Math.round(scoreValue * 100);

  const getLevelBadgeClass = (level: string) => {
    switch (level.toUpperCase()) {
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const getProgressBarColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'HIGH':
        return 'bg-emerald-500';
      case 'MODERATE':
        return 'bg-amber-500';
      default:
        return 'bg-rose-500';
    }
  };

  const { components } = confidence;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-base">AI Confidence Score</h3>
            <p className="text-[11px] text-slate-400 font-medium">Analytical indicator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getLevelBadgeClass(confidence.level)}`}>
            {confidence.level}
          </span>
          <span className="text-xl font-extrabold text-white font-mono">
            {scoreValue.toFixed(2)} <span className="text-xs font-normal text-slate-400">({percentage}/100)</span>
          </span>
        </div>
      </div>

      <div className="mt-4">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(confidence.level)}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          ></div>
        </div>

        {/* Training Status Badge */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-slate-400">Training Partition Status:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
            {confidence.training_status === 'represented_in_training'
              ? 'Represented in Training'
              : 'Spatial Cold Start (Spatial Generalization)'}
          </span>
        </div>

        {/* Breakdown Components */}
        {components && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Base Model Reliability:</span>
              <span className="font-mono text-emerald-400">+{components.base_model_reliability?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Donor Similarity Bonus:</span>
              <span className="font-mono text-emerald-400">+{components.donor_similarity_bonus?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Donor Distance Penalty:</span>
              <span className="font-mono text-rose-400">-{components.donor_distance_penalty?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Weather Grid Penalty:</span>
              <span className="font-mono text-rose-400">-{components.weather_grid_distance_penalty?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Terrain Ruggedness Penalty:</span>
              <span className="font-mono text-rose-400">-{components.terrain_ruggedness_penalty?.toFixed(3)}</span>
            </div>
            {components.cold_start_penalty > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Cold Start Penalty:</span>
                <span className="font-mono text-rose-400">-{components.cold_start_penalty?.toFixed(3)}</span>
              </div>
            )}
          </div>
        )}

        {/* Explicit Explanation & Caution Box */}
        <div className="flex items-start gap-2 mt-3.5 p-2.5 bg-slate-800/40 rounded-lg text-xs text-slate-300 border border-slate-700/40">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p className="text-slate-300">{confidence.explanation}</p>
            <p className="text-amber-400/80 flex items-center gap-1 font-medium pt-0.5">
              <AlertCircle className="w-3 h-3" />
              Do not interpret as forecast accuracy percentage or rain probability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
