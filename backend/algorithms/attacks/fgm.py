import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Union, Tuple, List, Dict, Any

from .base import BaseAttack


class FGMAttack(BaseAttack):
    """
    Fast Gradient Method (FGM) 攻击算法
    
    FGM是一种单步对抗攻击方法，通过在输入图像的梯度方向上添加扰动来生成对抗样本。
    """
    
    def __init__(self, eps: float = 8/255, input_size: int = 640):
        """
        初始化FGM攻击
        
        Args:
            eps: 最大扰动幅度
            input_size: 输入图像大小
        """
        super().__init__(name="fgm")
        self.eps = eps
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    def forward(self, model: nn.Module, images: torch.Tensor, 
                targets: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        执行FGM攻击
        
        Args:
            model: 目标模型
            images: 输入图像 (B, C, H, W)
            targets: 目标标签（可选）
            
        Returns:
            对抗样本
        """
        images = images.clone().detach().to(self.device)
        images.requires_grad = True
        
        # 确保模型在正确的设备上
        model.to(self.device)
        
        # 前向传播
        preds = model(images)
        if isinstance(preds, (list, tuple)):
            preds = preds[0]
        
        # 计算损失（针对YOLO的目标检测任务）
        if targets is not None:
            # 如果有目标标签，使用目标检测损失
            loss = self._compute_detection_loss(preds, targets)
        else:
            # 否则使用目标置信度损失
            obj_conf = preds[..., 4]  # YOLO的目标置信度
            loss = -obj_conf.mean()  # 最大化目标置信度
        
        # 计算梯度
        model.zero_grad()
        if images.grad is not None:
            images.grad.zero_()
        loss.backward()
        
        # FGM更新
        grad_sign = images.grad.data.sign()
        adv_images = images.detach() + self.eps * grad_sign
        adv_images = torch.clamp(adv_images, 0, 1)
        
        return adv_images
    
    def _compute_detection_loss(self, preds: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        计算目标检测损失（简化版本）
        
        Args:
            preds: 模型预测结果
            targets: 目标标签
            
        Returns:
            损失值
        """
        # 这里使用简化的损失计算，实际应用中可能需要更复杂的损失函数
        obj_conf = preds[..., 4]  # 目标置信度
        return -obj_conf.mean()


# 兼容动态加载
Attack = FGMAttack