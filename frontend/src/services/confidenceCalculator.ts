/**
 * Heuristic AI Confidence Calculation Service.
 * Computes transparent, explainable prototype confidence metrics based on
 * verified Panchayat topographic parameters, historical INDmet gridded dataset coverage,
 * and spatial model training partitions.
 *
 * NOTE: Sourced strictly from verified project data. This heuristic reflects
 * data representation and architectural features, NOT calibrated forecast probabilities
 * or validated real-world meteorological forecast accuracy.
 */

import type { PanchayatMasterRecord } from '../types/panchayat';
import type { PanchayatDownscaleResponse } from '../types/weather';
import type { LiveWeatherPredictionData } from '../types/prediction';
import type {
  CalculatedConfidenceAnalysis,
  ConfidenceFactor,
  ConfidenceExplanationItem,
} from '../types/confidence';

/**
 * Exact distance in km from Panchayat centroid to nearest mapped INDmet 0.05° grid center.
 * Sourced directly from `backend/data/processed/panchayat_weather_grid_mapping.csv`.
 */
export const GRID_DISTANCE_MAP: Record<string, number> = {
  TN_NIL_OOTY_01: 2.73,
  TN_NIL_OOTY_02: 0.55,
  TN_NIL_OOTY_03: 1.50,
  TN_NIL_OOTY_04: 1.31,
  TN_NIL_OOTY_05: 2.28,
  TN_NIL_OOTY_06: 1.98,
  TN_NIL_OOTY_07: 2.01,
  TN_NIL_OOTY_08: 2.96,
  TN_NIL_OOTY_09: 2.09,
  TN_NIL_CNR_01: 3.34,
  TN_NIL_CNR_02: 2.40,
  TN_NIL_CNR_03: 1.23,
  TN_NIL_CNR_04: 1.39,
  TN_NIL_CNR_05: 2.05,
  TN_NIL_CNR_06: 2.08,
  TN_NIL_CNR_07: 2.59,
  TN_NIL_KTG_01: 1.01,
  TN_NIL_KTG_02: 3.22,
  TN_NIL_KTG_03: 2.33,
  TN_NIL_KTG_04: 2.35,
  TN_NIL_KTG_05: 0.56,
  TN_NIL_KTG_06: 1.11,
  TN_NIL_GDL_01: 2.98,
  TN_NIL_GDL_02: 1.94,
  TN_NIL_GDL_03: 0.76,
  TN_NIL_GDL_04: 1.61,
  TN_NIL_GDL_05: 2.66,
  TN_NIL_GDL_06: 1.89,
  TN_NIL_KND_01: 1.59,
  TN_NIL_KND_02: 1.58,
  TN_NIL_KND_03: 2.62,
};

/**
 * Held-out Panchayats used for spatial cold-start evaluation in the research pipeline.
 * Sourced directly from `backend/app/services/confidence_service.py` and `model_evaluation.json`.
 */
export const HELDOUT_PANCHAYAT_IDS = [
  'TN_NIL_OOTY_01',
  'TN_NIL_CNR_02',
  'TN_NIL_KTG_03',
  'TN_NIL_GDL_04',
  'TN_NIL_KND_02',
  'TN_NIL_CNR_07',
];

/**
 * Calculates a rich, transparent confidence analysis for a selected Panchayat.
 */
export function calculateConfidenceAnalysis(
  panchayat: PanchayatMasterRecord,
  backendForecast?: PanchayatDownscaleResponse | null,
  _liveForecast?: LiveWeatherPredictionData | null
): CalculatedConfidenceAnalysis {
  const gridDistanceKm =
    backendForecast?.input_weather?.grid_distance_km ??
    GRID_DISTANCE_MAP[panchayat.panchayat_id] ??
    1.96;

  const isColdStart = HELDOUT_PANCHAYAT_IDS.includes(panchayat.panchayat_id);
  const trainingStatus: 'In Training Split' | 'Spatial Cold-Start' = isColdStart
    ? 'Spatial Cold-Start'
    : 'In Training Split';

  const isNdviBoundaryZero = panchayat.ndvi <= 0.001;

  // 1. Factor: Historical Data Coverage (20% weight)
  const dataCoverageScore = isColdStart ? 88 : 95;
  const dataCoverageFactor: ConfidenceFactor = {
    id: 'historical_data_coverage',
    name: 'Historical Data Coverage',
    score: dataCoverageScore,
    weight: 0.20,
    status: dataCoverageScore >= 85 ? 'optimal' : 'moderate',
    description: '44 years (1981–2024) of daily INDmet gridded meteorological records.',
    evidence: '16,071 daily grid records per cell across 25 Nilgiris cells without temporal discontinuity.',
  };

  // 2. Factor: Spatial Grid Proximity (20% weight)
  const gridProximityScore = Math.round(Math.max(60, Math.min(96, 96 - gridDistanceKm * 5.2)));
  const gridFactor: ConfidenceFactor = {
    id: 'spatial_grid_proximity',
    name: 'Spatial Grid Proximity',
    score: gridProximityScore,
    weight: 0.20,
    status: gridProximityScore >= 85 ? 'optimal' : gridProximityScore >= 70 ? 'moderate' : 'caution',
    description: 'Geodesic distance between Panchayat administrative centroid and nearest mapped INDmet 0.05° grid center.',
    evidence: `INDmet grid records mapped to ${panchayat.name} from grid cell at ${gridDistanceKm.toFixed(2)} km distance.`,
  };

  // 3. Factor: Terrain Representation (20% weight)
  const terrainScore = Math.round(
    Math.max(
      60,
      Math.min(94, 94 - (panchayat.ruggedness / 16.0) * 14 - (panchayat.slope_deg / 30.0) * 12)
    )
  );
  const terrainFactor: ConfidenceFactor = {
    id: 'terrain_representation',
    name: 'Terrain Representation',
    score: terrainScore,
    weight: 0.20,
    status: terrainScore >= 80 ? 'optimal' : terrainScore >= 70 ? 'moderate' : 'caution',
    description: 'Topographic complexity assessed from 30m Copernicus DEM slope, elevation, and terrain ruggedness (TRI).',
    evidence: `Elevation: ${panchayat.elevation_m.toFixed(0)}m, Slope: ${panchayat.slope_deg.toFixed(1)}°, TRI: ${panchayat.ruggedness.toFixed(2)}.`,
  };

  // 4. Factor: Climate & Ecological Representation (20% weight)
  const baseClimateScore = 83;
  const ndviContribution = !isNdviBoundaryZero ? panchayat.ndvi * 16 : panchayat.forest_fraction > 0.5 ? 6 : 2;
  const climateScore = Math.round(
    Math.max(65, Math.min(95, baseClimateScore + ndviContribution - (isColdStart ? 4 : 0)))
  );
  const climateFactor: ConfidenceFactor = {
    id: 'climate_representation',
    name: 'Climate & Ecological Representation',
    score: climateScore,
    weight: 0.20,
    status: climateScore >= 80 ? 'optimal' : 'moderate',
    description: 'Agro-climatic classification and ecological habitat representation in the study region.',
    evidence: `Zone: ${panchayat.climate_zone.split('(')[0].trim()}, Land use: ${panchayat.land_use}${
      isNdviBoundaryZero ? ' (boundary-zero NDVI noted)' : `, NDVI: ${panchayat.ndvi.toFixed(2)}`
    }.`,
  };

  // 5. Factor: Model Representation & Prediction Context (20% weight)
  const modelRepScore = isColdStart ? 76 : 88;
  const modelRepFactor: ConfidenceFactor = {
    id: 'model_representation',
    name: 'Model Representation & Prediction Context',
    score: modelRepScore,
    weight: 0.20,
    status: isColdStart ? 'moderate' : 'optimal',
    description: 'Evaluates whether the selected Panchayat is represented in the model training partition and how its spatial/environmental context relates to the available training data.',
    evidence: `Training status: ${trainingStatus}.`,
  };

  const factors: ConfidenceFactor[] = [
    dataCoverageFactor,
    gridFactor,
    terrainFactor,
    climateFactor,
    modelRepFactor,
  ];

  // Overall Composite Score (weighted average, rounded to integer)
  const rawOverall = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const overallScore = Math.round(rawOverall);

  // Qualitative Level
  let level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW';
  let levelLabel: string;
  let levelColorClass: string;

  if (overallScore >= 80) {
    level = 'HIGH';
    levelLabel = 'High Confidence';
    levelColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  } else if (overallScore >= 60) {
    level = 'MODERATE';
    levelLabel = 'Moderate Confidence';
    levelColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  } else if (overallScore >= 40) {
    level = 'LOW';
    levelLabel = 'Low Confidence';
    levelColorClass = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  } else {
    level = 'VERY LOW';
    levelLabel = 'Very Low Confidence';
    levelColorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  }

  // Explanations: Why this score?
  const explanations: ConfidenceExplanationItem[] = [];

  // 1. Data coverage
  explanations.push({
    type: 'positive',
    title: 'Complete 44-Year INDmet Grid Coverage',
    detail: '44 years (1981–2024) of complete INDmet daily gridded meteorological records are available for the mapped grid cell.',
  });

  // 2. Spatial proximity
  if (gridDistanceKm <= 2.0) {
    explanations.push({
      type: 'positive',
      title: 'Close Meteorological Grid Proximity',
      detail: `Panchayat centroid is ${gridDistanceKm.toFixed(2)} km from its mapped INDmet 0.05° grid cell center.`,
    });
  } else {
    explanations.push({
      type: 'caution',
      title: 'Spatial Grid Offset',
      detail: `Panchayat is ${gridDistanceKm.toFixed(2)} km from its mapped INDmet grid centroid, requiring spatial interpolation.`,
    });
  }

  // 3. Topography
  explanations.push({
    type: 'positive',
    title: 'Topographic Features Available',
    detail: `Elevation (${panchayat.elevation_m.toFixed(0)}m), slope (${panchayat.slope_deg.toFixed(1)}°), and terrain ruggedness (${panchayat.ruggedness.toFixed(2)}) are sourced from 30m Copernicus DEM.`,
  });

  // 4. Climate
  explanations.push({
    type: 'positive',
    title: 'Climate Zone Represented',
    detail: `Regional agro-climatic zone (${panchayat.climate_zone.split('(')[0].trim()}) is represented in the available model dataset.`,
  });

  // 5. Training representation
  if (!isColdStart) {
    explanations.push({
      type: 'positive',
      title: 'Model Training Representation',
      detail: "The Panchayat is represented in the model's training partition. This indicates data representation, not real-world forecast validation.",
    });
  } else {
    explanations.push({
      type: 'caution',
      title: 'Spatial Cold-Start Holdout',
      detail: 'This Panchayat was not included in the spatial training pool. Confidence reflects spatial similarity and regional representation rather than direct training coverage.',
    });
  }

  // 6. NDVI boundary warning if applicable
  if (isNdviBoundaryZero) {
    explanations.push({
      type: 'caution',
      title: 'NDVI Boundary-Zero Data Quality Note',
      detail: 'This Panchayat has a boundary-zero NDVI value (0.00) in the dataset. Treat this feature cautiously.',
    });
  }

  return {
    overallScore,
    level,
    levelLabel,
    levelColorClass,
    scoreType: 'prototype_heuristic_confidence',
    panchayatId: panchayat.panchayat_id,
    panchayatName: panchayat.name,
    isNdviBoundaryZero,
    factors,
    explanations,
    parameters: {
      elevation_m: panchayat.elevation_m,
      slope_deg: panchayat.slope_deg,
      ruggedness_tri: panchayat.ruggedness,
      ndvi: panchayat.ndvi,
      forest_fraction_pct: Math.round(panchayat.forest_fraction * 100),
      cropland_fraction_pct: Math.round(panchayat.cropland_fraction * 100),
      grassland_fraction_pct: Math.round(panchayat.grassland_fraction * 100),
      builtup_fraction_pct: Math.round(panchayat.builtup_fraction * 100),
      coastal_distance_km: panchayat.coastal_distance_km,
      climate_zone: panchayat.climate_zone,
      weather_grid_distance_km: gridDistanceKm,
      training_status: trainingStatus,
    },
    historicalData: {
      period: '1981 – 2024',
      totalYears: 44,
      totalObservationsPerCell: 16071,
      spatialResolution: '0.05° (~5.5 km)',
      totalRegionalGridCells: 25,
      datasetSource: 'INDmet (Zenodo record 15430548)',
      studyArea: 'Nilgiris District, Tamil Nadu',
      elevationRange: '895m – 2,234m',
    },
    rawBackendConfidence: backendForecast?.confidence,
  };
}
