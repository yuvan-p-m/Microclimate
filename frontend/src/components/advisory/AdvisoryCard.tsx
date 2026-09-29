import React from 'react';
import type { AdvisoryCategoryOutput } from '../../types/advisory';
import {
  Sprout,
  Droplets,
  Shield,
  Wheat,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

function renderMainIcon(name: string) {
  switch (name) {
    case 'Sprout':
      return <Sprout className="w-5 h-5 text-emerald-400" />;
    case 'Droplets':
      return <Droplets className="w-5 h-5 text-emerald-400" />;
    case 'Shield':
      return <Shield className="w-5 h-5 text-emerald-400" />;
    case 'Wheat':
      return <Wheat className="w-5 h-5 text-emerald-400" />;
    default:
      return <Sprout className="w-5 h-5 text-emerald-400" />;
  }
}

function renderStatusIcon(status: string) {
  switch (status) {
    case 'Recommended':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Monitor':
      return <Info className="w-3.5 h-3.5" />;
    case 'Delay':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'Avoid':
      return <AlertOctagon className="w-3.5 h-3.5" />;
    default:
      return <Info className="w-3.5 h-3.5" />;
  }
}

interface AdvisoryCardProps {
  advisory: AdvisoryCategoryOutput;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({ advisory }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all">
      {/* Top Header: Title, Icon & Status Badge */}
      <div className="space-y-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700/60 text-slate-200">
              {renderMainIcon(advisory.iconName)}
            </div>
            <h3 className="font-bold text-base text-white">{advisory.title}</h3>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${advisory.statusColorClass}`}
          >
            {renderStatusIcon(advisory.status)}
            <span>{advisory.statusLabel}</span>
          </div>
        </div>

        {/* Summary headline */}
        <p className="text-xs font-semibold text-slate-200">
          {advisory.summary}
        </p>
      </div>

      {/* Body: Reason & Evidence */}
      <div className="space-y-3 flex-1 text-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Reason / Rule Trigger:
          </span>
          <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            {advisory.reason}
          </p>
        </div>

        {/* Suggested Window & Weather Evidence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-700/40">
            <div className="text-slate-400 flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-sky-400" />
              Suggested Window
            </div>
            <div className="font-semibold text-slate-100">{advisory.suggestedWindow}</div>
          </div>

          <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-700/40">
            <div className="text-slate-400 flex items-center gap-1 mb-0.5">
              <Info className="w-3 h-3 text-teal-400" />
              Weather Evidence
            </div>
            <div className="font-mono text-slate-300 truncate" title={advisory.weatherEvidence}>
              {advisory.weatherEvidence}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Guidance Note */}
      {advisory.guidanceNote && (
        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5 leading-snug">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>{advisory.guidanceNote}</span>
        </div>
      )}
    </div>
  );
};
