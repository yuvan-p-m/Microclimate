/**
 * TypeScript Definitions for Farm Advisory (Rule-Based Prototype).
 */

export type AdvisoryActionStatus = 'Recommended' | 'Monitor' | 'Delay' | 'Avoid';

export interface CropRuleDefinition {
  id: string;
  name: string;
  category: 'Vegetables' | 'Tubers' | 'Legumes' | 'Plantation';
  scientificName: string;
  description: string;
  idealElevationRangeM: [number, number];
  idealTempRangeC: [number, number];
  frostSensitive: boolean;
  heavyRainSensitivity: 'high' | 'medium' | 'low';
  sowingMonths: number[]; // 1 = Jan, 12 = Dec
  sowingSeasonNames: string;
  maxSafeWindSpeedKmh: number;
  dryDaysRequiredForHarvest: number;
}

export interface AdvisoryCategoryOutput {
  title: string;
  status: AdvisoryActionStatus;
  statusLabel: string;
  statusColorClass: string;
  summary: string;
  reason: string;
  suggestedWindow: string;
  weatherEvidence: string;
  guidanceNote?: string;
  iconName: string;
}

export interface CropRecommendationResult {
  crop: CropRuleDefinition;
  suitabilityScorePct: number; // 0-100
  recommendationReason: string;
  matchingFactors: string[];
  alternativeCandidates: {
    crop: CropRuleDefinition;
    suitabilityScorePct: number;
  }[];
}

export interface ActiveCropEvaluationResult {
  crop: CropRuleDefinition;
  suitabilityScorePct: number;
  suitabilityReason: string;
  matchingFactors: string[];
}

export interface FarmAdvisoryReport {
  panchayatId: string;
  panchayatName: string;
  crop: CropRuleDefinition;
  activeCropEvaluation: ActiveCropEvaluationResult;
  recommendation: CropRecommendationResult;
  generatedAt: string;
  currentWeatherSnapshot: {
    tempC: number;
    apparentTempC: number;
    humidityPct: number;
    windKmh: number;
    windDirectionCompass: string;
    rainMm: number;
    weatherDescription: string;
  };
  forecastSummary7Days: {
    totalRainfallMm: number;
    maxDailyRainMm: number;
    avgMaxTempC: number;
    avgMinTempC: number;
    rainyDaysCount: number;
    next48hRainMm: number;
    maxWindKmh: number;
  };
  sowing: AdvisoryCategoryOutput;
  irrigation: AdvisoryCategoryOutput;
  fertilizer: AdvisoryCategoryOutput;
  cropProtection: AdvisoryCategoryOutput;
  harvest: AdvisoryCategoryOutput;
  environmentalContext: {
    elevationM: number;
    climateZone: string;
    slopeDeg: number;
    croplandPct: number;
    isElevationSuitable: boolean;
  };
}
