import React from 'react';
import { HelpCircle, AlertTriangle, Sprout, CloudRain, Cpu, ShieldCheck } from 'lucide-react';

export const AdvisoryMethodologyBox: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-base">How the Farm Advisory Is Generated</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
          Deterministic Rule Engine
        </span>
      </div>

      {/* Conceptual Flow Diagram */}
      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center justify-center space-y-1">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-slate-200">1. Crop Selection</span>
            <span className="text-[11px] text-slate-400">Agronomic thermal & elevation rules</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center justify-center space-y-1">
            <CloudRain className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-slate-200">2. Live Forecast</span>
            <span className="text-[11px] text-slate-400">Rain sum, probability, wind, temp</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center justify-center space-y-1">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-slate-200">3. Rule Engine</span>
            <span className="text-[11px] text-slate-400">Deterministic threshold evaluation</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center justify-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-slate-200">4. Farm Advisory</span>
            <span className="text-[11px] text-slate-400">Sowing, irrigation, spray, harvest</span>
          </div>
        </div>
      </div>

      {/* Advisory Method Notice */}
      <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="leading-relaxed">
            <strong className="text-slate-200">Advisory Method:</strong> Recommendations are generated using deterministic agricultural rules based on crop, season, environmental conditions, and forecast weather. It does not replace in-person agricultural expertise, field soil inspections, or product-label safety directions.
          </p>
        </div>
      </div>
    </div>
  );
};
