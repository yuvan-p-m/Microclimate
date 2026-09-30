import React from 'react';
import { Cpu } from 'lucide-react';

export const MLPredictionDisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-4 text-sky-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-sky-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-wide text-sky-300">
              ML PANCHAYAT WEATHER PREDICTION
            </h4>
            <span className="text-[11px] text-sky-400/80">
              Historical weather patterns + local environmental features
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 text-xs text-sky-200/90 leading-relaxed">
        <p>
          Predicted using historical weather patterns and Panchayat environmental features.
        </p>
      </div>
    </div>
  );
};
