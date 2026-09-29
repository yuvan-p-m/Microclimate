/**
 * TypeScript Definitions for Live Weather Forecast from Open-Meteo.
 */

export interface OpenMeteoCurrentUnits {
  time: string;
  interval?: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  apparent_temperature: string;
  precipitation: string;
  rain: string;
  weather_code: string;
  wind_speed_10m: string;
  wind_direction_10m?: string;
}

export interface OpenMeteoCurrent {
  time: string;
  interval?: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day?: number;
  precipitation: number;
  rain: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

export interface OpenMeteoHourlyUnits {
  time: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  precipitation_probability: string;
  precipitation: string;
  weather_code: string;
  wind_speed_10m: string;
}

export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
}

export interface OpenMeteoDailyUnits {
  time: string;
  weather_code: string;
  temperature_2m_max: string;
  temperature_2m_min: string;
  precipitation_sum: string;
  precipitation_probability_max: string;
  wind_speed_10m_max: string;
}

export interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface OpenMeteoRawResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: OpenMeteoCurrentUnits;
  current: OpenMeteoCurrent;
  hourly_units: OpenMeteoHourlyUnits;
  hourly: OpenMeteoHourly;
  daily_units: OpenMeteoDailyUnits;
  daily: OpenMeteoDaily;
}

export interface ProcessedHourlyForecast {
  time: string;
  formattedTime: string; // e.g. "14:00" or "2 PM"
  formattedDate: string; // e.g. "Today" or "Tue 29"
  isCurrentHour: boolean;
  temperature: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
}

export interface ProcessedDailyForecast {
  date: string;
  dayLabel: string; // e.g. "Today", "Tomorrow", "Wed", "Thu"
  fullDateFormatted: string; // e.g. "Sep 30, 2026"
  weatherCode: number;
  weatherDescription: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
}

export interface ProcessedCurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  windDirection: number;
  windDirectionCompass: string;
  isDay: boolean;
}

export interface LiveWeatherPredictionData {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezoneAbbreviation: string;
  fetchedAt: string;
  current: ProcessedCurrentWeather;
  daily: ProcessedDailyForecast[];
  hourly: ProcessedHourlyForecast[];
  raw: OpenMeteoRawResponse;
}
