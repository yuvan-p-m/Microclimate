import React from 'react';
import { CloudRain, Database, Radio, ShieldCheck, Sprout } from 'lucide-react';

export type AppTab = 'historical' | 'prediction' | 'confidence' | 'advisory';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  return (
    <header className="bg-slate-900 text-white px-4 md:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-800 shadow-md">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
          <CloudRain className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
              microclimate
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Hyperlocal Terrain-Constrained Downscaling & Transfer Architecture
          </p>
        </div>
      </div>

      {/* Navigation Tabs (4-Tab System) */}
      <nav
        aria-label="Main Navigation"
        className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full xl:w-auto justify-stretch xl:justify-end overflow-x-auto scrollbar-none"
      >
        {/* Tab 1: ML Weather History Simulation */}
        <button
          type="button"
          onClick={() => onSelectTab('historical')}
          className={`flex-1 xl:flex-initial flex items-center justify-center xl:justify-start gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'historical'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Database
            className={`w-4 h-4 shrink-0 ${
              activeTab === 'historical' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          />
          <div className="text-left">
            <div className="leading-tight">ML Weather History Simulation</div>
            <div
              className={`text-[10px] font-normal ${
                activeTab === 'historical' ? 'text-emerald-400/80' : 'text-slate-500'
              }`}
            >
              1981–2024 INDmet
            </div>
          </div>
        </button>

        {/* Tab 2: Weather Prediction */}
        <button
          type="button"
          onClick={() => onSelectTab('prediction')}
          className={`flex-1 xl:flex-initial flex items-center justify-center xl:justify-start gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'prediction'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <div className="relative flex items-center justify-center shrink-0">
            <Radio
              className={`w-4 h-4 ${
                activeTab === 'prediction' ? 'text-sky-400' : 'text-slate-400'
              }`}
            />
            {activeTab === 'prediction' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            )}
          </div>
          <div className="text-left">
            <div className="leading-tight">Weather Prediction</div>
            <div
              className={`text-[10px] font-normal ${
                activeTab === 'prediction' ? 'text-sky-400/80' : 'text-slate-500'
              }`}
            >
              ML Panchayat Prediction
            </div>
          </div>
        </button>

        {/* Tab 3: AI Confidence Score */}
        <button
          type="button"
          onClick={() => onSelectTab('confidence')}
          className={`flex-1 xl:flex-initial flex items-center justify-center xl:justify-start gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'confidence'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <ShieldCheck
            className={`w-4 h-4 shrink-0 ${
              activeTab === 'confidence' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          />
          <div className="text-left">
            <div className="leading-tight">AI Confidence Score</div>
            <div
              className={`text-[10px] font-normal ${
                activeTab === 'confidence' ? 'text-indigo-400/80' : 'text-slate-500'
              }`}
            >
              Model Analysis
            </div>
          </div>
        </button>

        {/* Tab 4: Farm Advisory */}
        <button
          type="button"
          onClick={() => onSelectTab('advisory')}
          className={`flex-1 xl:flex-initial flex items-center justify-center xl:justify-start gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'advisory'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Sprout
            className={`w-4 h-4 shrink-0 ${
              activeTab === 'advisory' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          />
          <div className="text-left">
            <div className="leading-tight">Farm Advisory</div>
            <div
              className={`text-[10px] font-normal ${
                activeTab === 'advisory' ? 'text-emerald-400/80' : 'text-slate-500'
              }`}
            >
              Rule-Based Advisory
            </div>
          </div>
        </button>
      </nav>
    </header>
  );
};
