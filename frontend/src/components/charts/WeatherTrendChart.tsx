import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { PanchayatDownscaleResponse } from '../../types/weather';
import { BarChart3 } from 'lucide-react';

interface ChartProps {
  forecast?: PanchayatDownscaleResponse | null;
}

export const WeatherTrendChart: React.FC<ChartProps> = ({ forecast }) => {
  if (!forecast) {
    return null;
  }

  const { input_weather, raw_prediction, final_prediction, panchayat } = forecast;

  const comparisonData = [
    {
      metric: 'Rainfall (mm)',
      'Coarse INDmet Baseline': Number(input_weather.coarse_rainfall_mm.toFixed(2)),
      'Raw RF Model': Number(raw_prediction.rainfall_mm.toFixed(2)),
      'Downscaled Hyperlocal': Number(final_prediction.rainfall_mm.toFixed(2)),
    },
    {
      metric: 'Tmax (°C)',
      'Coarse INDmet Baseline': Number(input_weather.coarse_tmax_c.toFixed(2)),
      'Raw RF Model': Number(raw_prediction.tmax_c.toFixed(2)),
      'Downscaled Hyperlocal': Number(final_prediction.tmax_c.toFixed(2)),
    },
    {
      metric: 'Tmin (°C)',
      'Coarse INDmet Baseline': Number(input_weather.coarse_tmin_c.toFixed(2)),
      'Raw RF Model': Number(raw_prediction.tmin_c.toFixed(2)),
      'Downscaled Hyperlocal': Number(final_prediction.tmin_c.toFixed(2)),
    },
    {
      metric: 'Diurnal Range (°C)',
      'Coarse INDmet Baseline': Number((input_weather.coarse_tmax_c - input_weather.coarse_tmin_c).toFixed(2)),
      'Raw RF Model': Number((raw_prediction.tmax_c - raw_prediction.tmin_c).toFixed(2)),
      'Downscaled Hyperlocal': Number(final_prediction.diurnal_range_c.toFixed(2)),
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">Meteorological Resolution Comparison</h3>
        </div>
        <span className="text-xs text-slate-400">
          Target: {panchayat.name} ({input_weather.date})
        </span>
      </div>

      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="Coarse INDmet Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Raw RF Model" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Downscaled Hyperlocal" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-800/80 pt-2.5">
        <span>Compares coarse 0.25° grid input against hyperlocal 33-feature downscaled prediction.</span>
        <span className="text-slate-500 font-mono">Elevation: {panchayat.elevation_m.toFixed(1)}m</span>
      </div>
    </div>
  );
};
