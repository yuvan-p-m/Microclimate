import React from 'react';
import type { CalculatedConfidenceAnalysis } from '../../types/confidence';
import { Sliders, Mountain, Trees, Compass, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';

interface PanchayatParametersCardProps {
  analysis: CalculatedConfidenceAnalysis;
}

export const PanchayatParametersCard: React.FC<PanchayatParametersCardProps> = ({ analysis }) => {
  const { parameters, isNdviBoundaryZero } = analysis;

  const paramItems = [
    {
      label: 'Elevation',
      value: `${parameters.elevation_m.toFixed(0)} m`,
      detail: 'Copernicus GLO-30 DEM',
      icon: Mountain,
    },
    {
      label: 'Terrain Slope',
      value: `${parameters.slope_deg.toFixed(1)}°`,
      detail: 'Horn Gradient Algorithm',
      icon: Mountain,
    },
    {
      label: 'Ruggedness (TRI)',
      value: parameters.ruggedness_tri.toFixed(2),
      detail: 'Riley Terrain Index',
      icon: Mountain,
    },
    {
      label: 'NDVI Vegetation',
      value: parameters.ndvi.toFixed(2),
      detail: isNdviBoundaryZero ? 'Boundary-zero note' : 'Sentinel-2 Optical (10m)',
      icon: Trees,
    },
    {
      label: 'Forest Canopy',
      value: `${parameters.forest_fraction_pct}%`,
      detail: 'ESA WorldCover 2021',
      icon: Trees,
    },
    {
      label: 'Cropland Area',
      value: `${parameters.cropland_fraction_pct}%`,
      detail: 'ESA WorldCover 2021',
      icon: Trees,
    },
    {
      label: 'Grassland Area',
      value: `${parameters.grassland_fraction_pct}%`,
      detail: 'ESA WorldCover 2021',
      icon: Trees,
    },
    {
      label: 'Built-up Area',
      value: `${parameters.builtup_fraction_pct}%`,
      detail: 'Settlement Footprint',
      icon: MapPin,
    },
    {
      label: 'Coastal Distance',
      value: `${parameters.coastal_distance_km.toFixed(1)} km`,
      detail: 'Arabian Sea Geodesic',
      icon: Compass,
    },
    {
      label: 'Weather Grid Distance',
      value: `${parameters.weather_grid_distance_km.toFixed(2)} km`,
      detail: 'INDmet 0.05° Offset',
      icon: MapPin,
    },
    {
      label: 'Climate Zone',
      value: parameters.climate_zone.split('(')[0].trim(),
      detail: 'Agro-climatic Montane',
      icon: Compass,
    },
    {
      label: 'Training Partition',
      value: parameters.training_status,
      detail:
        parameters.training_status === 'In Training Split'
          ? 'Primary Train Pool'
          : 'Spatial Validation Holdout',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-base">Panchayat Environmental Parameters</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Source of Truth Feature Vector
        </span>
      </div>

      {/* NDVI Boundary Warning Banner if applicable */}
      {isNdviBoundaryZero && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Data quality note (NDVI: 0.00):</span>{' '}
            This Panchayat has a boundary-zero NDVI value in the dataset. Treat this feature cautiously.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {paramItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/40 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span>{item.label}</span>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-base font-bold text-white mt-1">
                {item.value}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
