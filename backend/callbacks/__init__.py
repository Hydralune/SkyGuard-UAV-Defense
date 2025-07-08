"""Training callbacks for Ultralytics YOLO.

Currently available callbacks:
    - AdvTrainingCallback: generic adversarial training callback

The module re-exports :class:`~backend.callbacks.advtrain.AdvTrainingCallback` for convenience.

Example
-------
>>> from backend.callbacks import AdvTrainingCallback
"""

from .advtrain import AdvTrainingCallback  # noqa: F401 