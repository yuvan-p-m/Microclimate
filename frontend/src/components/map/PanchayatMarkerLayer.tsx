import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { PanchayatMasterRecord } from '../../types/panchayat';
import L from 'leaflet';

interface MarkerLayerProps {
  panchayats: PanchayatMasterRecord[];
  selectedPanchayatId: string | null;
  donorPanchayatId?: string | null;
  onSelectPanchayat: (id: string) => void;
}

// Custom Leaflet DivIcons
const defaultIcon = L.divIcon({
  className: 'custom-panchayat-marker',
  html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.6);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const selectedIcon = L.divIcon({
  className: 'custom-panchayat-marker-selected',
  html: `<div style="background-color: #f59e0b; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(245, 158, 11, 0.9); animation: pulse 2s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const donorIcon = L.divIcon({
  className: 'custom-panchayat-marker-donor',
  html: `<div style="background-color: #a855f7; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(168, 85, 247, 0.9);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export const PanchayatMarkerLayer: React.FC<MarkerLayerProps> = ({
  panchayats,
  selectedPanchayatId,
  donorPanchayatId,
  onSelectPanchayat,
}) => {
  return (
    <>
      {panchayats.map((p) => {
        const isSelected = p.panchayat_id === selectedPanchayatId;
        const isDonor = p.panchayat_id === donorPanchayatId && !isSelected;

        let icon = defaultIcon;
        if (isSelected) {
          icon = selectedIcon;
        } else if (isDonor) {
          icon = donorIcon;
        }

        return (
          <Marker
            key={p.panchayat_id}
            position={[p.latitude, p.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectPanchayat(p.panchayat_id),
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 min-w-[180px]">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                  {isSelected && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      Target
                    </span>
                  )}
                  {isDonor && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                      Donor
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">ID: {p.panchayat_id}</p>
                <div className="mt-2 text-xs space-y-0.5 border-t border-slate-200 pt-1.5 text-slate-700">
                  <p><strong>Block:</strong> {p.block_name}</p>
                  <p><strong>Elevation:</strong> {p.elevation_m.toFixed(1)} m</p>
                  <p><strong>Zone:</strong> {p.climate_zone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPanchayat(p.panchayat_id)}
                  className="mt-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1 px-2 rounded transition-colors cursor-pointer"
                >
                  {isSelected ? 'Currently Selected' : 'Select Panchayat'}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
