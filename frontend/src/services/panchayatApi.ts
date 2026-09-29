/**
 * Panchayat Weather Forecast API Service.
 * Connects directly to verified FastAPI backend downscaling endpoints.
 */

import { fetchApi } from './api';
import type { PanchayatDownscaleResponse } from '../types/weather';
import type { PanchayatBase, PanchayatDetail } from '../types/panchayat';

export const panchayatApi = {
  /**
   * Retrieves hyperlocal downscaled weather forecast and terrain transfer analysis for a Panchayat.
   * Target endpoint: GET /api/v1/forecast/{panchayat_id}?date=YYYY-MM-DD
   */
  getPanchayatForecast: (panchayatId: string, date: string): Promise<PanchayatDownscaleResponse> => {
    const encodedId = encodeURIComponent(panchayatId.trim());
    const encodedDate = encodeURIComponent(date.trim());
    return fetchApi<PanchayatDownscaleResponse>(`/api/v1/forecast/${encodedId}?date=${encodedDate}`);
  },

  /** Alias for getPanchayatForecast */
  getForecast: (panchayatId: string, date: string): Promise<PanchayatDownscaleResponse> => {
    return panchayatApi.getPanchayatForecast(panchayatId, date);
  },

  /** Retrieves list of available panchayats from backend */
  listPanchayats: (): Promise<PanchayatBase[]> => {
    return fetchApi<PanchayatBase[]>('/api/v1/panchayats');
  },

  /** Retrieves detailed metadata for a specific panchayat */
  getPanchayat: (id: string): Promise<PanchayatDetail> => {
    const encodedId = encodeURIComponent(id.trim());
    return fetchApi<PanchayatDetail>(`/api/v1/panchayats/${encodedId}`);
  },
};
