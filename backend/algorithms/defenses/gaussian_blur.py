from __future__ import annotations

"""Gaussian Blur input-transformation defense.

Usage example
-------------
>>> import cv2, numpy as np, torch
>>> from algorithms.defenses.gaussian_blur import GaussianBlurDefense
>>> defense = GaussianBlurDefense(ksize=5)
>>> img = cv2.imread('cat.jpg')[:, :, ::-1] / 255.0  # HWC, RGB float32
>>> defended = defense(img)
"""

from typing import Any
import cv2
import numpy as np
import torch

from .base import BaseDefense

__all__ = ["GaussianBlurDefense"]


class GaussianBlurDefense(BaseDefense):
    """Apply Gaussian blur to each image as a preprocessing defense.

    Parameters
    ----------
    ksize : int, optional (default=3)
        Kernel size (must be odd). If an even value is provided, it will be
        incremented by 1 internally.
    sigma : float, optional (default=0)
        Sigma; ``0`` lets OpenCV estimate it from *ksize*.
    """

    def __init__(self, ksize: int = 3, sigma: float = 0.0):
        ksize = ksize + 1 if ksize % 2 == 0 else ksize  # ensure odd
        super().__init__(name="gaussian_blur")
        self.ksize = ksize
        self.sigma = sigma

    # ------------------------------------------------------------
    # BaseDefense interface
    # ------------------------------------------------------------
    def defend(self, images: Any, **kwargs):  # noqa: D401
        """Apply Gaussian blur to *images*.

        Supports numpy arrays (HWC or NHWC) and torch tensors (CHW or NCHW).
        All values are assumed to be in [0, 1] range; the function preserves
        dtype/shape except for potential channel order conversion.
        """
        if isinstance(images, torch.Tensor):
            return self._defend_tensor(images)
        return self._defend_numpy(images)

    # ---------------- internal helpers ----------------
    def _blur_single(self, img: np.ndarray) -> np.ndarray:
        return cv2.GaussianBlur(img, (self.ksize, self.ksize), self.sigma)

    def _defend_numpy(self, arr: np.ndarray) -> np.ndarray:
        if arr.ndim == 3:  # HWC
            return self._blur_single(arr)
        elif arr.ndim == 4:  # NHWC
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
        elif arr.ndim == 4:  # NCHW
            imgs = []
            for x in arr:
                img = x.transpose(1, 2, 0)
                img_blur = self._blur_single(img)
                imgs.append(img_blur.transpose(2, 0, 1))
            arr_blur = np.stack(imgs, axis=0)
        else:
            raise ValueError("Unsupported tensor shape; expect CHW or NCHW")
        blur_tensor = torch.from_numpy(arr_blur).to(device).type_as(tensor)
        return blur_tensor 