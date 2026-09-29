"""Comprehensive Unit and Integration Tests for Downscaling Inference Pipeline.

Covers the complete 18-point verification matrix:
1. Valid Panchayat + valid date inference execution
2. Invalid Panchayat ID error handling (404)
3. Missing historical weather date error handling (no fallback weather)
4. Feature vector dimensions (exactly 1 x 33)
5. Model loading and artifact integrity (rainfall, tmax, tmin RFs)
6. Numeric predictions validation (finite, non-null, non-NaN)
7. Physical non-negative rainfall constraint (Rainfall >= 0)
8. Physical diurnal temperature constraint (Tmax >= Tmin + 2.0°C)
9. Donor Panchayat exclusion (donor != target)
10. Climate-zone constrained donor selection (candidate in same zone)
11. Complete response sections and Pydantic validation
12. Synthetic-target scientific warning & metadata
13. Exact feature ordering matching feature_names.json
14. No target leakage in predictor vector
15. Missing feature detection in vector assembly
16. Non-finite feature detection
17. Prototype bias correction status (UNAVAILABLE_PROTOTYPE_MODE, zero offset)
18. Confidence is explicitly heuristic and declares cold-start status
"""

import unittest
import math
import json
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import HTTPException

from backend.app.api.v1.forecast import get_panchayat_forecast
from backend.app.services.feature_service import feature_service
from backend.app.services.donor_selection_service import donor_selection_service
from backend.app.services.bias_correction_service import bias_correction_service
from backend.app.services.confidence_service import confidence_service
from backend.app.services.downscaling_service import downscaling_service
from backend.app.schemas.weather import PanchayatDownscaleResponse


class TestDownscalingPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        feature_service.initialize()
        downscaling_service.load_models()

    def test_01_valid_panchayat_and_date_inference(self):
        """1. Verify valid Panchayat + valid date inference execution."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_01", "2024-07-15")
        self.assertIsInstance(res, dict)
        self.assertEqual(res["panchayat"]["id"], "TN_NIL_OOTY_01")
        self.assertEqual(res["input_weather"]["date"], "2024-07-15")

    def test_02_invalid_panchayat_error_handling(self):
        """2. Verify clear error handling (404) for unknown Panchayat."""
        with self.assertRaises(KeyError):
            feature_service.get_panchayat_data("TN_INVALID_999")

        with self.assertRaises(HTTPException) as ctx:
            get_panchayat_forecast(panchayat_id="TN_INVALID_999", date="2024-07-15")
        self.assertEqual(ctx.exception.status_code, 404)

    def test_03_missing_weather_date_no_fallback(self):
        """3. Verify missing weather date raises error and does NOT silently fallback."""
        with self.assertRaises(KeyError):
            feature_service.get_coarse_weather("TN_NIL_OOTY_01", "1970-01-01")

        with self.assertRaises(KeyError):
            downscaling_service.predict_for_panchayat("TN_NIL_OOTY_01", "1970-01-01")

    def test_04_feature_vector_dimensions(self):
        """4. Verify feature vector dimensions are exactly 1 x 33."""
        weather = feature_service.get_coarse_weather("TN_NIL_OOTY_01", "2024-07-15")
        X = feature_service.build_feature_vector("TN_NIL_OOTY_01", weather, "2024-07-15")
        self.assertEqual(X.shape, (1, 33))

    def test_05_model_loading_and_integrity(self):
        """5. Verify all three trained RF models are loaded and operational."""
        self.assertIsNotNone(downscaling_service.rainfall_model)
        self.assertIsNotNone(downscaling_service.tmax_model)
        self.assertIsNotNone(downscaling_service.tmin_model)
        self.assertEqual(downscaling_service.rainfall_model.n_features_in_, 33)
        self.assertEqual(downscaling_service.tmax_model.n_features_in_, 33)
        self.assertEqual(downscaling_service.tmin_model.n_features_in_, 33)

    def test_06_prediction_values_are_numeric_finite(self):
        """6. Verify all model predictions are finite numbers without NaN / Inf."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_01", "2024-07-15")
        for key in ["rainfall_mm", "tmax_c", "tmin_c"]:
            val_raw = res["raw_prediction"][key]
            val_fin = res["final_prediction"][key]
            self.assertTrue(math.isfinite(val_raw))
            self.assertTrue(math.isfinite(val_fin))

    def test_07_rainfall_non_negative_constraint(self):
        """7. Verify non-negative rainfall physical constraint."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_CNR_07", "2024-07-15")
        self.assertGreaterEqual(res["final_prediction"]["rainfall_mm"], 0.0)

        # Explicit test on bias correction service
        mock_raw = {"rainfall_mm": -5.0, "tmax_c": 25.0, "tmin_c": 15.0}
        corr = bias_correction_service.apply_bias_correction(mock_raw, {})
        self.assertEqual(corr["final_prediction"]["rainfall_mm"], 0.0)
        self.assertTrue(corr["correction_details"]["physical_adjustment_applied"])

    def test_08_tmax_ge_tmin_diurnal_constraint(self):
        """8. Verify physical diurnal temperature constraint (Tmax >= Tmin + 2.0°C)."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_GDL_04", "2024-07-15")
        final_p = res["final_prediction"]
        self.assertGreaterEqual(final_p["tmax_c"], final_p["tmin_c"])
        self.assertGreaterEqual(final_p["diurnal_range_c"], 1.99)

        # Explicit test on bias correction service when Tmax < Tmin + 2
        mock_raw = {"rainfall_mm": 5.0, "tmax_c": 15.0, "tmin_c": 14.5}
        corr = bias_correction_service.apply_bias_correction(mock_raw, {})
        self.assertGreaterEqual(corr["final_prediction"]["diurnal_range_c"], 2.0)
        self.assertTrue(corr["correction_details"]["physical_adjustment_applied"])

    def test_09_donor_not_equal_to_target(self):
        """9. Verify donor Panchayat is strictly not equal to the target Panchayat."""
        for pid in ["TN_NIL_OOTY_01", "TN_NIL_CNR_07", "TN_NIL_GDL_04", "TN_NIL_KTG_01"]:
            donor_res = donor_selection_service.select_best_donor(pid)
            self.assertNotEqual(donor_res["best_donor"]["id"], pid)

    def test_10_donor_in_target_climate_zone(self):
        """10. Verify selected donor belongs to target climate-zone candidate set."""
        for pid in ["TN_NIL_OOTY_01", "TN_NIL_CNR_07", "TN_NIL_GDL_04"]:
            donor_res = donor_selection_service.select_best_donor(pid)
            self.assertEqual(donor_res["best_donor"]["climate_zone"], donor_res["target_climate_zone"])

    def test_11_complete_response_sections_and_pydantic_validation(self):
        """11. Verify complete response sections and Pydantic schema validation."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_03", "2023-10-20")
        expected_sections = [
            "panchayat", "input_weather", "raw_prediction", "donor",
            "correction", "final_prediction", "confidence", "metadata"
        ]
        for sec in expected_sections:
            self.assertIn(sec, res)

        validated = PanchayatDownscaleResponse(**res)
        self.assertEqual(validated.panchayat.id, "TN_NIL_OOTY_03")

    def test_12_synthetic_target_scientific_warning(self):
        """12. Verify synthetic-target scientific warning and metadata."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_01", "2024-07-15")
        meta = res["metadata"]
        self.assertEqual(meta["target_source"], "synthetic_training_target")
        self.assertEqual(meta["scientific_status"], "prototype_not_real_world_validated")
        self.assertIn("synthetic", meta["disclaimer"].lower())

    def test_13_exact_feature_ordering(self):
        """13. Verify feature vector ordering matches feature_names.json exactly."""
        feat_path = Path("backend/data/models/feature_names.json")
        with open(feat_path, "r", encoding="utf-8") as f:
            expected_features = json.load(f)["features"]

        weather = feature_service.get_coarse_weather("TN_NIL_OOTY_01", "2024-07-15")
        X = feature_service.build_feature_vector("TN_NIL_OOTY_01", weather, "2024-07-15")

        self.assertEqual(list(X.columns), expected_features)

    def test_14_no_target_leakage(self):
        """14. Verify model input vector contains zero target columns or target derivatives."""
        weather = feature_service.get_coarse_weather("TN_NIL_OOTY_01", "2024-07-15")
        X = feature_service.build_feature_vector("TN_NIL_OOTY_01", weather, "2024-07-15")

        forbidden_cols = [
            "synthetic_rainfall_mm", "synthetic_tmax_c", "synthetic_tmin_c",
            "target_rainfall", "target_tmax", "target_tmin",
            "reference_indmet_rainfall_mm", "reference_indmet_tmax_c", "reference_indmet_tmin_c"
        ]
        for col in forbidden_cols:
            self.assertNotIn(col, X.columns)

    def test_15_missing_feature_detection(self):
        """15. Verify missing feature in dictionary triggers error."""
        weather = feature_service.get_coarse_weather("TN_NIL_OOTY_01", "2024-07-15")
        # Save original feature names and inject a fictitious feature
        original_features = list(feature_service.feature_names)
        try:
            feature_service.feature_names = original_features + ["non_existent_feature_xyz"]
            with self.assertRaises(KeyError):
                feature_service.build_feature_vector("TN_NIL_OOTY_01", weather, "2024-07-15")
        finally:
            feature_service.feature_names = original_features

    def test_16_non_finite_feature_detection(self):
        """16. Verify non-finite / NaN feature detection."""
        weather = feature_service.get_coarse_weather("TN_NIL_OOTY_01", "2024-07-15")
        weather_nan = dict(weather)
        weather_nan["coarse_rainfall_mm"] = float("nan")

        with self.assertRaises(ValueError):
            feature_service.build_feature_vector("TN_NIL_OOTY_01", weather_nan, "2024-07-15")

        weather_inf = dict(weather)
        weather_inf["coarse_rainfall_mm"] = float("inf")

        with self.assertRaises(ValueError):
            feature_service.build_feature_vector("TN_NIL_OOTY_01", weather_inf, "2024-07-15")

    def test_17_prototype_bias_correction_status(self):
        """17. Verify bias correction declares UNAVAILABLE_PROTOTYPE_MODE and zero offset."""
        res = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_01", "2024-07-15")
        corr = res["correction"]
        self.assertEqual(corr["status"], "UNAVAILABLE_PROTOTYPE_MODE")
        self.assertEqual(corr["rainfall_correction_mm"], 0.0)
        self.assertEqual(corr["tmax_correction_c"], 0.0)
        self.assertEqual(corr["tmin_correction_c"], 0.0)

    def test_18_confidence_is_heuristic_and_declares_split(self):
        """18. Verify confidence score is explicitly heuristic and distinguishes cold-start."""
        # Test cold-start Panchayat (held out in training)
        res_cold = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_01", "2024-07-15")
        conf_cold = res_cold["confidence"]
        self.assertEqual(conf_cold["score_type"], "prototype_heuristic_confidence")
        self.assertEqual(conf_cold["training_status"], "spatial_cold_start")
        self.assertGreater(conf_cold["components"]["cold_start_penalty"], 0.0)

        # Test represented Panchayat (included in training)
        res_rep = downscaling_service.predict_for_panchayat("TN_NIL_OOTY_02", "2024-07-15")
        conf_rep = res_rep["confidence"]
        self.assertEqual(conf_rep["score_type"], "prototype_heuristic_confidence")
        self.assertEqual(conf_rep["training_status"], "represented_in_training")
        self.assertEqual(conf_rep["components"]["cold_start_penalty"], 0.0)


if __name__ == "__main__":
    unittest.main()
