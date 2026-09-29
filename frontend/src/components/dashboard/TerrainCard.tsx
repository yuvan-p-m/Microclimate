import { Mountain, Compass, Waves, Sprout, Trees } from 'lucide-react';
import type { PanchayatSummary } from '../../types/weather';
import type { PanchayatMasterRecord } from '../../types/panchayat';

interface TerrainCardProps {
  panchayatSummary?: PanchayatSummary | null;
  masterRecord?: PanchayatMasterRecord | null;
}

export const TerrainCard: React.FC<TerrainCardProps> = ({ panchayatSummary, masterRecord }) => {
  if (!panchayatSummary && !masterRecord) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-400 text-sm">
        No terrain data available for selected panchayat.
      </div>
    );
  }

  const elevation = panchayatSummary?.elevation_m ?? masterRecord?.elevation_m;
  const latitude = panchayatSummary?.latitude ?? masterRecord?.latitude;
  const longitude = panchayatSummary?.longitude ?? masterRecord?.longitude;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Mountain className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-base">Topographic & Environmental Features</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs">
        {/* Elevation */}
        {elevation !== undefined && (
          <div className="bg-slate-800/50 border border-slate-700/40 p-2.5 rounded-lg flex items-center gap-2">
            <Mountain className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px]">Elevation:</span>
              <p className="font-bold text-sm text-slate-100 font-mono">{elevation.toFixed(1)} m</p>
            </div>
          </div>
        )}

        {/* Slope & Ruggedness */}
        {masterRecord && (
          <div className="bg-slate-800/50 border border-slate-700/40 p-2.5 rounded-lg flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px]">Slope / Ruggedness:</span>
              <p className="font-bold text-sm text-slate-100 font-mono">
                {masterRecord.slope_deg.toFixed(1)}° / {masterRecord.ruggedness.toFixed(1)}m
              </p>
            </div>
          </div>
        )}

        {/* Aspect */}
        {masterRecord && (
          <div className="bg-slate-800/50 border border-slate-700/40 p-2.5 rounded-lg flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px]">Aspect Angle:</span>
              <p className="font-bold text-sm text-slate-100 font-mono">{masterRecord.aspect_deg.toFixed(1)}°</p>
            </div>
          </div>
        )}

        {/* Coastal Distance */}
        {masterRecord && (
          <div className="bg-slate-800/50 border border-slate-700/40 p-2.5 rounded-lg flex items-center gap-2">
            <Waves className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px]">Coast Distance:</span>
              <p className="font-bold text-sm text-slate-100 font-mono">{masterRecord.coastal_distance_km.toFixed(1)} km</p>
            </div>
          </div>
        )}

        {/* NDVI */}
        {masterRecord && (
          <div className="bg-slate-800/50 border border-slate-700/40 p-2.5 rounded-lg flex items-center gap-2">
            <Sprout className="w-4 h-4 text-lime-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px]">NDVI Index:</span>
              <p className="font-bold text-sm text-slate-100 font-mono">{masterRecord.ndvi.toFixed(3)}</p>
            </div>
          </div>
        )}

        {/* Land Use Classification */}
        {masterRecord && (
          <div className="bg-slate-800/50 border border-slate-700/40 p-2.5 rounded-lg flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px]">Land Cover Class:</span>
              <p className="font-semibold text-xs text-slate-100 truncate">{masterRecord.land_use}</p>
            </div>
          </div>
        )}
      </div>

      {/* Surface Land Fraction Distribution */}
      {masterRecord && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-400 font-medium block mb-1.5">Surface Cover Proportions:</span>
          <div className="grid grid-cols-4 gap-2 font-mono text-center">
            <div className="bg-slate-800/40 p-1.5 rounded">
              <span className="text-slate-400 block text-[10px]">Forest</span>
              <span className="text-emerald-400">{(masterRecord.forest_fraction * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-800/40 p-1.5 rounded">
              <span className="text-slate-400 block text-[10px]">Cropland</span>
              <span className="text-amber-400">{(masterRecord.cropland_fraction * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-800/40 p-1.5 rounded">
              <span className="text-slate-400 block text-[10px]">Grassland</span>
              <span className="text-lime-400">{(masterRecord.grassland_fraction * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-800/40 p-1.5 rounded">
              <span className="text-slate-400 block text-[10px]">Built-up</span>
              <span className="text-rose-400">{(masterRecord.builtup_fraction * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Geographic Coordinates */}
      {latitude !== undefined && longitude !== undefined && (
        <div className="mt-3 pt-2 text-[11px] text-slate-500 flex justify-between">
          <span>Lat: {latitude.toFixed(4)}°N</span>
          <span>Lon: {longitude.toFixed(4)}°E</span>
        </div>
      )}
    </div>
  );
};
