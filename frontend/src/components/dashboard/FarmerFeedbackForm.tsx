import React, { useState } from 'react';
import { MessageSquarePlus, Send, Check } from 'lucide-react';
import { feedbackApi } from '../../services/feedbackApi';

interface FarmerFeedbackFormProps {
  panchayatId?: string;
}

export const FarmerFeedbackForm: React.FC<FarmerFeedbackFormProps> = ({ panchayatId }) => {
  const [observedRainfall, setObservedRainfall] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(4);
  const [comments, setComments] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panchayatId) return;

    setLoading(true);
    try {
      await feedbackApi.submitFeedback({
        panchayat_id: panchayatId,
        observed_rainfall: observedRainfall,
        perceived_accuracy_rating: rating,
        comments,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <MessageSquarePlus className="w-5 h-5 text-amber-400" />
        <h3 className="font-semibold text-base">Farmer Ground Calibration</h3>
      </div>

      {submitted ? (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" /> Feedback recorded! Will be ingested for next model calibration.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Did it rain in your panchayat today?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="rainfall"
                  checked={observedRainfall}
                  onChange={() => setObservedRainfall(true)}
                  className="accent-emerald-500"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="rainfall"
                  checked={!observedRainfall}
                  onChange={() => setObservedRainfall(false)}
                  className="accent-emerald-500"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Accuracy Rating (1 - Poor, 5 - Perfect)</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200"
            >
              <option value={5}>5 - Highly Accurate</option>
              <option value={4}>4 - Mostly Accurate</option>
              <option value={3}>3 - Moderate</option>
              <option value={2}>2 - Inaccurate</option>
              <option value={1}>1 - Completely Wrong</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Observations / Notes (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g., Heavy rain on northern slopes..."
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 h-16 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!panchayatId || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Field Feedback'}
          </button>
        </form>
      )}
    </div>
  );
};
