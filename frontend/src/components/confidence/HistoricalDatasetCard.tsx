import React from 'react';
import type { HistoricalDatasetSummary } from '../../types/confidence';
import { Database, Calendar, Layers, Map } from 'lucide-react';

interface HistoricalDatasetCardProps {
  summary: HistoricalDatasetSummary;
}

export const HistoricalDatasetCard: React.FC<HistoricalDatasetCardProps> = ({
  summary,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">Historical Baseline Dataset Analysis</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          INDmet Gridded Meteorological Archive
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Historical Period
          </div>
          <div className="text-base font-bold text-white mt-1">{summary.period}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{summary.totalYears} Continuous Years</div>
        </div>

        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            Daily Records per Grid Cell
          </div>
          <div className="text-base font-bold text-white mt-1">
            {summary.totalObservationsPerCell.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Records per 0.05° cell</div>
        </div>

        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Map className="w-3.5 h-3.5 text-indigo-400" />
            Nilgiris Grid Cells
          </div>
          <div className="text-base font-bold text-white mt-1">{summary.totalRegionalGridCells} Cells</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Spatial resolution: {summary.spatialResolution}</div>
        </div>

        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Elevation Extent
          </div>
          <div className="text-base font-bold text-white mt-1">{summary.elevationRange}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Copernicus GLO-30 DEM</div>
        </div>
      </div>
    </div>
  );
};
