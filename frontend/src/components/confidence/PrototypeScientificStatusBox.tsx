import React from 'react';
import { Info } from 'lucide-react';

export const PrototypeScientificStatusBox: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Info className="w-5 h-5 text-sky-400 shrink-0" />
        <h4 className="font-bold text-sm tracking-wide text-slate-200">
          Model Information
        </h4>
      </div>

      <div className="text-xs text-slate-300 leading-relaxed">
        <p>
          <strong className="text-slate-200">Model Information:</strong> The confidence score combines historical data coverage, spatial proximity, terrain representation, climate representation, and model consistency using deterministic scoring rules. The score is an analytical indicator and is not a calibrated probability.
        </p>
      </div>
    </div>
  );
};

export const ModelInformationCard = PrototypeScientificStatusBox;

