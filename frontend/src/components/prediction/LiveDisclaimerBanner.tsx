import React from 'react';
import { Globe, Radio, ExternalLink } from 'lucide-react';

export const LiveDisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-4 text-sky-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-2 border-b border-sky-500/20">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-sky-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h4 className="font-bold text-sm tracking-wide text-sky-300">
            LIVE FORECAST &bull; NUMERICAL WEATHER PREDICTION
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px] border border-sky-500/30 flex items-center gap-1">
            <Globe className="w-3 h-3 text-sky-400" />
            Source: Open-Meteo
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
            Forecast Horizon: 7 Days
          </span>
        </div>
      </div>

      <div className="mt-2.5 text-xs text-sky-200/90 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p>
          This forecast is retrieved live from the <strong>Open-Meteo</strong> numerical weather prediction service using precise Panchayat coordinates. It is completely separate and independent from the historical 1981–2024 INDmet downscaling simulation.
        </p>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-2 shrink-0 font-medium"
        >
          Open-Meteo Docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
