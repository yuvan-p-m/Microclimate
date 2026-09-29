import { Database } from 'lucide-react';
import type { PipelineMetadata } from '../../types/weather';

interface ScientificStatusBannerProps {
  metadata?: PipelineMetadata | null;
}

export const ScientificStatusBanner: React.FC<ScientificStatusBannerProps> = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-300">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Database className="w-4 h-4 text-emerald-400 shrink-0" />
        <h4 className="font-bold text-sm tracking-wide text-slate-200">
          Dataset & Model Information
        </h4>
      </div>

      <div className="mt-2.5 text-xs text-slate-300 leading-relaxed space-y-1.5">
        <p>
          <strong className="text-slate-200">Data:</strong> Historical rainfall and temperature are derived from the INDmet gridded meteorological dataset for 1981–2024 and combined with Panchayat terrain and environmental parameters.
        </p>
      </div>
    </div>
  );
};
