from __future__ import annotations

"""Median Blur input-transformation defense."""

from typing import Any
import cv2
import numpy as np
import torch

from .base import BaseDefense

__all__ = ["MedianBlurDefense"]


class MedianBlurDefense(BaseDefense):
    """Apply median blur (median filter) as a preprocessing defense.

    Parameters
    ----------
    ksize : int, optional (default=3)
        Aperture linear size; must be an odd integer > 1.
    """

    def __init__(self, ksize: int = 3):
        if ksize % 2 == 0:
            ksize += 1  # ensure odd
        if ksize < 3:
            ksize = 3
        super().__init__(name="median_blur")
        self.ksize = ksize

    # ------------------------------------------------------------
    def defend(self, images: Any, **kwargs):  # noqa: D401
        if isinstance(images, torch.Tensor):
            return self._defend_tensor(images)
        return self._defend_numpy(images)

    # ---------------- internal ----------------
    def _blur_single(self, img: np.ndarray) -> np.ndarray:
        return cv2.medianBlur(img, self.ksize)

    def _defend_numpy(self, arr: np.ndarray) -> np.ndarray:
        if arr.ndim == 3:
            return self._blur_single(arr)
        elif arr.ndim == 4:
            return np.stack([self._blur_single(x) for x in arr], axis=0)
        else:
            raise ValueError("Unsupported numpy shape; expect HWC or NHWC")

    def _defend_tensor(self, tensor: torch.Tensor) -> torch.Tensor:
        device = tensor.device
        arr = tensor.detach().cpu().numpy()
        if arr.ndim == 3:  # CHW
            img = arr.transpose(1, 2, 0)
            img_blur = self._blur_single(img)
            arr_blur = img_blur.transpose(2, 0, 1)
        elif arr.ndim == 4:
            imgs = []
            for x in arr:
                img = x.transpose(1, 2, 0)
                img_blur = self._blur_single(img)
                imgs.append(img_blur.transpose(2, 0, 1))
            arr_blur = np.stack(imgs, axis=0)
        else:
            raise ValueError("Unsupported tensor shape; expect CHW or NCHW")
        return torch.from_numpy(arr_blur).to(device).type_as(tensor) 