import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';
import type { PanchayatSummary } from '../../types/weather';

interface ClimateZoneCardProps {
  panchayat?: PanchayatSummary | null;
}

export const ClimateZoneCard: React.FC<ClimateZoneCardProps> = ({ panchayat }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-base">Climate-Zone Constraint</h3>
        </div>

        <div className="mt-4 space-y-2.5 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Classified Agro-Climatic Zone:</span>
            <p className="font-bold text-sm text-emerald-400 mt-0.5">
              {panchayat?.climate_zone || 'Loading classification...'}
            </p>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
            <span className="text-slate-400">Classification Source:</span>
            <span className="text-slate-300 font-mono text-[10px]">
              {panchayat?.climate_zone_source || 'project_derived'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Region / State:</span>
            <span className="text-slate-200 font-medium">
              {panchayat ? `${panchayat.block} Block, Nilgiris, Tamil Nadu` : 'Nilgiris, Tamil Nadu'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-[11px] flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          Terrain donor candidate search is bounded within this agro-climatic zone to maintain physical meteorological consistency.
        </p>
      </div>
    </div>
  );
};
