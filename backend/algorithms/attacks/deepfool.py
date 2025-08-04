# backend/algorithms/attacks/deepfool.py
import torch
import numpy as np
from .base import BaseAttack

class DeepFoolAttack(BaseAttack):
    """
    DeepFool攻击实现
    
    DeepFool是一种迭代式攻击方法，通过计算决策边界的最近距离来生成对抗样本。
    它通过线性化网络在每一步找到最小扰动方向，使得样本越过决策边界。
    
    参数:
        max_iter: 最大迭代次数
        overshoot: 越过决策边界的程度 (通常为0.02)
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, max_iter=50, overshoot=0.02, input_size=640):
        super().__init__(name="DeepFool")
        self.max_iter = max_iter
        self.overshoot = overshoot
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
    
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行DeepFool攻击
        
        参数:
            model: 目标模型
            images: 输入图像 (B, C, H, W)
            targets: 目标标签 (不使用)
            
        返回:
            对抗样本
        """
        # 将图像移动到设备
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]  # (H, W)
        if self.input_size is not None:
            # 插值到方形，避免 YOLO Cat 维度不一致的报错
            images = torch.nn.functional.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)
        
        batch_size = images.shape[0]
        adv_images = images.clone()
        
        # 使用模型
        model.model.to(self.device)
        model.model.eval()
        
        # 对批次中的每个图像单独进行处理
        for idx in range(batch_size):
            image = adv_images[idx:idx+1].clone()
            image.requires_grad = True
            
            # 初始化参数
            r_tot = torch.zeros_like(image).to(self.device)
            
            # 获取初始预测
            with torch.enable_grad():
                preds = model.model(image)
                if isinstance(preds, (list, tuple)):
                    preds = preds[0]
                
                # 对于目标检测，我们使用objectness分数
                obj_conf = preds[..., 4]
                initial_conf = obj_conf.mean().item()
                
                # 迭代直到找到对抗样本或达到最大迭代次数
                for _ in range(self.max_iter):
                    # 如果已经成功攻击（置信度降低到足够低），则退出
                    if obj_conf.mean().item() < initial_conf * 0.3:  # 假设降低到30%以下为成功
                        break
                    
                    # 计算梯度
                    if image.grad is not None:
                        image.grad.zero_()
                    loss = obj_conf.mean()
                    loss.backward()
                    
                    # 获取梯度
                    grad = image.grad.data
                    
                    # 计算扰动方向和大小
                    # 在DeepFool中，我们寻找最小的扰动使样本越过决策边界
                    # 这里简化为梯度方向的最小扰动
                    abs_grad = torch.abs(grad)
                    mask = abs_grad > 0  # 避免除以零
                    min_grad = torch.ones_like(grad) * float('inf')
                    min_grad[mask] = grad[mask] / abs_grad[mask]
                    
                    # 计算最小扰动
                    r_i = (loss / (torch.norm(grad) + 1e-7)) * min_grad
                    
                    # 添加扰动
                    r_tot = r_tot + r_i
                    
                    # 更新图像
                    image_adv = image + (1 + self.overshoot) * r_tot
                    image_adv = torch.clamp(image_adv, 0, 1)
                    
                    # 准备下一次迭代
                    image = image_adv.clone().detach().requires_grad_(True)
                    
                    # 重新计算预测
                    preds = model.model(image)
                    if isinstance(preds, (list, tuple)):
                        preds = preds[0]
                    obj_conf = preds[..., 4]
            
            # 更新批次中的图像
            adv_images[idx:idx+1] = image.detach()
        
        # 还原到原始分辨率
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)
        
        return adv_images