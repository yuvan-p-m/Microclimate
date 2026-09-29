import { fetchApi } from './api';
import type { FarmerFeedbackInput, FarmerFeedbackRecord } from '../types/feedback';

export const feedbackApi = {
  submitFeedback: (feedback: FarmerFeedbackInput) =>
    fetchApi<FarmerFeedbackRecord>('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),
  listFeedback: () => fetchApi<FarmerFeedbackRecord[]>('/feedback'),
};

