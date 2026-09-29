import React from 'react';
import type { ConfidenceExplanationItem } from '../../types/confidence';
import { HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface WhyThisScoreCardProps {
  explanations: ConfidenceExplanationItem[];
}

export const WhyThisScoreCard: React.FC<WhyThisScoreCardProps> = ({ explanations }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-base">Why This Score? (Analytical Breakdown)</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Deterministic Data Heuristics
        </span>
      </div>

      <div className="space-y-3">
        {explanations.map((item, index) => {
          const isPositive = item.type === 'positive';

          return (
            <div
              key={index}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                isPositive
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
              }`}
            >
              {isPositive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 text-xs space-y-0.5">
                <div className={`font-bold ${isPositive ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {item.title}
                </div>
                <p className="text-slate-300 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
