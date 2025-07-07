"""backend/utils/model_registry.py

Utility functions to manage and resolve paths of model weight files.

Directory convention assumed:
backend/models/
    ├─ baseline/
    │    └─ <model_name>.pt        # immutable baseline weights
    ├─ active/
    │    └─ <model_name>.pt        # symlink or copy of the weight currently in use
    └─ runs/
         └─ <run_id>/best.pt       # each training run stores its best.pt here

This module offers a single public helper `get_model_path()` that returns the
path a caller should use for loading weights, following the priority:
    1. backend/models/active/<model_name>.pt   (if exists)
    2. backend/models/baseline/<model_name>.pt (if exists)
    3. Fallback to legacy location: backend/<model_name>/best.pt

Note: Function never checks weight integrity; caller should handle load errors.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional


_ROOT_DIR = Path(__file__).resolve().parent.parent  # points to backend/

_MODELS_DIR = _ROOT_DIR / "models"
_ACTIVE_DIR = _MODELS_DIR / "active"
_BASELINE_DIR = _MODELS_DIR / "baseline"


def get_model_path(model_name: str, prefer_active: bool = True) -> Optional[str]:
    """Return absolute path to the weight file for *model_name*.

    Args:
        model_name: Logical model identifier, e.g. "yolov8s-visdrone".
        prefer_active: If ``True``, prefer weights under *active/* directory.

    Returns:
        Path string if found, otherwise ``None``.
    """
    # 1️⃣ active/<model_name>.pt
    active_weight = _ACTIVE_DIR / f"{model_name}.pt"
    if prefer_active and active_weight.exists():
        return str(active_weight)

    # 2️⃣ baseline/<model_name>.pt
    baseline_weight = _BASELINE_DIR / f"{model_name}.pt"
    if baseline_weight.exists():
        return str(baseline_weight)

    # 3️⃣ legacy fallback: backend/<model_name>/best.pt
    legacy_weight = _ROOT_DIR / model_name / "best.pt"
    if legacy_weight.exists():
        return str(legacy_weight)

    return None 