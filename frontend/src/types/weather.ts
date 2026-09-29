/**
 * Weather and Downscaling TypeScript Definitions.
 * Strictly reflects the backend Pydantic schemas in `backend/app/schemas/weather.py`.
 */

export interface PanchayatSummary {
  id: string;
  name: string;
  block: string;
  climate_zone: string;
  climate_zone_source: string;
  elevation_m: number;
  latitude: number;
  longitude: number;
}

export interface CoarseWeatherInput {
  coarse_rainfall_mm: number;
  coarse_tmax_c: number;
  coarse_tmin_c: number;
  date: string;
  weather_grid_latitude: number;
  weather_grid_longitude: number;
  grid_distance_km: number;
}

export interface RawPrediction {
  rainfall_mm: number;
  tmax_c: number;
  tmin_c: number;
}

export interface DonorTerrainComparison {
  elevation_diff_m?: number;
  slope_diff_deg?: number;
  ndvi_diff?: number;
  forest_fraction_diff?: number;
  [key: string]: number | undefined;
}

export interface DonorDetails {
  id: string;
  name: string;
  climate_zone: string;
  similarity_score: number;
  distance_km: number;
  terrain_comparison: DonorTerrainComparison;
}

export interface CorrectionDetails {
  rainfall_correction_mm: number;
  tmax_correction_c: number;
  tmin_correction_c: number;
  status: string;
  physical_adjustment_applied: boolean;
  physical_adjustment_notes: string | null;
  notes: string;
}

export interface FinalPrediction {
  rainfall_mm: number;
  tmax_c: number;
  tmin_c: number;
  diurnal_range_c: number;
}

export interface ConfidenceComponents {
  base_model_reliability: number;
  donor_similarity_bonus: number;
  donor_distance_penalty: number;
  weather_grid_distance_penalty: number;
  terrain_ruggedness_penalty: number;
  cold_start_penalty: number;
  [key: string]: number;
}

export interface ConfidenceDetails {
  score: number;
  level: string; // e.g., "HIGH", "MODERATE", "LOW"
  score_type: string; // "prototype_heuristic_confidence"
  training_status: string; // "represented_in_training" | "spatial_cold_start"
  explanation: string;
  components: ConfidenceComponents;
}

export interface PipelineMetadata {
  model_type: string;
  model_version: string;
  target_source: string;
  scientific_status: string;
  disclaimer: string;
}

export interface PanchayatDownscaleResponse {
  panchayat: PanchayatSummary;
  input_weather: CoarseWeatherInput;
  raw_prediction: RawPrediction;
  donor: DonorDetails;
  correction: CorrectionDetails;
  final_prediction: FinalPrediction;
  confidence: ConfidenceDetails;
  metadata: PipelineMetadata;
}
