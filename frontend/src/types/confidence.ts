/**
 * TypeScript Definitions for AI Confidence Score Analysis.
 */

import type { ConfidenceDetails } from './weather';

export interface ConfidenceFactor {
  id: string;
  name: string;
  score: number; // 0 to 100
  weight: number; // e.g. 0.20
  status: 'optimal' | 'moderate' | 'caution';
  description: string;
  evidence: string;
}

export interface ConfidenceExplanationItem {
  type: 'positive' | 'caution' | 'neutral';
  title: string;
  detail: string;
}

export interface HistoricalDatasetSummary {
  period: string; // "1981 – 2024"
  totalYears: number; // 44
  totalObservationsPerCell: number; // 16,071
  spatialResolution: string; // "0.05° (~5.5 km)"
  totalRegionalGridCells: number; // 25
  datasetSource: string; // "INDmet (Zenodo record 15430548)"
  studyArea: string; // "Nilgiris District, Tamil Nadu"
  elevationRange: string; // "895m – 2,234m"
}

export interface CalculatedConfidenceAnalysis {
  overallScore: number; // 0 to 100 (e.g. 86)
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW';
  levelLabel: string;
  levelColorClass: string;
  scoreType: string;
  panchayatId: string;
  panchayatName: string;
  isNdviBoundaryZero: boolean;
  factors: ConfidenceFactor[];
  explanations: ConfidenceExplanationItem[];
  parameters: {
    elevation_m: number;
    slope_deg: number;
    ruggedness_tri: number;
    ndvi: number;
    forest_fraction_pct: number;
    cropland_fraction_pct: number;
    grassland_fraction_pct: number;
    builtup_fraction_pct: number;
    coastal_distance_km: number;
    climate_zone: string;
    weather_grid_distance_km: number;
    training_status: 'In Training Split' | 'Spatial Cold-Start';
  };
  historicalData: HistoricalDatasetSummary;
  rawBackendConfidence?: ConfidenceDetails;
}
