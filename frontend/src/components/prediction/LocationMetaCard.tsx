import React from 'react';
import type { PanchayatMasterRecord } from '../../types/panchayat';
import type { LiveWeatherPredictionData } from '../../types/prediction';
import { Mountain, Compass, Trees } from 'lucide-react';

interface LocationMetaCardProps {
  panchayat: PanchayatMasterRecord;
  forecastData?: LiveWeatherPredictionData | null;
}

export const LocationMetaCard: React.FC<LocationMetaCardProps> = ({ panchayat, forecastData }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">Geographic & Topographic Profile</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          {panchayat.climate_zone.split('(')[0].trim()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Elevation */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            Elevation (DEM)
          </div>
          <div className="text-base font-bold text-white mt-1">
            {panchayat.elevation_m.toFixed(0)} <span className="text-xs font-normal text-slate-400">m</span>
          </div>
          {forecastData?.elevation && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              API Grid: {forecastData.elevation.toFixed(0)}m
            </div>
          )}
        </div>

        {/* Slope */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400">Terrain Slope</div>
          <div className="text-base font-bold text-white mt-1">
            {panchayat.slope_deg.toFixed(1)}°
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {panchayat.slope_deg > 15 ? 'Steep slope' : panchayat.slope_deg > 5 ? 'Moderate' : 'Gentle'}
          </div>
        </div>

        {/* Aspect */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            Aspect Orientation
          </div>
          <div className="text-base font-bold text-white mt-1">
            {panchayat.aspect_deg.toFixed(0)}°
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
            Azimuth Angle
          </div>
        </div>

        {/* Ruggedness */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400">Ruggedness TRI</div>
          <div className="text-base font-bold text-white mt-1">
            {panchayat.ruggedness.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {panchayat.ruggedness > 5 ? 'High relief' : 'Moderate relief'}
          </div>
        </div>

        {/* Coastal Distance */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400">Coast Distance</div>
          <div className="text-base font-bold text-white mt-1">
            {panchayat.coastal_distance_km.toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Arabian Sea proximity
          </div>
        </div>

        {/* NDVI / Vegetation */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
          <div className="text-slate-400 flex items-center gap-1">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            Vegetation Index
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            {panchayat.ndvi.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            NDVI Canopy Cover
          </div>
        </div>
      </div>
    </div>
  );
};
