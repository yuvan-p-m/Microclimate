import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 text-xs text-slate-200 shadow-xl">
      <p className="font-semibold mb-2 text-slate-100">Map Legend</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shrink-0"></span>
          <span>Target Panchayat (Selected)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-white shrink-0"></span>
          <span>Matched Donor Panchayat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shrink-0"></span>
          <span>Nilgiris Panchayats (31 Total)</span>
        </div>
      </div>
    </div>
  );
};
