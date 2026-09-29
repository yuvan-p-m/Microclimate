"""Feedback and Calibration Service.
Handles storage of farmer observations and prepares data for continuous model recalibration.
"""
from typing import Dict, Any, List
import json
import uuid
from datetime import datetime, timezone
from backend.app.config import settings

class FeedbackService:
    def __init__(self):
        self.feedback_file = settings.FEEDBACK_DIR / "farmer_feedback.jsonl"

    def record_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Appends farmer feedback record to local storage.
        TODO: Implement feedback ingestion and bias calibration hook.
        """
        record = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            **feedback_data
        }
        self.feedback_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.feedback_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
        return record

    def list_feedback(self) -> List[Dict[str, Any]]:
        """Retrieves stored farmer feedback."""
        if not self.feedback_file.exists():
            return []
        records = []
        with open(self.feedback_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    records.append(json.loads(line))
        return records

feedback_service = FeedbackService()
