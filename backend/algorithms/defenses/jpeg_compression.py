from __future__ import annotations

"""JPEG Compression defense that reduces high-frequency adversarial noise."""

from typing import Any
import cv2
import numpy as np
import torch

from .base import BaseDefense

__all__ = ["JPEGCompressionDefense"]


class JPEGCompressionDefense(BaseDefense):
    """Apply JPEG re-encoding as a preprocessing defense.

    Parameters
    ----------
    quality : int, optional (default=75)
        JPEG quality factor (1–100). Lower values yield stronger compression.
    """

    def __init__(self, quality: int = 75):
        quality = int(np.clip(quality, 1, 100))
        super().__init__(name="jpeg_compression")
        self.quality = quality
        self._encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), self.quality]

    # ------------------------------------------------------------
    def defend(self, images: Any, **kwargs):  # noqa: D401
        if isinstance(images, torch.Tensor):
            return self._defend_tensor(images)
        return self._defend_numpy(images)

    # ---------------- helpers ----------------
    def _jpeg_single(self, img: np.ndarray) -> np.ndarray:
        """img: HWC RGB float32 [0,1] or uint8 [0,255]"""
        img_uint8 = img
        if img.dtype != np.uint8:
            img_uint8 = np.clip(img * 255, 0, 255).astype(np.uint8)
        # OpenCV expects BGR
        img_bgr = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2BGR)
        success, enc = cv2.imencode(".jpg", img_bgr, self._encode_params)
        if not success:
            raise RuntimeError("cv2.imencode failed")
        dec_bgr = cv2.imdecode(enc, cv2.IMREAD_COLOR)
        dec_rgb = cv2.cvtColor(dec_bgr, cv2.COLOR_BGR2RGB)
        if img.dtype == np.uint8:
            return dec_rgb
        return dec_rgb.astype(np.float32) / 255.0

    def _defend_numpy(self, arr: np.ndarray) -> np.ndarray:
        if arr.ndim == 3:
            return self._jpeg_single(arr)
        elif arr.ndim == 4:
            return np.stack([self._jpeg_single(x) for x in arr], axis=0)
        else:
            raise ValueError("Unsupported numpy shape; expect HWC or NHWC")

    def _defend_tensor(self, tensor: torch.Tensor) -> torch.Tensor:
        device = tensor.device
        arr = tensor.detach().cpu().numpy()
        # Convert CHW/NCHW to HWC
        if arr.ndim == 3:
            img = arr.transpose(1, 2, 0)
            out = self._jpeg_single(img)
            arr_out = out.transpose(2, 0, 1)
        elif arr.ndim == 4:
            imgs = []
            for x in arr:
                img = x.transpose(1, 2, 0)
                imgs.append(self._jpeg_single(img).transpose(2, 0, 1))
            arr_out = np.stack(imgs, axis=0)
        else:
            raise ValueError("Unsupported tensor shape; expect CHW or NCHW")
        result = torch.from_numpy(arr_out).to(device).type_as(tensor)
        return result 