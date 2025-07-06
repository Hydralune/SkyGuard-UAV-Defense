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
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, eps=8/255, alpha=2/255, steps=10, random_start=True, input_size=640):
        super().__init__(name="PGD")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.random_start = random_start
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
    
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
        orig_size = images.shape[-2:]  # (H, W)
        if self.input_size is not None:
            # 插值到方形，避免 YOLO Cat 维度不一致的报错
            images = torch.nn.functional.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)
        
        # 保存原始图像
        ori_images = images.clone().detach()
        
        # 随机初始化
        if self.random_start:
            # 在[-eps, eps]范围内随机初始化
            delta = torch.rand_like(images)
            delta = (2 * delta - 1) * self.eps
            # 确保扰动后的图像仍在[0,1]范围内
            images = torch.clamp(images + delta, 0, 1).detach()
        
        # 使用梯度信息进行标准PGD攻击
        # 将模型设置为评估模式并禁用不必要的梯度
        model.model.to(self.device)
        model.model.eval()
        
        for _ in range(self.steps):
            images.requires_grad = True
            # 前向传播获取原始预测 (使用模型底层以便保留梯度)
            preds = model.model(images)
            # 如果模型返回的是元组或列表, 取第一个张量
            if isinstance(preds, (list, tuple)):
                preds = preds[0]
            
            # 目标: 减少检测置信度 -> 最大化负的 objectness 分数
            # YOLO 输出张量格式: (..., 4) 通常是 objectness 置信度
            obj_conf = preds[..., 4]
            loss = -obj_conf.mean()
            
            # 反向传播计算梯度
            model.model.zero_grad()
            if images.grad is not None:
                images.grad.zero_()
            loss.backward()
            
            # 根据梯度方向更新图像 (增加对 None 的健壮性处理)
            grad = images.grad
            if grad is None:
                # 极端情况下梯度可能为空（例如 forward 被截断或 OOM 被清理），
                # 这里回退为零梯度，保证攻击流程不断；也可以选择 break。
                grad = torch.zeros_like(images)

            grad_sign = grad.data.sign()
            images = images.detach() + self.alpha * grad_sign
            
            # 投影到 ε-ball 并裁剪到合法像素范围 [0,1]
            eta = torch.clamp(images - ori_images, min=-self.eps, max=self.eps)
            images = torch.clamp(ori_images + eta, 0, 1).detach()
        
        # 还原到原始分辨率（与原图一致，便于后续可视化差分）
        if self.input_size is not None and images.shape[-2:] != orig_size:
            images = torch.nn.functional.interpolate(images, size=orig_size, mode="bilinear", align_corners=False)
        
        return images