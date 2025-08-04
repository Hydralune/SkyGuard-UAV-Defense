# backend/algorithms/attacks/freelb.py
import torch
import numpy as np
from .base import BaseAttack

class FreeLBAttack(BaseAttack):
    """
    Free Large-Batch (FreeLB) 攻击实现
    
    FreeLB是一种结合了FreeAT和大批量训练的方法，通过在对抗扰动空间中进行梯度累积
    来提高模型的鲁棒性。它在对抗样本上累积多步梯度，然后一次性应用于模型参数更新。
    
    参数:
        eps: 扰动大小上限
        alpha: 每步扰动大小
        steps: 迭代步数
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, eps=8/255, alpha=2/255, steps=5, input_size=640):
        super().__init__(name="FreeLB")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
        self.accumulated_grad = None
        
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行FreeLB攻击
        
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
        # 初始化梯度累积
        if self.accumulated_grad is None or self.accumulated_grad.shape != images.shape:
            self.accumulated_grad = torch.zeros_like(images).to(self.device)
        else:
            # 重置累积梯度
            self.accumulated_grad.zero_()
        
        # 使用模型
        model.model.to(self.device)
        model.model.eval()
        
        for step in range(self.steps):
            # FreeLB的关键特性：在扰动空间中进行梯度累积
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
            
            # 获取梯度并累积
            grad = adv_images.grad
            if grad is not None:
                self.accumulated_grad += grad
                
                # 使用累积梯度更新扰动
                grad_sign = self.accumulated_grad.data.sign()
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