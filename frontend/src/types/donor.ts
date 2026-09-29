/**
 * Donor Matching TypeScript Definitions.
 */

export interface DonorTerrainComparison {
  elevation_diff_m?: number;
  slope_diff_deg?: number;
  ndvi_diff?: number;
  forest_fraction_diff?: number;
  [key: string]: number | undefined;
}

export interface DonorPanchayatInfo {
  id: string;
  name: string;
  climate_zone: string;
  similarity_score: number;
  distance_km: number;
  terrain_comparison: DonorTerrainComparison;
}
