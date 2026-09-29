import { GitCompare, ShieldAlert } from 'lucide-react';
import type { DonorDetails, CorrectionDetails } from '../../types/weather';

interface DonorPanchayatCardProps {
  donor?: DonorDetails | null;
  correction?: CorrectionDetails | null;
}

export const DonorPanchayatCard: React.FC<DonorPanchayatCardProps> = ({ donor, correction }) => {
  if (!donor) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-400 text-sm">
        Select a target panchayat to view donor transfer mapping.
      </div>
    );
  }

  const { terrain_comparison } = donor;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-base">Terrain-Similar Donor</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
            Transfer Architecture
          </span>
        </div>

        {/* Donor Core Attributes */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
            <span className="text-slate-400 font-medium">Selected Donor:</span>
            <div className="text-right">
              <p className="font-bold text-slate-100">{donor.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{donor.id}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Terrain Similarity:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {(donor.similarity_score * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Spatial Proximity:</span>
            <span className="font-bold text-slate-200 font-mono">{donor.distance_km.toFixed(1)} km</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Climate Zone:</span>
            <span className="text-slate-200 font-medium truncate max-w-[200px]" title={donor.climate_zone}>
              {donor.climate_zone}
            </span>
          </div>

          {/* Terrain Comparison Diffs */}
          {terrain_comparison && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-1.5 text-[11px] font-medium">Topographic Differentials:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {terrain_comparison.elevation_diff_m !== undefined && (
                  <div className="bg-slate-800/50 p-1.5 rounded flex justify-between">
                    <span className="text-slate-400">Δ Elev:</span>
                    <span className={terrain_comparison.elevation_diff_m > 0 ? 'text-amber-400' : 'text-slate-300'}>
                      {terrain_comparison.elevation_diff_m > 0 ? `+${terrain_comparison.elevation_diff_m.toFixed(1)}` : terrain_comparison.elevation_diff_m.toFixed(1)} m
                    </span>
                  </div>
                )}
                {terrain_comparison.slope_diff_deg !== undefined && (
                  <div className="bg-slate-800/50 p-1.5 rounded flex justify-between">
                    <span className="text-slate-400">Δ Slope:</span>
                    <span className="text-slate-300">
                      {terrain_comparison.slope_diff_deg > 0 ? `+${terrain_comparison.slope_diff_deg.toFixed(1)}` : terrain_comparison.slope_diff_deg.toFixed(1)}°
                    </span>
                  </div>
                )}
                {terrain_comparison.ndvi_diff !== undefined && (
                  <div className="bg-slate-800/50 p-1.5 rounded flex justify-between">
                    <span className="text-slate-400">Δ NDVI:</span>
                    <span className="text-slate-300">
                      {terrain_comparison.ndvi_diff > 0 ? `+${terrain_comparison.ndvi_diff.toFixed(3)}` : terrain_comparison.ndvi_diff.toFixed(3)}
                    </span>
                  </div>
                )}
                {terrain_comparison.forest_fraction_diff !== undefined && (
                  <div className="bg-slate-800/50 p-1.5 rounded flex justify-between">
                    <span className="text-slate-400">Δ Forest:</span>
                    <span className="text-slate-300">
                      {terrain_comparison.forest_fraction_diff > 0 ? `+${(terrain_comparison.forest_fraction_diff * 100).toFixed(1)}%` : `${(terrain_comparison.forest_fraction_diff * 100).toFixed(1)}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crucial Scientific Status Notice */}
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-amber-200 mb-1">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Donor Transfer Status</span>
        </div>
        <div className="space-y-1 text-[11px] leading-snug text-slate-300">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400">Bias Correction:</span>
            <span className="text-amber-400 font-bold">{correction?.status || 'UNAVAILABLE_PROTOTYPE_MODE'}</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400">Observed Bias Used:</span>
            <span className="text-rose-400 font-bold">NO</span>
          </div>
          <p className="pt-1 text-slate-300">
            No independent observed bias is currently available. Donor matching uses multi-attribute terrain similarity.
          </p>
          {correction?.notes && (
            <p className="text-slate-400 italic text-[10px] pt-0.5">{correction.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
};
