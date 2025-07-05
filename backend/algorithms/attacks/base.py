# backend/algorithms/attacks/base.py
from abc import ABC, abstractmethod
import torch

class BaseAttack(ABC):
    """所有攻击算法的基类"""
    
    def __init__(self, name):
        self.name = name
    
    @abstractmethod
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行攻击
        
        参数:
            model: 目标模型
            images: 输入图像 (tensor或numpy数组)
            targets: 可选的目标标签
            **kwargs: 额外参数
            
        返回:
            对抗样本
        """
        pass
    
    def __call__(self, model, images, targets=None, **kwargs):
        """使对象可调用"""
        return self.attack(model, images, targets, **kwargs)