# backend/algorithms/attacks/yopo.py
import torch
import numpy as np
from .base import BaseAttack

class YOPOAttack(BaseAttack):
    """
    You Only Propagate Once (YOPO) 攻击实现
    
    YOPO是一种通过减少反向传播次数来提高对抗训练效率的方法。
    它将深度网络分解为前k层和后续层，只对前k层进行多次反向传播，
    从而减少计算成本。
    
    参数:
        eps: 扰动大小上限
        alpha: 每步扰动大小
        steps: 外循环迭代步数
        K: 内循环次数
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, eps=8/255, alpha=2/255, steps=5, K=3, input_size=640):
        super().__init__(name="YOPO")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.K = K  # 内循环次数
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
        
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行YOPO攻击
        
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
            # 插值到方形
            images = torch.nn.functional.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)
        
        # 保存原始图像
        ori_images = images.clone().detach()
        
        # 初始化扰动
        delta = torch.zeros_like(images).to(self.device)
        
        # 使用模型
        model.model.to(self.device)
        model.model.eval()
        
        for _ in range(self.steps):
            # YOPO的关键特性：只在第一层进行完整的反向传播
            # 这里简化实现，实际上需要访问模型的内部结构
            
            # 外循环：完整的前向和反向传播
            adv_images = torch.clamp(ori_images + delta, 0, 1).detach().requires_grad_(True)
            
            # 前向传播
            preds = model.model(adv_images)
            if isinstance(preds, (list, tuple)):
                preds = preds[0]
            
            # 目标: 减少检测置信度
            obj_conf = preds[..., 4]
            loss = -obj_conf.mean()
            
            # 反向传播计算梯度
            model.model.zero_grad()
            if adv_images.grad is not None:
                adv_images.grad.zero_()
            loss.backward()
            
            # 获取梯度
            grad = adv_images.grad
            if grad is None:
                grad = torch.zeros_like(adv_images)
                
            # 内循环：多次更新扰动而不进行完整的反向传播
            for _ in range(self.K):
                grad_sign = grad.data.sign()
                delta = delta + self.alpha * grad_sign
                # 投影到 ε-ball
                delta = torch.clamp(delta, -self.eps, self.eps)
                # 确保扰动后的图像在合法范围内
                delta = torch.clamp(ori_images + delta, 0, 1) - ori_images
        
        # 生成最终的对抗样本
        adv_images = torch.clamp(ori_images + delta, 0, 1).detach()
        
        # 还原到原始分辨率
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)
        
        return adv_images