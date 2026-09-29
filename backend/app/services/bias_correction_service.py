"""Bias Correction Service for Panchayat Weather Intelligence.

Applies donor-informed residual offsets to adjust raw ML predictions when empirical
in-situ station observations are available. In the current prototype phase, clearly
flags bias correction status as unavailable to prevent fabricated offsets.
"""

from typing import Dict, Any

class BiasCorrectionService:
    def __init__(self):
        pass

    def apply_bias_correction(
        self,
        raw_prediction: Dict[str, float],
        donor_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculates donor-informed bias adjustments and computes final predictions.

        Maintains clear separation between raw RF predictions, donor offsets, and final predictions.
        """
        raw_rain = float(raw_prediction["rainfall_mm"])
        raw_tmax = float(raw_prediction["tmax_c"])
        raw_tmin = float(raw_prediction["tmin_c"])

        # In current prototype phase, in-situ station observations across rural donor Panchayats
        # are not freely accessible. No fabricated bias offset is applied.
        corr_rain = 0.0
        corr_tmax = 0.0
        corr_tmin = 0.0

        final_rain = round(raw_rain + corr_rain, 2)
        final_tmax = round(raw_tmax + corr_tmax, 2)
        final_tmin = round(raw_tmin + corr_tmin, 2)

        physical_adj_applied = False
        physical_adj_reasons = []

        # 1. Enforce non-negative rainfall
        if final_rain < 0.0:
            final_rain = 0.0
            physical_adj_applied = True
            physical_adj_reasons.append("Rainfall adjusted: non-negative physical bound enforced (>= 0.0 mm).")

        # 2. Enforce physical diurnal consistency (Tmax >= Tmin + 2.0°C)
        if final_tmax - final_tmin < 2.0:
            physical_adj_applied = True
            mid = 0.5 * (final_tmax + final_tmin)
            final_tmax = round(mid + 1.0, 2)
            final_tmin = round(mid - 1.0, 2)
            physical_adj_reasons.append(
                "Temperature adjusted: prototype diurnal constraint enforced (Tmax >= Tmin + 2.0°C)."
            )

        notes_str = (
            "Empirical station observation bias offsets are pending formal IMD Data Supply Portal "
            "in-situ station data procurement. Raw Random Forest downscaling predictions are preserved."
        )
        if physical_adj_applied:
            notes_str += " Note: Physical consistency adjustment was applied: " + " ".join(physical_adj_reasons)

        return {
            "correction_details": {
                "rainfall_correction_mm": corr_rain,
                "tmax_correction_c": corr_tmax,
                "tmin_correction_c": corr_tmin,
                "status": "UNAVAILABLE_PROTOTYPE_MODE",
                "physical_adjustment_applied": physical_adj_applied,
                "physical_adjustment_notes": " ".join(physical_adj_reasons) if physical_adj_applied else None,
                "notes": notes_str
            },
            "final_prediction": {
                "rainfall_mm": final_rain,
                "tmax_c": final_tmax,
                "tmin_c": final_tmin,
                "diurnal_range_c": round(final_tmax - final_tmin, 2)
            }
        }

bias_correction_service = BiasCorrectionService()
