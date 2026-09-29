import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const ConfidenceDisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-amber-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <h4 className="font-bold text-sm tracking-wide text-amber-300">
            PROTOTYPE AI CONFIDENCE SCORE &bull; HEURISTIC ARCHITECTURAL ANALYSIS
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] border border-amber-500/30">
            Heuristic Score &bull; Not Calibrated Probability
          </span>
        </div>
      </div>

      <div className="mt-2.5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          This score is a transparent heuristic analysis calculated from available historical INDmet coverage, 30m Copernicus DEM topographic features, Sentinel-2 vegetation density, and spatial grid proximity. <strong>It is not a calibrated probability of forecast accuracy</strong> and has not been validated against independent ground-truth weather stations.
        </p>
      </div>
    </div>
  );
};
