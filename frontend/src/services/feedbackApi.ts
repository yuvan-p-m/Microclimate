import { fetchApi } from './api';
import type { FarmerFeedbackInput, FarmerFeedbackRecord } from '../types/feedback';

export const feedbackApi = {
  submitFeedback: (feedback: FarmerFeedbackInput) =>
    fetchApi<FarmerFeedbackRecord>('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),
  listFeedback: () => fetchApi<FarmerFeedbackRecord[]>('/api/v1/feedback'),
};
