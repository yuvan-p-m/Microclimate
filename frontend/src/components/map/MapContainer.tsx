import React from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import { PanchayatMarkerLayer } from './PanchayatMarkerLayer';
import { GeoJsonLayer } from './GeoJsonLayer';
import { MapLegend } from './MapLegend';
import type { PanchayatMasterRecord } from '../../types/panchayat';

interface MapViewProps {
  panchayats: PanchayatMasterRecord[];
  selectedPanchayatId: string | null;
  donorPanchayatId?: string | null;
  onSelectPanchayat: (id: string) => void;
}

export const MapContainer: React.FC<MapViewProps> = ({
  panchayats,
  selectedPanchayatId,
  donorPanchayatId,
  onSelectPanchayat,
}) => {
  // Nilgiris district center (Ooty / Coonoor / Kotagiri cluster)
  const defaultCenter: [number, number] = [11.41, 76.70];

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      <LeafletMap center={defaultCenter} zoom={10} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJsonLayer />
        <PanchayatMarkerLayer
          panchayats={panchayats}
          selectedPanchayatId={selectedPanchayatId}
          donorPanchayatId={donorPanchayatId}
          onSelectPanchayat={onSelectPanchayat}
        />
      </LeafletMap>
      <MapLegend />
    </div>
  );
};
