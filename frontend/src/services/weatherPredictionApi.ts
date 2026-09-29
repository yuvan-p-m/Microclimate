/**
 * Open-Meteo Weather Forecast API Service.
 * Fetches real-time numerical weather forecast directly from Open-Meteo API.
 */

import type {
  OpenMeteoRawResponse,
  LiveWeatherPredictionData,
  ProcessedCurrentWeather,
  ProcessedDailyForecast,
  ProcessedHourlyForecast,
} from '../types/prediction';
import { getWeatherCodeInfo, degreesToCompass } from '../utils/weatherCodes';

export class WeatherPredictionApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WeatherPredictionApiError';
    this.status = status;
  }
}

/**
 * Formats a date string (YYYY-MM-DD) into a friendly label (Today, Tomorrow, or Day of week).
 */
function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Formats a date string (YYYY-MM-DD) into full readable date (e.g. "Sep 30, 2026").
 */
function formatFullDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Formats an ISO hourly time string (YYYY-MM-DDTHH:MM) into clean time (e.g. "14:00" or "02:00 PM").
 */
function formatHourlyTime(isoTimeStr: string): { formattedTime: string; formattedDate: string } {
  try {
    const [datePart, timePart] = isoTimeStr.split('T');
    const [hourStr] = (timePart || '00:00').split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const formattedTime = `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;

    // Format date part
    const parts = (datePart || '').split('-');
    let formattedDate = datePart;
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      formattedDate = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    }

    return { formattedTime, formattedDate };
  } catch {
    return { formattedTime: isoTimeStr, formattedDate: '' };
  }
}

/**
 * Fetches and processes live numerical weather forecast for given latitude and longitude from Open-Meteo.
 */
export async function getWeatherPrediction(
  latitude: number,
  longitude: number
): Promise<LiveWeatherPredictionData> {
  // Validate coordinates
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    throw new WeatherPredictionApiError(
      `Invalid geographic coordinates provided: latitude=${latitude}, longitude=${longitude}`
    );
  }

  const currentParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'is_day',
    'precipitation',
    'rain',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m',
  ].join(',');

  const hourlyParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation_probability',
    'precipitation',
    'weather_code',
    'wind_speed_10m',
  ].join(',');

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
  ].join(',');

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new WeatherPredictionApiError(
      `Unable to retrieve the live weather forecast from Open-Meteo. Network connection failed. (${errorMsg})`,
      0
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.reason || errorJson?.error || JSON.stringify(errorJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new WeatherPredictionApiError(
      `Open-Meteo Forecast API returned an error (${response.status}): ${errorDetail || 'Unable to retrieve forecast.'}`,
      response.status
    );
  }

  let raw: OpenMeteoRawResponse;
  try {
    raw = await response.json();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new WeatherPredictionApiError(
      `Malformed response received from Open-Meteo. (${errorMsg})`,
      response.status
    );
  }

  // Validate essential raw structure
  if (!raw || !raw.current || !raw.daily || !raw.hourly) {
    throw new WeatherPredictionApiError(
      'Incomplete forecast data payload received from Open-Meteo.'
    );
  }

  // Process current weather
  const currentWeatherCodeInfo = getWeatherCodeInfo(raw.current.weather_code);
  const current: ProcessedCurrentWeather = {
    time: raw.current.time,
    temperature: raw.current.temperature_2m,
    apparentTemperature: raw.current.apparent_temperature,
    humidity: raw.current.relative_humidity_2m,
    precipitation: raw.current.precipitation,
    rain: raw.current.rain,
    weatherCode: raw.current.weather_code,
    weatherDescription: currentWeatherCodeInfo.label,
    windSpeed: raw.current.wind_speed_10m,
    windDirection: raw.current.wind_direction_10m,
    windDirectionCompass: degreesToCompass(raw.current.wind_direction_10m),
    isDay: raw.current.is_day === 1,
  };

  // Process daily forecast (7 days)
  const daily: ProcessedDailyForecast[] = [];
  const dailyTimes = raw.daily.time || [];
  for (let i = 0; i < dailyTimes.length; i++) {
    const code = raw.daily.weather_code?.[i] ?? 0;
    const codeInfo = getWeatherCodeInfo(code);
    daily.push({
      date: dailyTimes[i],
      dayLabel: formatDayLabel(dailyTimes[i], i),
      fullDateFormatted: formatFullDate(dailyTimes[i]),
      weatherCode: code,
      weatherDescription: codeInfo.label,
      tempMax: raw.daily.temperature_2m_max?.[i] ?? 0,
      tempMin: raw.daily.temperature_2m_min?.[i] ?? 0,
      precipitationSum: raw.daily.precipitation_sum?.[i] ?? 0,
      precipitationProbabilityMax: raw.daily.precipitation_probability_max?.[i] ?? 0,
      windSpeedMax: raw.daily.wind_speed_10m_max?.[i] ?? 0,
    });
  }

  // Process hourly forecast (find starting near current time, next 36 hours)
  const hourly: ProcessedHourlyForecast[] = [];
  const hourlyTimes = raw.hourly.time || [];
  const currentTimeIso = raw.current.time; // e.g. "2026-09-29T22:15"
  const currentHourPrefix = currentTimeIso ? currentTimeIso.substring(0, 13) : '';

  let startIndex = 0;
  if (currentHourPrefix) {
    const foundIdx = hourlyTimes.findIndex((t) => t.startsWith(currentHourPrefix));
    if (foundIdx >= 0) {
      startIndex = foundIdx;
    }
  }

  // Take up to 36 hours from startIndex
  const maxHours = Math.min(hourlyTimes.length, startIndex + 36);
  for (let i = startIndex; i < maxHours; i++) {
    const timeIso = hourlyTimes[i];
    const { formattedTime, formattedDate } = formatHourlyTime(timeIso);
    const code = raw.hourly.weather_code?.[i] ?? 0;
    const codeInfo = getWeatherCodeInfo(code);

    hourly.push({
      time: timeIso,
      formattedTime,
      formattedDate,
      isCurrentHour: i === startIndex,
      temperature: raw.hourly.temperature_2m?.[i] ?? 0,
      humidity: raw.hourly.relative_humidity_2m?.[i] ?? 0,
      precipitationProbability: raw.hourly.precipitation_probability?.[i] ?? 0,
      precipitation: raw.hourly.precipitation?.[i] ?? 0,
      weatherCode: code,
      weatherDescription: codeInfo.label,
      windSpeed: raw.hourly.wind_speed_10m?.[i] ?? 0,
    });
  }

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    timezone: raw.timezone,
    timezoneAbbreviation: raw.timezone_abbreviation,
    fetchedAt: new Date().toISOString(),
    current,
    daily,
    hourly,
    raw,
  };
}
