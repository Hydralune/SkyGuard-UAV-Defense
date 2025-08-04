# backend/algorithms/attacks/freeat.py
import torch
import numpy as np
from .base import BaseAttack

class FreeATAttack(BaseAttack):
    """
    Free Adversarial Training (FreeAT) 攻击实现
    
    FreeAT通过重复使用前向和反向传播的计算图来减少计算成本，
    通过在每个mini-batch上多次更新对抗扰动而不重新计算模型梯度来提高效率。
    
    参数:
        eps: 扰动大小上限
        alpha: 每步扰动大小
        steps: 迭代步数（通常为4）
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, eps=8/255, alpha=2/255, steps=4, input_size=640):
        super().__init__(name="FreeAT")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
        self.delta = None  # 存储累积扰动
        
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行FreeAT攻击
        
        参数:
            model: 目标模型
            images: 输入图像 (B, C, H, W)
            targets: 目标标签
            
        返回:
            对抗样本
        """
        # 将图像移动到设备
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]  # (H, W)
        if self.input_size is not None:
            # 插值到方形，避免 YOLO Cat 维度不一致的报错
            images = torch.nn.functional.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)
        
        # FreeAT的关键特性：重用扰动
        if self.delta is None or self.delta.shape != images.shape:
            # 初始化扰动为零
            self.delta = torch.zeros_like(images).to(self.device)
        
        # 保存原始图像
        ori_images = images.clone().detach()
        
        # 应用当前扰动
        adv_images = torch.clamp(images + self.delta, 0, 1)
        adv_images.requires_grad = True
        
        # 前向传播
        model.model.to(self.device)
        model.model.eval()
        
        preds = model.model(adv_images)
        if isinstance(preds, (list, tuple)):
            preds = preds[0]
        
        # 目标: 减少检测置信度
        obj_conf = preds[..., 4]
        loss = -obj_conf.mean()  # 最大化目标置信度
        
        # 反向传播计算梯度
        model.model.zero_grad()
        if adv_images.grad is not None:
            adv_images.grad.zero_()
        loss.backward()
        
        # 更新累积扰动
        grad = adv_images.grad
        if grad is not None:
            grad_sign = grad.data.sign()
            self.delta = self.delta + self.alpha * grad_sign
            # 投影到 ε-ball
            self.delta = torch.clamp(self.delta, -self.eps, self.eps)
            # 确保扰动后的图像在合法范围内
            self.delta = torch.clamp(ori_images + self.delta, 0, 1) - ori_images
        
        # 生成新的对抗样本
        adv_images = torch.clamp(images + self.delta, 0, 1).detach()
        
        # 还原到原始分辨率
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)
        
        return adv_images