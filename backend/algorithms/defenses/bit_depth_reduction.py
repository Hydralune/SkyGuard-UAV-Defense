from __future__ import annotations

"""Bit-Depth Reduction (feature squeezing) defense."""

from typing import Any
import numpy as np
import torch

from .base import BaseDefense

__all__ = ["BitDepthReductionDefense"]


class BitDepthReductionDefense(BaseDefense):
    """Reduce image bit-depth to squeeze adversarial noise.

    Parameters
    ----------
    bits : int, optional (default=5)
        Target bit depth (1–8). 8 means no change; lower means stronger quantization.
    """

    def __init__(self, bits: int = 5):
        bits = int(np.clip(bits, 1, 8))
        super().__init__(name="bit_depth_reduction")
        self.bits = bits
        self.levels = 2 ** self.bits - 1  # e.g. bits=5 → 31 levels

    # ------------------------------------------------------------
    def defend(self, images: Any, **kwargs):  # noqa: D401
        if isinstance(images, torch.Tensor):
            return self._defend_tensor(images)
        return self._defend_numpy(images)

    # ---------------- helpers ----------------
    def _quantize(self, arr: np.ndarray) -> np.ndarray:
        if arr.dtype == np.uint8:
            # uint8 0-255 values
            factor = 255 / self.levels
            return np.round(arr / factor) * factor
        else:
            # assume float32 [0,1]
            q = np.round(arr * self.levels) / self.levels
            return q

    def _defend_numpy(self, arr: np.ndarray) -> np.ndarray:
        if arr.ndim in (3, 4):
            return self._quantize(arr).astype(arr.dtype)
        raise ValueError("Unsupported numpy shape; expect HWC/NHWC or CHW/NCHW converted beforehand")

    def _defend_tensor(self, tensor: torch.Tensor) -> torch.Tensor:
        device = tensor.device
        arr = tensor.detach().cpu().numpy()
        quant = self._quantize(arr)
        return torch.from_numpy(quant).to(device).type_as(tensor) 