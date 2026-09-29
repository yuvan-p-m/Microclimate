import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  CloudSnow,
  type LucideIcon,
} from 'lucide-react';

export interface WeatherCodeDetails {
  code: number;
  label: string;
  description: string;
  category: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  icon: LucideIcon;
  colorClass: string;
  bgGradient: string;
}

const WEATHER_CODE_MAP: Record<number, Omit<WeatherCodeDetails, 'code'>> = {
  0: {
    label: 'Clear Sky',
    description: 'Cloudless, clear sky conditions',
    category: 'clear',
    icon: Sun,
    colorClass: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-amber-600/5',
  },
  1: {
    label: 'Mainly Clear',
    description: 'Predominantly clear with light patchy clouds',
    category: 'clear',
    icon: CloudSun,
    colorClass: 'text-amber-300',
    bgGradient: 'from-amber-500/20 to-sky-600/5',
  },
  2: {
    label: 'Partly Cloudy',
    description: 'Scattered clouds with intermittent sunshine',
    category: 'cloudy',
    icon: CloudSun,
    colorClass: 'text-sky-300',
    bgGradient: 'from-sky-500/20 to-slate-700/10',
  },
  3: {
    label: 'Overcast',
    description: 'Full uniform cloud cover',
    category: 'cloudy',
    icon: Cloud,
    colorClass: 'text-slate-300',
    bgGradient: 'from-slate-600/20 to-slate-800/10',
  },
  45: {
    label: 'Fog',
    description: 'Dense fog reducing surface visibility',
    category: 'fog',
    icon: CloudFog,
    colorClass: 'text-slate-400',
    bgGradient: 'from-slate-500/20 to-slate-700/10',
  },
  48: {
    label: 'Depositing Rime Fog',
    description: 'Freezing fog forming ice rime on vegetation and terrain',
    category: 'fog',
    icon: CloudFog,
    colorClass: 'text-teal-300',
    bgGradient: 'from-teal-500/20 to-slate-700/10',
  },
  51: {
    label: 'Light Drizzle',
    description: 'Fine, gentle drizzle',
    category: 'drizzle',
    icon: CloudDrizzle,
    colorClass: 'text-teal-400',
    bgGradient: 'from-teal-500/20 to-cyan-700/10',
  },
  53: {
    label: 'Moderate Drizzle',
    description: 'Steady fine mist precipitation',
    category: 'drizzle',
    icon: CloudDrizzle,
    colorClass: 'text-teal-400',
    bgGradient: 'from-teal-500/20 to-blue-700/10',
  },
  55: {
    label: 'Dense Drizzle',
    description: 'Heavy drizzle with reduced visibility',
    category: 'drizzle',
    icon: CloudDrizzle,
    colorClass: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-blue-700/10',
  },
  56: {
    label: 'Light Freezing Drizzle',
    description: 'Supercooled drizzle droplets freezing on contact',
    category: 'drizzle',
    icon: CloudDrizzle,
    colorClass: 'text-cyan-300',
    bgGradient: 'from-cyan-500/20 to-indigo-700/10',
  },
  57: {
    label: 'Dense Freezing Drizzle',
    description: 'Dense supercooled freezing drizzle',
    category: 'drizzle',
    icon: CloudDrizzle,
    colorClass: 'text-cyan-300',
    bgGradient: 'from-cyan-500/20 to-indigo-700/10',
  },
  61: {
    label: 'Slight Rain',
    description: 'Light continuous rainfall',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-indigo-700/10',
  },
  63: {
    label: 'Moderate Rain',
    description: 'Steady moderate rainfall',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-blue-400',
    bgGradient: 'from-blue-600/20 to-indigo-800/10',
  },
  65: {
    label: 'Heavy Rain',
    description: 'Intense heavy rainfall',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-blue-300',
    bgGradient: 'from-blue-700/25 to-indigo-900/15',
  },
  66: {
    label: 'Light Freezing Rain',
    description: 'Freezing rain creating glaze ice',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-sky-300',
    bgGradient: 'from-sky-500/20 to-indigo-800/10',
  },
  67: {
    label: 'Heavy Freezing Rain',
    description: 'Heavy freezing rain with rapid icing',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-sky-300',
    bgGradient: 'from-sky-600/20 to-indigo-800/10',
  },
  71: {
    label: 'Slight Snow',
    description: 'Light snowfall',
    category: 'snow',
    icon: CloudSnow,
    colorClass: 'text-slate-100',
    bgGradient: 'from-slate-200/20 to-slate-600/10',
  },
  73: {
    label: 'Moderate Snow',
    description: 'Moderate steady snowfall',
    category: 'snow',
    icon: CloudSnow,
    colorClass: 'text-slate-100',
    bgGradient: 'from-slate-200/20 to-slate-600/10',
  },
  75: {
    label: 'Heavy Snow',
    description: 'Heavy snowfall with substantial accumulation',
    category: 'snow',
    icon: CloudSnow,
    colorClass: 'text-slate-100',
    bgGradient: 'from-slate-200/25 to-slate-700/15',
  },
  77: {
    label: 'Snow Grains',
    description: 'Very small opaque white grains of ice',
    category: 'snow',
    icon: CloudSnow,
    colorClass: 'text-slate-200',
    bgGradient: 'from-slate-300/20 to-slate-700/10',
  },
  80: {
    label: 'Slight Rain Showers',
    description: 'Brief, passing light rain showers',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-sky-700/10',
  },
  81: {
    label: 'Moderate Rain Showers',
    description: 'Passing moderate rain showers',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-blue-400',
    bgGradient: 'from-blue-600/20 to-indigo-800/10',
  },
  82: {
    label: 'Violent Rain Showers',
    description: 'Sudden, torrential rain downpours',
    category: 'rain',
    icon: CloudRain,
    colorClass: 'text-blue-300',
    bgGradient: 'from-blue-700/30 to-indigo-950/20',
  },
  85: {
    label: 'Slight Snow Showers',
    description: 'Passing light snow showers',
    category: 'snow',
    icon: CloudSnow,
    colorClass: 'text-slate-100',
    bgGradient: 'from-slate-200/20 to-slate-700/10',
  },
  86: {
    label: 'Heavy Snow Showers',
    description: 'Passing heavy snow squalls',
    category: 'snow',
    icon: CloudSnow,
    colorClass: 'text-slate-100',
    bgGradient: 'from-slate-200/25 to-slate-800/15',
  },
  95: {
    label: 'Thunderstorm',
    description: 'Thunderstorm with lightning and convective rain',
    category: 'thunderstorm',
    icon: CloudLightning,
    colorClass: 'text-amber-400',
    bgGradient: 'from-amber-600/25 to-purple-900/15',
  },
  96: {
    label: 'Thunderstorm with Slight Hail',
    description: 'Thunderstorm accompanied by small hail stones',
    category: 'thunderstorm',
    icon: CloudLightning,
    colorClass: 'text-amber-400',
    bgGradient: 'from-amber-600/25 to-purple-950/20',
  },
  99: {
    label: 'Thunderstorm with Heavy Hail',
    description: 'Severe thunderstorm with intense damaging hail',
    category: 'thunderstorm',
    icon: CloudLightning,
    colorClass: 'text-rose-400',
    bgGradient: 'from-rose-600/25 to-purple-950/25',
  },
};

export function getWeatherCodeInfo(code: number): WeatherCodeDetails {
  const mapped = WEATHER_CODE_MAP[code];
  if (mapped) {
    return {
      code,
      ...mapped,
    };
  }

  // Fallback for unexpected WMO codes
  if (code >= 1 && code <= 3) {
    return {
      code,
      label: 'Cloudy',
      description: 'Cloudy skies',
      category: 'cloudy',
      icon: Cloud,
      colorClass: 'text-slate-300',
      bgGradient: 'from-slate-600/20 to-slate-800/10',
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      code,
      label: 'Rain',
      description: 'Rainy conditions',
      category: 'rain',
      icon: CloudRain,
      colorClass: 'text-blue-400',
      bgGradient: 'from-blue-600/20 to-indigo-800/10',
    };
  }
  if (code >= 80 && code <= 82) {
    return {
      code,
      label: 'Rain Showers',
      description: 'Rain shower conditions',
      category: 'rain',
      icon: CloudRain,
      colorClass: 'text-blue-400',
      bgGradient: 'from-blue-600/20 to-indigo-800/10',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      code,
      label: 'Thunderstorm',
      description: 'Thunderstorm activity',
      category: 'thunderstorm',
      icon: CloudLightning,
      colorClass: 'text-amber-400',
      bgGradient: 'from-amber-600/25 to-purple-900/15',
    };
  }

  return {
    code,
    label: 'Partly Cloudy',
    description: 'Variable cloudiness',
    category: 'cloudy',
    icon: CloudSun,
    colorClass: 'text-slate-300',
    bgGradient: 'from-slate-600/20 to-slate-800/10',
  };
}

export function degreesToCompass(degrees: number): string {
  if (degrees === undefined || degrees === null || isNaN(degrees)) return 'N';
  const val = Math.floor(degrees / 22.5 + 0.5);
  const compassPoints = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  return compassPoints[val % 16];
}
