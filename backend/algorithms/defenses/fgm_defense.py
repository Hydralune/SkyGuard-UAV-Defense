import torch
import torch.nn.functional as F
from typing import Any, Optional
from .base import BaseTrainingDefense

class FGMDefense(BaseTrainingDefense):
    """
    Fast Gradient Method (FGM) 对抗训练防御算法
    
    通过在训练过程中注入对抗样本来提高模型的鲁棒性。
    支持YOLO模型的对抗训练。
    """
    
    def __init__(self, eps: float = 8/255, alpha: float = 2/255, steps: int = 1, 
                 attack_ratio: float = 0.5, **kwargs):
        """
        初始化FGM防御算法
        
        Args:
            eps: 最大扰动幅度
            alpha: 单步扰动大小
            steps: 对抗攻击步数
            attack_ratio: 训练批次中使用对抗样本的比例
        """
        super().__init__(name="fgm_defense")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.attack_ratio = attack_ratio
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    def generate_adversarial_examples(self, model: torch.nn.Module, 
                                    images: torch.Tensor, 
                                    targets: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        生成对抗样本
        
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
        model.eval()
        
        # 确保模型参数可以计算梯度
        for param in model.parameters():
            param.requires_grad = True
        
        for step in range(self.steps):
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
            images = images.detach() + self.alpha * grad_sign
            images = torch.clamp(images, 0, 1)
            images.requires_grad = True
        
        return images.detach()
    
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
    
    def train(self, model: torch.nn.Module, dataloader: Any, optimizer: torch.optim.Optimizer, 
              epochs: int, **kwargs) -> torch.nn.Module:
        """
        执行对抗训练
        
        Args:
            model: 要训练的模型
            dataloader: 训练数据加载器
            optimizer: 优化器
            epochs: 训练轮数
            
        Returns:
            训练后的模型
        """
        model.train()
        model.to(self.device)
        
        for epoch in range(epochs):
            print(f"Epoch {epoch+1}/{epochs}")
            
            for batch_idx, (images, targets) in enumerate(dataloader):
                images = images.to(self.device)
                targets = targets.to(self.device) if targets is not None else None
                
                # 决定是否使用对抗样本
                use_adversarial = torch.rand(1).item() < self.attack_ratio
                
                if use_adversarial:
                    # 生成对抗样本
                    adv_images = self.generate_adversarial_examples(model, images, targets)
                    
                    # 使用对抗样本训练
                    optimizer.zero_grad()
                    preds = model(adv_images)
                    if isinstance(preds, (list, tuple)):
                        preds = preds[0]
                    
                    # 计算损失
                    if targets is not None:
                        loss = self._compute_detection_loss(preds, targets)
                    else:
                        obj_conf = preds[..., 4]
                        loss = -obj_conf.mean()
                    
                    loss.backward()
                    optimizer.step()
                else:
                    # 使用原始样本训练
                    optimizer.zero_grad()
                    preds = model(images)
                    if isinstance(preds, (list, tuple)):
                        preds = preds[0]
                    
                    # 计算损失
                    if targets is not None:
                        loss = self._compute_detection_loss(preds, targets)
                    else:
                        obj_conf = preds[..., 4]
                        loss = -obj_conf.mean()
                    
                    loss.backward()
                    optimizer.step()
                
                if batch_idx % 10 == 0:
                    print(f"Batch {batch_idx}, Loss: {loss.item():.4f}")
        
        return model
    
    def defend(self, images: Any, **kwargs) -> Any:
        """
        防御接口（兼容BaseDefense）
        
        Args:
            images: 输入图像
            
        Returns:
            处理后的图像（这里直接返回原图，因为FGM是训练时防御）
        """
        # FGM是训练时防御，推理时直接返回原图
        return images

# 兼容动态加载
Defense = FGMDefense 