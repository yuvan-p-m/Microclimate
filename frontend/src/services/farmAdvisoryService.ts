/**
 * Deterministic Rule-Based Farm Advisory & Crop Recommendation Service.
 * Evaluates live weather forecast data, Panchayat environmental context,
 * and agronomic crop thresholds to automatically recommend the optimal crop
 * and produce explainable operational farm recommendations.
 *
 * NOTE: Sourced strictly from transparent heuristic rules. This is a prototype
 * advisory engine and does NOT replace in-person agricultural expert guidance.
 */

import type { PanchayatMasterRecord } from '../types/panchayat';
import type { LiveWeatherPredictionData } from '../types/prediction';
import { CROPS_CATALOG } from './farmAdvisoryRules';
import type {
  CropRuleDefinition,
  CropRecommendationResult,
  ActiveCropEvaluationResult,
  FarmAdvisoryReport,
  AdvisoryCategoryOutput,
  AdvisoryActionStatus,
} from '../types/advisory';

function getStatusStyle(status: AdvisoryActionStatus): {
  statusLabel: string;
  statusColorClass: string;
} {
  switch (status) {
    case 'Recommended':
      return {
        statusLabel: 'Recommended',
        statusColorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      };
    case 'Monitor':
      return {
        statusLabel: 'Monitor Field',
        statusColorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      };
    case 'Delay':
      return {
        statusLabel: 'Delay Operation',
        statusColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      };
    case 'Avoid':
      return {
        statusLabel: 'Avoid / Unfavorable',
        statusColorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      };
    default:
      return {
        statusLabel: status,
        statusColorClass: 'text-slate-400 bg-slate-800 border-slate-700',
      };
  }
}

/**
 * Evaluates the agronomic suitability of a specific crop for a Panchayat and forecast.
 */
export function evaluateCropSuitability(
  crop: CropRuleDefinition,
  panchayat: PanchayatMasterRecord,
  forecast: LiveWeatherPredictionData
): ActiveCropEvaluationResult {
  const current = forecast.current;
  const daily = forecast.daily;

  const tempC = current.temperature;
  const elevationM = panchayat.elevation_m;
  const total7dRainMm = daily.reduce((sum, d) => sum + d.precipitationSum, 0);
  const currentMonth = new Date().getMonth() + 1; // 1-12

  let score = 0;
  const factors: string[] = [];

  // 1. Elevation Fit (35 max points)
  const [minElev, maxElev] = crop.idealElevationRangeM;
  if (elevationM >= minElev && elevationM <= maxElev) {
    score += 35;
    factors.push(`Optimal elevation match (${elevationM.toFixed(0)}m within ${minElev}–${maxElev}m)`);
  } else if (elevationM < minElev) {
    const elevPenalty = Math.min(35, ((minElev - elevationM) / 500) * 35);
    score += Math.max(0, 35 - elevPenalty);
    factors.push(`Lower elevation than ideal (${elevationM.toFixed(0)}m vs ideal min ${minElev}m)`);
  } else {
    const elevPenalty = Math.min(35, ((elevationM - maxElev) / 500) * 35);
    score += Math.max(0, 35 - elevPenalty);
    factors.push(`Higher elevation than ideal (${elevationM.toFixed(0)}m vs ideal max ${maxElev}m)`);
  }

  // 2. Temperature Fit (30 max points)
  const [minTemp, maxTemp] = crop.idealTempRangeC;
  if (tempC >= minTemp && tempC <= maxTemp) {
    score += 30;
    factors.push(`Temperature (${Math.round(tempC)}°C) within optimal range (${minTemp}°C–${maxTemp}°C)`);
  } else if (tempC < minTemp) {
    const tempPenalty = Math.min(30, ((minTemp - tempC) / 8) * 30);
    score += Math.max(0, 30 - tempPenalty);
    factors.push(`Current temperature (${Math.round(tempC)}°C) cooler than preferred range (${minTemp}°C–${maxTemp}°C)`);
  } else {
    const tempPenalty = Math.min(30, ((tempC - maxTemp) / 8) * 30);
    score += Math.max(0, 30 - tempPenalty);
    factors.push(`Current temperature (${Math.round(tempC)}°C) warmer than preferred range (${minTemp}°C–${maxTemp}°C)`);
  }

  // 3. Moisture & Rainfall Sensitivity (20 max points)
  if (crop.heavyRainSensitivity === 'high') {
    if (total7dRainMm < 20) {
      score += 20;
      factors.push(`Moderate rainfall (${total7dRainMm.toFixed(1)}mm) minimizes waterlogging risk`);
    } else if (total7dRainMm < 45) {
      score += 12;
      factors.push(`Moderate 7-day rainfall (${total7dRainMm.toFixed(1)}mm)`);
    } else {
      score += 5;
      factors.push(`Elevated 7-day rainfall (${total7dRainMm.toFixed(1)}mm) increases disease risk`);
    }
  } else if (crop.heavyRainSensitivity === 'medium') {
    if (total7dRainMm < 50) {
      score += 20;
      factors.push(`Well suited to moderate moisture (${total7dRainMm.toFixed(1)}mm 7-day rain)`);
    } else {
      score += 12;
      factors.push(`Higher rainfall (${total7dRainMm.toFixed(1)}mm) with moderate tolerance`);
    }
  } else {
    // Plantation / low sensitivity (e.g. Tea)
    if (total7dRainMm >= 10 || panchayat.slope_deg > 12) {
      score += 20;
      factors.push(`High slope (${panchayat.slope_deg.toFixed(1)}°) and climate suited for plantation`);
    } else {
      score += 14;
      factors.push(`Moderate plantation terrain suitability`);
    }
  }

  // 4. Sowing / Season Calendar Window (15 max points)
  if (crop.sowingMonths.includes(currentMonth)) {
    score += 15;
    factors.push(`Active planting season window in Month ${currentMonth}`);
  } else {
    score += 6;
    factors.push(`Secondary season window (Primary: ${crop.sowingSeasonNames.split(',')[0] || crop.sowingSeasonNames})`);
  }

  const finalPct = Math.min(99, Math.max(45, Math.round(score)));

  const suitabilityReason = `${crop.name} suitability score is evaluated at ${finalPct}% for ${panchayat.name}. Panchayat elevation (${elevationM.toFixed(0)}m) and current temperature (${Math.round(tempC)}°C) align with agronomic thresholds for ${crop.scientificName}.`;

  return {
    crop,
    suitabilityScorePct: finalPct,
    suitabilityReason,
    matchingFactors: factors,
  };
}

/**
 * Automatically evaluates all catalog crops and recommends the most suitable crop
 * based on Panchayat environmental features and current/forecast meteorological conditions.
 */
export function recommendBestCrop(
  panchayat: PanchayatMasterRecord,
  forecast: LiveWeatherPredictionData
): CropRecommendationResult {
  const scoredCrops = CROPS_CATALOG.map((crop) =>
    evaluateCropSuitability(crop, panchayat, forecast)
  );

  // Sort descending by score
  scoredCrops.sort((a, b) => b.suitabilityScorePct - a.suitabilityScorePct);

  const topMatch = scoredCrops[0];
  const alternatives = scoredCrops.slice(1, 4).map((sc) => ({
    crop: sc.crop,
    suitabilityScorePct: sc.suitabilityScorePct,
  }));

  const topReason = `${topMatch.crop.name} is recommended as the highest suitability match (${topMatch.suitabilityScorePct}%) for ${panchayat.name}. Panchayat elevation (${panchayat.elevation_m.toFixed(0)}m) and current temperature (${Math.round(forecast.current.temperature)}°C) closely align with the optimal physiological requirements for ${topMatch.crop.scientificName}.`;

  return {
    crop: topMatch.crop,
    suitabilityScorePct: topMatch.suitabilityScorePct,
    recommendationReason: topReason,
    matchingFactors: topMatch.matchingFactors,
    alternativeCandidates: alternatives,
  };
}

/**
 * Generates a complete deterministic rule-based advisory for the given Panchayat and live weather forecast,
 * driven by the automatically recommended or explicitly switched crop.
 */
export function generateFarmAdvisory(
  panchayat: PanchayatMasterRecord,
  forecast: LiveWeatherPredictionData,
  explicitCrop?: CropRuleDefinition
): FarmAdvisoryReport {
  // Step 1: Automatically compute crop recommendation
  const recommendation = recommendBestCrop(panchayat, forecast);
  const crop = explicitCrop || recommendation.crop;
  const activeCropEvaluation = evaluateCropSuitability(crop, panchayat, forecast);

  const current = forecast.current;
  const daily = forecast.daily;

  // Extract key forecast metrics
  const tempC = current.temperature;
  const humidityPct = current.humidity;
  const windKmh = current.windSpeed;
  const currentRainMm = current.precipitation;

  // 7-day aggregation
  const totalRainfallMm = daily.reduce((sum, d) => sum + d.precipitationSum, 0);
  const maxDailyRainMm = Math.max(...daily.map((d) => d.precipitationSum));
  const avgMaxTempC = daily.reduce((sum, d) => sum + d.tempMax, 0) / Math.max(1, daily.length);
  const avgMinTempC = daily.reduce((sum, d) => sum + d.tempMin, 0) / Math.max(1, daily.length);
  const rainyDaysCount = daily.filter((d) => d.precipitationSum >= 1.0).length;
  const maxWindKmh = Math.max(...daily.map((d) => d.windSpeedMax));

  // Next 48 hours rain estimation (first 2 days of forecast)
  const next48hRainMm = (daily[0]?.precipitationSum || 0) + (daily[1]?.precipitationSum || 0);
  const todayRainProb = daily[0]?.precipitationProbabilityMax || 0;
  const tomorrowRainProb = daily[1]?.precipitationProbabilityMax || 0;

  // Current calendar month (1-12)
  const currentMonth = new Date().getMonth() + 1;
  const isSowingSeason = crop.sowingMonths.includes(currentMonth);

  // Elevation suitability
  const isElevationSuitable =
    panchayat.elevation_m >= crop.idealElevationRangeM[0] &&
    panchayat.elevation_m <= crop.idealElevationRangeM[1];

  // -------------------------------------------------------------
  // 1. SOWING / FIELD PLANTING ADVISORY
  // -------------------------------------------------------------
  let sowingStatus: AdvisoryActionStatus = 'Recommended';
  let sowingSummary = '';
  let sowingReason = '';
  let sowingWindow = 'Next 24–48 hours';
  let sowingEvidence = '';

  if (next48hRainMm > 15 || (todayRainProb > 75 && currentRainMm > 5)) {
    sowingStatus = 'Delay';
    sowingSummary = 'Delay sowing due to expected heavy rainfall';
    sowingReason = `Heavy rainfall (${next48hRainMm.toFixed(1)} mm) is forecast over the next 24–48 hours. Advise delaying sowing to prevent waterlogging, seedbed washout, and soil compaction on hill slopes.`;
    sowingWindow = 'Hold until field drains and rain subsides';
    sowingEvidence = `Next 48h Rain: ${next48hRainMm.toFixed(1)} mm (Rain prob: ${todayRainProb}%)`;
  } else if (tempC < crop.idealTempRangeC[0] - 3 || tempC > crop.idealTempRangeC[1] + 4) {
    sowingStatus = 'Delay';
    sowingSummary = 'Current temperature outside optimal germination window';
    sowingReason = `Current temperature (${Math.round(tempC)}°C) deviates from the preferred germination range (${crop.idealTempRangeC[0]}°C–${crop.idealTempRangeC[1]}°C) for ${crop.name}.`;
    sowingWindow = 'Monitor temperature trend over next 2–3 days';
    sowingEvidence = `Current Temp: ${Math.round(tempC)}°C (Optimal: ${crop.idealTempRangeC[0]}°C–${crop.idealTempRangeC[1]}°C)`;
  } else if (!isSowingSeason) {
    sowingStatus = 'Monitor';
    sowingSummary = 'Secondary calendar period for crop sowing';
    sowingReason = `Current month is outside typical primary sowing seasons (${crop.sowingSeasonNames}) in this agro-climatic zone. Sowing may proceed if controlled nursery or irrigation is established.`;
    sowingWindow = 'Verify local nursery schedule & topsoil moisture';
    sowingEvidence = `Season: Month ${currentMonth} (Primary: ${crop.sowingMonths.join(', ')})`;
  } else {
    sowingStatus = 'Recommended';
    sowingSummary = 'Forecast conditions are suitable for field preparation & sowing';
    sowingReason = `Favorable thermal conditions (${Math.round(tempC)}°C) and moderate moisture with no immediate heavy rainfall hazards forecast.`;
    sowingWindow = 'Next 24–48 hours';
    sowingEvidence = `Temp: ${Math.round(tempC)}°C, 48h Rain: ${next48hRainMm.toFixed(1)} mm, Rain prob: ${todayRainProb}%`;
  }

  const { statusLabel: sowingLabel, statusColorClass: sowingColor } = getStatusStyle(sowingStatus);
  const sowingOutput: AdvisoryCategoryOutput = {
    title: 'Sowing & Field Preparation',
    status: sowingStatus,
    statusLabel: sowingLabel,
    statusColorClass: sowingColor,
    summary: sowingSummary,
    reason: sowingReason,
    suggestedWindow: sowingWindow,
    weatherEvidence: sowingEvidence,
    guidanceNote: 'Ensure proper hill terrace contour drainage before sowing.',
    iconName: 'Sprout',
  };

  // -------------------------------------------------------------
  // 2. IRRIGATION ADVISORY
  // -------------------------------------------------------------
  let irrigationStatus: AdvisoryActionStatus = 'Monitor';
  let irrigationSummary = '';
  let irrigationReason = '';
  let irrigationWindow = 'Monitor topsoil';
  let irrigationEvidence = '';

  if (next48hRainMm >= 15 || maxDailyRainMm >= 15) {
    irrigationStatus = 'Avoid';
    irrigationSummary = 'Defer irrigation; heavy rainfall expected';
    irrigationReason = `Heavy rainfall (${next48hRainMm.toFixed(1)} mm in 48h) is forecast. Defer all irrigation to prevent root zone waterlogging and nutrient leaching.`;
    irrigationWindow = 'Ensure field drainage channels are clear';
    irrigationEvidence = `Forecast Rain: ${next48hRainMm.toFixed(1)} mm in 48h`;
  } else if (next48hRainMm >= 4.0 || todayRainProb >= 60 || tomorrowRainProb >= 60) {
    irrigationStatus = 'Monitor';
    irrigationSummary = 'Rainfall expected; check soil moisture before irrigating';
    irrigationReason = `Rainfall (${next48hRainMm.toFixed(1)} mm) is forecast over the next 24–48 hours. Avoid unnecessary supplemental irrigation and check soil moisture first.`;
    irrigationWindow = 'Hold supplemental irrigation / inspect soil';
    irrigationEvidence = `Rain Prob: ${Math.max(todayRainProb, tomorrowRainProb)}%, Expected Rain: ${next48hRainMm.toFixed(1)} mm`;
  } else if (totalRainfallMm < 2.0 && avgMaxTempC >= 18) {
    irrigationStatus = 'Recommended';
    irrigationSummary = 'Supplemental irrigation recommended in dry conditions';
    irrigationReason = `Dry forecast conditions (7-day rain: ${totalRainfallMm.toFixed(1)} mm) and daytime temperatures (${Math.round(avgMaxTempC)}°C) increase crop evaporative demand. Irrigate where topsoil is dry.`;
    irrigationWindow = 'Tomorrow early morning or late afternoon';
    irrigationEvidence = `7-Day Rain: ${totalRainfallMm.toFixed(1)} mm, Daytime High: ${Math.round(avgMaxTempC)}°C`;
  } else {
    irrigationStatus = 'Monitor';
    irrigationSummary = 'Mild weather; monitor topsoil moisture before irrigating';
    irrigationReason = `Low immediate precipitation forecast with moderate evaporative demand. Inspect soil moisture at root depth prior to watering.`;
    irrigationWindow = 'As needed based on field soil inspection';
    irrigationEvidence = `Humidity: ${humidityPct}%, 48h Rain: ${next48hRainMm.toFixed(1)} mm`;
  }

  const { statusLabel: irrigationLabel, statusColorClass: irrigationColor } = getStatusStyle(irrigationStatus);
  const irrigationOutput: AdvisoryCategoryOutput = {
    title: 'Irrigation Management',
    status: irrigationStatus,
    statusLabel: irrigationLabel,
    statusColorClass: irrigationColor,
    summary: irrigationSummary,
    reason: irrigationReason,
    suggestedWindow: irrigationWindow,
    weatherEvidence: irrigationEvidence,
    guidanceNote: 'Drip or light furrow irrigation reduces runoff on sloping hill land.',
    iconName: 'Droplets',
  };

  // -------------------------------------------------------------
  // 3. FERTILIZER & NUTRIENT MANAGEMENT ADVISORY
  // -------------------------------------------------------------
  let fertilizerStatus: AdvisoryActionStatus = 'Recommended';
  let fertilizerSummary = '';
  let fertilizerReason = '';
  let fertilizerWindow = 'Next 2–3 days';
  let fertilizerEvidence = '';

  if (next48hRainMm > 12.0 || todayRainProb > 65 || tomorrowRainProb > 65) {
    fertilizerStatus = 'Delay';
    fertilizerSummary = 'Postpone topdressing; risk of nutrient leaching & runoff';
    fertilizerReason = `Upcoming precipitation (${next48hRainMm.toFixed(1)} mm in 48h) poses a severe risk of washing soluble fertilizers (nitrogen/potash) down hill slopes. Defer application until dry weather stabilizes.`;
    fertilizerWindow = 'Postpone until 24 hours after heavy rain';
    fertilizerEvidence = `Rain Prob: ${Math.max(todayRainProb, tomorrowRainProb)}%, 48h Rain: ${next48hRainMm.toFixed(1)} mm`;
  } else if (totalRainfallMm < 1.0 && humidityPct < 45) {
    fertilizerStatus = 'Monitor';
    fertilizerSummary = 'Dry topsoil; incorporate fertilizer with light irrigation';
    fertilizerReason = `Very dry surface conditions inhibit granule dissolution. Ensure light irrigation is applied simultaneously with nutrient topdressing.`;
    fertilizerWindow = 'Early morning with supplemental watering';
    fertilizerEvidence = `Humidity: ${humidityPct}%, 7-Day Rain: ${totalRainfallMm.toFixed(1)} mm`;
  } else {
    fertilizerStatus = 'Recommended';
    fertilizerSummary = 'Favorable soil moisture window for nutrient application';
    fertilizerReason = `Mild soil moisture and calm meteorological conditions are optimal for split-dose NPK or micronutrient application without leaching risk.`;
    fertilizerWindow = 'Next 24–48 hours';
    fertilizerEvidence = `Temp: ${Math.round(tempC)}°C, 48h Rain: ${next48hRainMm.toFixed(1)} mm (Optimal absorption)`;
  }

  const { statusLabel: fertilizerLabel, statusColorClass: fertilizerColor } = getStatusStyle(fertilizerStatus);
  const fertilizerOutput: AdvisoryCategoryOutput = {
    title: 'Fertilizer & Nutrient Guidance',
    status: fertilizerStatus,
    statusLabel: fertilizerLabel,
    statusColorClass: fertilizerColor,
    summary: fertilizerSummary,
    reason: fertilizerReason,
    suggestedWindow: fertilizerWindow,
    weatherEvidence: fertilizerEvidence,
    guidanceNote: 'Apply along terrace contours. Split-dose nitrogen application prevents leaching in hill soils.',
    iconName: 'FlaskConical',
  };

  // -------------------------------------------------------------
  // 4. CROP PROTECTION / SPRAY WEATHER WINDOW ADVISORY
  // -------------------------------------------------------------
  let sprayStatus: AdvisoryActionStatus = 'Recommended';
  let spraySummary = '';
  let sprayReason = '';
  let sprayWindow = 'Tomorrow morning';
  let sprayEvidence = '';

  if (next48hRainMm > 2.0 || todayRainProb > 45 || tomorrowRainProb > 45) {
    sprayStatus = 'Delay';
    spraySummary = 'Postpone spraying; rain forecast creates wash-off risk';
    sprayReason = `Precipitation is expected within the 24–48 hour window (Rain probability: ${Math.max(todayRainProb, tomorrowRainProb)}%). Avoid spray applications immediately before rainfall to prevent active ingredient wash-off and runoff into waterways.`;
    sprayWindow = 'Postpone until a dry 24-hour window opens';
    sprayEvidence = `Rain Prob: ${Math.max(todayRainProb, tomorrowRainProb)}%, Rain: ${next48hRainMm.toFixed(1)} mm`;
  } else if (windKmh > crop.maxSafeWindSpeedKmh || maxWindKmh > 18) {
    sprayStatus = 'Avoid';
    spraySummary = 'High wind velocity; elevated droplet drift hazard';
    sprayReason = `Wind velocity (${Math.round(windKmh)} km/h) exceeds safe field spraying limits (${crop.maxSafeWindSpeedKmh} km/h). Spraying in elevated winds causes spray drift and uneven target deposition.`;
    sprayWindow = 'Wait for calm early morning conditions (< 10 km/h)';
    sprayEvidence = `Current Wind: ${Math.round(windKmh)} km/h (Limit: ${crop.maxSafeWindSpeedKmh} km/h)`;
  } else if (humidityPct > 90) {
    sprayStatus = 'Monitor';
    spraySummary = 'High humidity/fog; elevated fungal pressure';
    sprayReason = `High relative humidity (${humidityPct}%) and morning fog elevate disease risk (e.g. late blight / leaf spot) but retard spray droplet drying. Apply once foliage dries after sunrise.`;
    sprayWindow = 'Mid-morning after dew evaporates';
    sprayEvidence = `Relative Humidity: ${humidityPct}%, Wind: ${Math.round(windKmh)} km/h`;
  } else {
    sprayStatus = 'Recommended';
    spraySummary = 'Favorable weather window for field spray operations';
    sprayReason = `Low precipitation probability (${todayRainProb}%) and calm winds (${Math.round(windKmh)} km/h) provide favorable atmospheric conditions for field applications.`;
    sprayWindow = 'Tomorrow early morning (calm winds)';
    sprayEvidence = `Rain Prob: ${todayRainProb}%, Wind: ${Math.round(windKmh)} km/h, Humidity: ${humidityPct}%`;
  }

  const { statusLabel: sprayLabel, statusColorClass: sprayColor } = getStatusStyle(sprayStatus);
  const cropProtectionOutput: AdvisoryCategoryOutput = {
    title: 'Disease & Pest Risk (Spray Window)',
    status: sprayStatus,
    statusLabel: sprayLabel,
    statusColorClass: sprayColor,
    summary: spraySummary,
    reason: sprayReason,
    suggestedWindow: sprayWindow,
    weatherEvidence: sprayEvidence,
    guidanceNote: 'Weather guidance only. Always follow product labels, safety intervals, and local agricultural officer advice. Never spray during high winds.',
    iconName: 'Shield',
  };

  // -------------------------------------------------------------
  // 5. HARVEST WEATHER WINDOW ADVISORY
  // -------------------------------------------------------------
  let harvestStatus: AdvisoryActionStatus = 'Recommended';
  let harvestSummary = '';
  let harvestReason = '';
  let harvestWindow = 'Next 48–72 hours';
  let harvestEvidence = '';

  if (next48hRainMm >= 12.0 || (todayRainProb > 70 && tomorrowRainProb > 70)) {
    harvestStatus = 'Monitor';
    harvestSummary = 'Approaching rainfall; expedite mature crop harvest where possible';
    harvestReason = `Significant rainfall (${next48hRainMm.toFixed(1)} mm) is forecast. If crops have reached biological maturity and field conditions permit, consider harvesting prior to heavy downpours to prevent crop spoilage.`;
    harvestWindow = 'Expedite if crop is fully mature before rain';
    harvestEvidence = `Incoming Rain: ${next48hRainMm.toFixed(1)} mm over 48h`;
  } else if (next48hRainMm > 2.0 || rainyDaysCount >= 4) {
    harvestStatus = 'Delay';
    harvestSummary = 'Intermittent showers expected; caution with produce drying';
    harvestReason = `Showers forecast over the next 48 hours. Wet fields may complicate machinery/labor movement and post-harvest drying.`;
    harvestWindow = 'Monitor short-term sky conditions';
    harvestEvidence = `Rainy days in 7-day outlook: ${rainyDaysCount} days`;
  } else {
    harvestStatus = 'Recommended';
    harvestSummary = 'Favorable dry weather window for harvest operations';
    harvestReason = `Dry weather conditions with minimal rain (${next48hRainMm.toFixed(1)} mm in 48h) offer favorable field conditions for harvest, transport, and produce handling.`;
    harvestWindow = 'Next 48–72 hours (subject to crop maturity)';
    harvestEvidence = `48h Rain: ${next48hRainMm.toFixed(1)} mm, Rain prob: ${todayRainProb}%`;
  }

  const { statusLabel: harvestLabel, statusColorClass: harvestColor } = getStatusStyle(harvestStatus);
  const harvestOutput: AdvisoryCategoryOutput = {
    title: 'Harvest & Weather Risk Window',
    status: harvestStatus,
    statusLabel: harvestLabel,
    statusColorClass: harvestColor,
    summary: harvestSummary,
    reason: harvestReason,
    suggestedWindow: harvestWindow,
    weatherEvidence: harvestEvidence,
    guidanceNote: 'This is a meteorological weather window assessment. Actual harvest depends on biological crop maturity and field soil readiness.',
    iconName: 'Wheat',
  };

  return {
    panchayatId: panchayat.panchayat_id,
    panchayatName: panchayat.name,
    crop,
    activeCropEvaluation,
    recommendation,
    generatedAt: new Date().toISOString(),
    currentWeatherSnapshot: {
      tempC: current.temperature,
      apparentTempC: current.apparentTemperature,
      humidityPct: current.humidity,
      windKmh: current.windSpeed,
      windDirectionCompass: current.windDirectionCompass,
      rainMm: current.precipitation,
      weatherDescription: current.weatherDescription,
    },
    forecastSummary7Days: {
      totalRainfallMm,
      maxDailyRainMm,
      avgMaxTempC,
      avgMinTempC,
      rainyDaysCount,
      next48hRainMm,
      maxWindKmh,
    },
    sowing: sowingOutput,
    irrigation: irrigationOutput,
    fertilizer: fertilizerOutput,
    cropProtection: cropProtectionOutput,
    harvest: harvestOutput,
    environmentalContext: {
      elevationM: panchayat.elevation_m,
      climateZone: panchayat.climate_zone,
      slopeDeg: panchayat.slope_deg,
      croplandPct: Math.round(panchayat.cropland_fraction * 100),
      isElevationSuitable,
    },
  };
}
