# backend/algorithms/attacks/__init__.py
from .fgsm import FGSMAttack
from .pgd import PGDAttack
from .cw_l2 import CWL2Attack
from .dpatch import DPatchAttack
from .brightness import BrightnessAttack
from .gaussian_noise import GaussianNoiseAttack
from .contrast import ContrastAttack
from .freeat import FreeATAttack
from .yopo import YOPOAttack
from .freelb import FreeLBAttack
from .deepfool import DeepFoolAttack
from .advpatch import AdvPatchAttack
from .distortion import DistortionAttack
from .scene_transition import SceneTransitionAttack

__all__ = [
    'FGSMAttack', 'PGDAttack', 'CWL2Attack', 'DPatchAttack', 
    'BrightnessAttack', 'GaussianNoiseAttack', 'ContrastAttack',
    'FreeATAttack', 'YOPOAttack', 'FreeLBAttack',
    'DeepFoolAttack', 'AdvPatchAttack', 'DistortionAttack', 'SceneTransitionAttack'
]