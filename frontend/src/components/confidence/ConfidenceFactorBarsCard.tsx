import React from 'react';
import type { ConfidenceFactor } from '../../types/confidence';
import { Layers } from 'lucide-react';

interface ConfidenceFactorBarsCardProps {
  factors: ConfidenceFactor[];
}

export const ConfidenceFactorBarsCard: React.FC<ConfidenceFactorBarsCardProps> = ({ factors }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">Confidence Factor Breakdown</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          5 Weighted Sub-Indices (20% Weight Each)
        </span>
      </div>

      <div className="space-y-4 pt-1">
        {factors.map((factor) => {
          const score = factor.score;
          const barColor =
            score >= 80
              ? 'bg-emerald-500'
              : score >= 65
              ? 'bg-amber-500'
              : score >= 50
              ? 'bg-orange-500'
              : 'bg-rose-500';

          const textColor =
            score >= 80
              ? 'text-emerald-400'
              : score >= 65
              ? 'text-amber-400'
              : score >= 50
              ? 'text-orange-400'
              : 'text-rose-400';

          return (
            <div
              key={factor.id}
              className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2 hover:bg-slate-800/60 transition-colors"
            >
              {/* Header: Name, Weight & Score */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">
                    {factor.name}
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    {(factor.weight * 100).toFixed(0)}% wt
                  </span>
                </div>
                <span className={`text-base font-bold font-mono ${textColor}`}>
                  {factor.score} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>

              {/* Descriptions & Evidence */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-400 pt-0.5">
                <p className="text-slate-300/90">{factor.description}</p>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {factor.evidence}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
