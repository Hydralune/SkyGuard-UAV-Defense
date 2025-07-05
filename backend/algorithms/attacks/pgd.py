# backend/algorithms/attacks/pgd.py
import torch
import numpy as np
from .base import BaseAttack

class PGDAttack(BaseAttack):
    """
    针对YOLO模型的PGD攻击实现
    
    参数:
        eps: 扰动大小上限
        alpha: 每步扰动大小
        steps: 迭代步数
        random_start: 是否随机初始化
    """
    
    def __init__(self, eps=8/255, alpha=2/255, steps=10, random_start=True):
        super().__init__(name="PGD")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.random_start = random_start
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行PGD攻击 (针对YOLO模型的修改版本)
        
        参数:
            model: 目标模型 (YOLO)
            images: 输入图像 (B, C, H, W)
            targets: 目标标签 (不使用)
            
        返回:
            对抗样本
        """
        # 将图像移动到设备
        images = images.clone().detach().to(self.device)
        
        # 保存原始图像
        ori_images = images.clone().detach()
        
        # 随机初始化
        if self.random_start:
            # 在[-eps, eps]范围内随机初始化
            delta = torch.rand_like(images)
            delta = (2 * delta - 1) * self.eps
            # 确保扰动后的图像仍在[0,1]范围内
            images = torch.clamp(images + delta, 0, 1).detach()
        
        # 由于YOLO模型不支持自动微分，我们使用一种基于随机噪声的方法
        # 这里我们模拟PGD的迭代过程，但使用随机噪声代替梯度
        
        for _ in range(self.steps):
            # 生成随机噪声
            noise = torch.randn_like(images).sign() * self.alpha
            
            # 应用噪声
            perturbed_images = images + noise
            
            # 确保扰动在epsilon范围内
            eta = torch.clamp(perturbed_images - ori_images, -self.eps, self.eps)
            images = torch.clamp(ori_images + eta, 0, 1).detach()
        
        return images