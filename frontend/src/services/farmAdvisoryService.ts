/**
 * Deterministic Rule-Based Farm Advisory Service.
 * Evaluates live numerical forecast data, Panchayat environmental context,
 * and agronomic crop thresholds to produce explainable farm recommendations.
 *
 * NOTE: Sourced strictly from transparent heuristic rules. This is a prototype
 * advisory engine and does NOT replace in-person agricultural expert guidance.
 */

import type { PanchayatMasterRecord } from '../types/panchayat';
import type { LiveWeatherPredictionData } from '../types/prediction';
import type {
  CropRuleDefinition,
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
 * Generates a complete deterministic rule-based advisory for the given Panchayat, crop, and live weather forecast.
 */
export function generateFarmAdvisory(
  panchayat: PanchayatMasterRecord,
  crop: CropRuleDefinition,
  forecast: LiveWeatherPredictionData
): FarmAdvisoryReport {
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
    title: 'Sowing & Field Planting',
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
  // 3. CROP PROTECTION / SPRAY WEATHER WINDOW ADVISORY
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
    spraySummary = 'High humidity/fog; slow droplet drying';
    sprayReason = `High relative humidity (${humidityPct}%) and morning fog retard spray drying. Apply once foliage dries after sunrise.`;
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
    title: 'Crop Protection (Spray Window)',
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
  // 4. HARVEST WEATHER WINDOW ADVISORY
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
    title: 'Harvest Weather Window',
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
