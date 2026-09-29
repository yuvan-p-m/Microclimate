import React from 'react';
import type { CalculatedConfidenceAnalysis } from '../../types/confidence';
import { Cpu, Info } from 'lucide-react';

interface OverallScoreHeroCardProps {
  analysis: CalculatedConfidenceAnalysis;
}

export const OverallScoreHeroCard: React.FC<OverallScoreHeroCardProps> = ({ analysis }) => {
  const { overallScore, level, levelLabel, levelColorClass, panchayatName } = analysis;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-12 -left-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-25 ${
          overallScore >= 80
            ? 'bg-emerald-500'
            : overallScore >= 60
            ? 'bg-amber-500'
            : 'bg-rose-500'
        }`}
      />

      {/* Left Column: Title & Methodology */}
      <div className="space-y-3 z-10 flex-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              AI Confidence Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Confidence analysis for <strong className="text-slate-200">{panchayatName}</strong>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
          Evaluates how well the selected Panchayat is represented by the available historical, environmental, spatial, and model-training data.
        </p>

        {/* Score Categories Legend */}
        <div className="flex items-center gap-2 flex-wrap pt-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Interpretation Scale:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            80–100 High
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            60–79 Moderate
          </span>
          <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            40–59 Low
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            0–39 Very Low
          </span>
        </div>
      </div>

      {/* Right Column: Prominent Score Display */}
      <div className="z-10 flex flex-col items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-2xl min-w-[240px] text-center shadow-inner">
        <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">
          AI CONFIDENCE SCORE
        </div>

        <div className="flex items-baseline justify-center gap-1.5 my-2">
          <span className="text-5xl font-black tracking-tight text-white">
            {overallScore}
          </span>
          <span className="text-xl font-bold text-slate-500">/ 100</span>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold border mt-1 mb-2 ${levelColorClass}`}>
          {level} &bull; {levelLabel}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>Analytical indicator</span>
        </div>
      </div>
    </div>
  );
};
