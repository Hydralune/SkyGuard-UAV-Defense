from __future__ import annotations

"""Generic adversarial-training callback for Ultralytics YOLOv8.

This callback can be registered via ``model.add_callback`` so that a fraction of
each training batch is replaced by adversarial examples generated *on-the-fly*
by any attack class that inherits :class:`algorithms.attacks.base.BaseAttack`.

Example
-------
>>> from ultralytics import YOLO
>>> from algorithms.attacks.pgd import PGDAttack
>>> from backend.callbacks.advtrain import AdvTrainingCallback
>>> model = YOLO("yolov8s.pt")
>>> attack = PGDAttack(eps=8/255, alpha=2/255, steps=10)
>>> model.add_callback("on_batch_start", AdvTrainingCallback(attack, ratio=0.5).on_batch_start)
"""

from typing import Any, Sequence
import torch

from algorithms.attacks.base import BaseAttack


class AdvTrainingCallback:
    """Generic adversarial training callback.

    Replace a fraction of every training batch with adversarial images produced
    by the supplied *attack* object (any subclass of ``BaseAttack``).

    Parameters
    ----------
    attack : BaseAttack
        Instantiated attack object used to craft adversarial examples.
    ratio : float, optional (default=0.5)
        Fraction of each batch (0.0-1.0) that will be converted to adversarial
        samples. 0.0 means no adversarial images, 1.0 means the entire batch is
        adversarial.
    """

    def __init__(self, attack: BaseAttack, ratio: float = 0.5):
        if not 0.0 <= ratio <= 1.0:
            raise ValueError("ratio must be between 0 and 1")
        self.attack = attack
        self.ratio = ratio

    # Ultralytics emits the *trainer* object to callback functions.
    def on_batch_start(self, trainer: Any) -> None:  # noqa: D401
        """Callback executed at the start of every training batch."""
        if getattr(trainer, "batch", None) is None:
            return

        # Ultralytics packs batch as (imgs, targets, *extras)
        batch: Sequence[Any] = trainer.batch
        if len(batch) < 2:
            return

        imgs = batch[0]
        targets = batch[1]

        # Ensure we are dealing with tensors on correct device
        if not isinstance(imgs, torch.Tensor):
            return
        B = imgs.size(0)
        if B == 0:
            return

        k = int(B * self.ratio)
        if k == 0:
            return  # nothing to replace

        # Generate adversarial examples on a detached copy to avoid interfering
        # with gradients of clean images.
        # Some attacks may require targets; pass if signature supports it.
        try:
            # Safely derive a slice of targets if possible; otherwise pass None.
            targets_slice = None
            if targets is not None:
                try:
                    targets_slice = targets[:k]
                except Exception:
                    targets_slice = targets

            adv_imgs = self.attack(trainer.model, imgs[:k].detach(), targets=targets_slice)
        except TypeError:
            # Attack signature might not accept 'targets'; retry without it.
            adv_imgs = self.attack(trainer.model, imgs[:k].detach())

        if adv_imgs is None:
            return
        # Ensure shape consistency
        if adv_imgs.shape != imgs[:k].shape:
            adv_imgs = torch.nn.functional.interpolate(adv_imgs, size=imgs[:k].shape[-2:], mode="bilinear", align_corners=False)

        imgs[:k] = adv_imgs.detach()

        # Re-assemble the batch preserving any additional elements (paths, etc.)
        trainer.batch = (imgs, targets, *batch[2:]) 