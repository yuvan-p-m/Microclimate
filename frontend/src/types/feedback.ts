export interface FarmerFeedbackInput {
  panchayat_id: string;
  observed_rainfall: boolean;
  rainfall_intensity?: 'none' | 'light' | 'moderate' | 'heavy';
  perceived_accuracy_rating: number; // 1-5
  comments?: string;
}

export interface FarmerFeedbackRecord extends FarmerFeedbackInput {
  id: string;
  created_at: string;
}
