"""Judge calibration and confidence reliability assessment."""

from typing import List, Dict, Tuple
from pydantic import BaseModel


class CalibrationSample(BaseModel):
    audit_id: str
    confidence_score: float  # [0.0, 1.0]
    verdict: str
    ground_truth_verdict: str
    is_correct: bool


class JudgeCalibrationReport(BaseModel):
    total_samples: int
    brier_score: float
    accuracy: float
    confidence_bins: Dict[str, Dict[str, float]]


def evaluate_judge_calibration(samples: List[CalibrationSample]) -> JudgeCalibrationReport:
    """Calculate Brier score and reliability curve across confidence deciles."""
    if not samples:
        return JudgeCalibrationReport(
            total_samples=0,
            brier_score=0.0,
            accuracy=0.0,
            confidence_bins={},
        )

    brier_sum = 0.0
    correct_count = 0

    # Decile bins: 0.0-0.6, 0.6-0.8, 0.8-0.9, 0.9-1.0
    bins = {
        "0.0-0.6": {"count": 0, "correct": 0},
        "0.6-0.8": {"count": 0, "correct": 0},
        "0.8-0.9": {"count": 0, "correct": 0},
        "0.9-1.0": {"count": 0, "correct": 0},
    }

    for s in samples:
        target = 1.0 if s.is_correct else 0.0
        brier_sum += (s.confidence_score - target) ** 2
        if s.is_correct:
            correct_count += 1

        score = s.confidence_score
        if score < 0.6:
            bin_key = "0.0-0.6"
        elif score < 0.8:
            bin_key = "0.6-0.8"
        elif score < 0.9:
            bin_key = "0.8-0.9"
        else:
            bin_key = "0.9-1.0"

        bins[bin_key]["count"] += 1
        if s.is_correct:
            bins[bin_key]["correct"] += 1

    brier_score = brier_sum / len(samples)
    accuracy = correct_count / len(samples)

    bin_results = {}
    for k, v in bins.items():
        bin_acc = v["correct"] / v["count"] if v["count"] > 0 else 0.0
        bin_results[k] = {
            "samples": v["count"],
            "accuracy": round(bin_acc, 4),
        }

    return JudgeCalibrationReport(
        total_samples=len(samples),
        brier_score=round(brier_score, 4),
        accuracy=round(accuracy, 4),
        confidence_bins=bin_results,
    )
