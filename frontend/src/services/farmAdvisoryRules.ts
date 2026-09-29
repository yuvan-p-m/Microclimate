/**
 * Crop Rules and Agronomic Thresholds for Nilgiris Agro-Climatic Zones.
 * Stores transparent deterministic thresholds for the rule-based advisory engine.
 */

import type { CropRuleDefinition } from '../types/advisory';

export const CROPS_CATALOG: CropRuleDefinition[] = [
  {
    id: 'potato',
    name: 'Potato',
    category: 'Tubers',
    scientificName: 'Solanum tuberosum',
    description: 'Major Nilgiris highland commercial tuber crop grown on hill slopes and valley terraces.',
    idealElevationRangeM: [1400, 2400],
    idealTempRangeC: [14, 22],
    frostSensitive: true,
    heavyRainSensitivity: 'high',
    sowingMonths: [3, 4, 5, 8, 9, 10], // Main (Apr-May), Autumn (Aug-Sep), Summer (Jan-Feb/Mar)
    sowingSeasonNames: 'Main Crop (Apr–May), Autumn Crop (Aug–Sep), Summer Crop (Jan–Feb)',
    maxSafeWindSpeedKmh: 14,
    dryDaysRequiredForHarvest: 2,
  },
  {
    id: 'carrot',
    name: 'Carrot',
    category: 'Vegetables',
    scientificName: 'Daucus carota',
    description: 'High-value cool-season root vegetable widely cultivated in Nilgiris upland panchayats.',
    idealElevationRangeM: [1200, 2400],
    idealTempRangeC: [12, 20],
    frostSensitive: false,
    heavyRainSensitivity: 'medium',
    sowingMonths: [3, 4, 7, 8, 10, 11],
    sowingSeasonNames: 'Spring (Mar–Apr), Monsoon (Jul–Aug), Winter (Oct–Nov)',
    maxSafeWindSpeedKmh: 15,
    dryDaysRequiredForHarvest: 1,
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'Vegetables',
    scientificName: 'Brassica oleracea var. capitata',
    description: 'Hardy brassica vegetable suited to moderate-elevation terraced hill farming.',
    idealElevationRangeM: [1000, 2300],
    idealTempRangeC: [12, 22],
    frostSensitive: false,
    heavyRainSensitivity: 'medium',
    sowingMonths: [4, 5, 8, 9, 12, 1],
    sowingSeasonNames: 'Kharif (Apr–May), Late Monsoon (Aug–Sep), Winter (Dec–Jan)',
    maxSafeWindSpeedKmh: 16,
    dryDaysRequiredForHarvest: 1,
  },
  {
    id: 'beans',
    name: 'French Beans',
    category: 'Legumes',
    scientificName: 'Phaseolus vulgaris',
    description: 'Fast-growing legume grown for green pods across intermediate and high elevation slopes.',
    idealElevationRangeM: [800, 2100],
    idealTempRangeC: [15, 25],
    frostSensitive: true,
    heavyRainSensitivity: 'high',
    sowingMonths: [2, 3, 4, 7, 8],
    sowingSeasonNames: 'Summer (Feb–Mar), Pre-Monsoon (Apr–May), Kharif (Jul–Aug)',
    maxSafeWindSpeedKmh: 12,
    dryDaysRequiredForHarvest: 2,
  },
  {
    id: 'peas',
    name: 'Green Peas',
    category: 'Legumes',
    scientificName: 'Pisum sativum',
    description: 'Highland cool-climate pulse cultivated in upper Nilgiris plateau and valleys.',
    idealElevationRangeM: [1400, 2400],
    idealTempRangeC: [10, 18],
    frostSensitive: false,
    heavyRainSensitivity: 'high',
    sowingMonths: [3, 4, 8, 9, 10],
    sowingSeasonNames: 'Early Spring (Mar–Apr), Post-Monsoon (Aug–Sep, Oct)',
    maxSafeWindSpeedKmh: 14,
    dryDaysRequiredForHarvest: 2,
  },
  {
    id: 'tea',
    name: 'Tea',
    category: 'Plantation',
    scientificName: 'Camellia sinensis',
    description: 'Perennial evergreen plantation crop covering extensive undulating Nilgiris hill terrains.',
    idealElevationRangeM: [600, 2400],
    idealTempRangeC: [15, 28],
    frostSensitive: true,
    heavyRainSensitivity: 'low',
    sowingMonths: [5, 6, 9, 10], // Planting / vegetative replanting windows
    sowingSeasonNames: 'Monsoon Planting (May–Jun), Autumn Planting (Sep–Oct)',
    maxSafeWindSpeedKmh: 18,
    dryDaysRequiredForHarvest: 1,
  },
];

export function getCropById(cropId: string): CropRuleDefinition {
  return CROPS_CATALOG.find((c) => c.id === cropId) || CROPS_CATALOG[0];
}
