# backend/algorithms/attacks/__init__.py
from .fgsm import FGSMAttack
from .pgd import PGDAttack
from .cw_l2 import CWL2Attack
from .dpatch import DPatchAttack

__all__ = ['FGSMAttack', 'PGDAttack', 'CWL2Attack', 'DPatchAttack']