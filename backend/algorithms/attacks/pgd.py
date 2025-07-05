# backend/algorithms/attacks/pgd.py
import torch
import torch.nn as nn
from .base import BaseAttack

class PGDAttack(BaseAttack):
    """
    PGD (Projected Gradient Descent) 攻击实现
    
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
        执行PGD攻击
        
        参数:
            model: 目标模型
            images: 输入图像 (B, C, H, W)
            targets: 目标标签 (如果为None，则使用模型预测)
            
        返回:
            对抗样本
        """
        # 确保模型处于评估模式
        model.eval()
        
        # 将图像移动到设备
        images = images.clone().detach().to(self.device)
        
        # 如果没有提供目标，使用模型预测
        if targets is None:
            with torch.no_grad():
                outputs = model(images)
                if isinstance(outputs, list):  # 处理YOLO输出
                    targets = torch.zeros(images.size(0), dtype=torch.long).to(self.device)
                else:
                    targets = outputs.argmax(dim=1)
        else:
            targets = targets.to(self.device)
        
        # 保存原始图像
        ori_images = images.clone().detach()
        
        # 随机初始化
        if self.random_start:
            # 在[-eps, eps]范围内随机初始化
            delta = torch.rand_like(images, requires_grad=True)
            delta = (2 * delta - 1) * self.eps
            # 确保扰动后的图像仍在[0,1]范围内
            images = torch.clamp(images + delta, 0, 1).detach()
        
        # PGD迭代
        for _ in range(self.steps):
            images.requires_grad = True
            
            # 前向传播
            outputs = model(images)
            
            # 计算损失
            model.zero_grad()
            
            # 处理不同类型的模型输出
            if isinstance(outputs, list):  # YOLO检测模型
                # 对于检测模型，我们尝试最大化检测置信度损失
                loss = -outputs[0].box_loss  # 假设box_loss是检测损失
            else:  # 分类模型
                loss_fn = nn.CrossEntropyLoss()
                loss = loss_fn(outputs, targets)
            
            # 反向传播
            loss.backward()
            
            # 获取梯度符号
            grad_sign = images.grad.sign()
            
            # 更新图像
            adv_images = images + self.alpha * grad_sign
            
            # 投影到eps球内
            eta = torch.clamp(adv_images - ori_images, -self.eps, self.eps)
            images = torch.clamp(ori_images + eta, 0, 1).detach()
        
        return images