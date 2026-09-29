/**
 * Panchayat and Terrain TypeScript Definitions.
 */

export interface TerrainFeatures {
  elevation_m: number;
  slope_deg: number;
  aspect_deg: number;
  ruggedness_index: number;
  coastal_distance_km: number;
  ndvi: number;
  soil_moisture: string | number;
}

export interface PanchayatMasterRecord {
  panchayat_id: string;
  name: string;
  block_id: string;
  block_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  aspect_deg: number;
  ruggedness: number;
  coastal_distance_km: number;
  land_use: string;
  cropland_fraction: number;
  forest_fraction: number;
  grassland_fraction: number;
  builtup_fraction: number;
  water_fraction: number;
  soil_moisture: string | number;
  ndvi: number;
  climate_zone: string;
}

export interface PanchayatBase {
  id: string;
  name: string;
  block_id: string;
  block_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  climate_zone: string;
}

export interface PanchayatDetail extends PanchayatBase {
  terrain?: TerrainFeatures;
}
