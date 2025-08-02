"""
自定义攻击算法模板

这是一个示例模板，展示如何创建自己的攻击算法并集成到SkyGuard-UAV-Defense系统中。

使用方法：
1. 复制这个文件并重命名为您的攻击算法名称，如：my_custom_attack.py
2. 修改类名和实现您的攻击逻辑
3. 在 __init__.py 中导入您的攻击类
4. 在前端自定义算法配置中指定文件名和参数

作者：SkyGuard团队
日期：2025年
"""

import torch
from .base import BaseAttack

class CustomAttackTemplate(BaseAttack):
    """
    自定义攻击算法模板
    
    这是一个示例攻击算法，演示如何继承BaseAttack类并实现自己的攻击逻辑。
    您可以参考这个模板来创建自己的攻击算法。
    """
    
    def __init__(self, eps=8/255, alpha=2/255, steps=10, custom_param=1.0, input_size=640):
        """
        初始化自定义攻击算法
        
        参数:
            eps (float): 最大扰动大小
            alpha (float): 每步扰动大小  
            steps (int): 攻击迭代次数
            custom_param (float): 您的自定义参数
            input_size (int): 输入图像尺寸
        """
        super().__init__(name="custom_attack_template")
        self.eps = eps
        self.alpha = alpha
        self.steps = steps
        self.custom_param = custom_param
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行自定义攻击
        
        参数:
            model: YOLO模型实例
            images: 输入图像张量，形状为 (batch_size, channels, height, width)
            targets: 目标标签（可选）
            **kwargs: 额外参数
            
        返回:
            对抗样本张量，形状与输入相同
        """
        # 1. 准备工作
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        
        # 2. 调整图像尺寸（如果需要）
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images_resized = torch.nn.functional.interpolate(
                images, 
                size=(self.input_size, self.input_size), 
                mode="bilinear", 
                align_corners=False
            )
        else:
            images_resized = images
            
        # 3. 确保模型在正确的设备上
        model.model.to(self.device)
        model.model.eval()
        
        # 4. 初始化对抗样本
        adv_images = images_resized.clone()
        adv_images.requires_grad = True
        
        # 5. 迭代攻击过程
        for step in range(self.steps):
            # 前向传播
            predictions = model.model(adv_images)
            if isinstance(predictions, (list, tuple)):
                predictions = predictions[0]
            
            # 计算损失（这里使用简单的目标置信度损失）
            # 您可以根据需要修改损失函数
            obj_conf = predictions[..., 4]  # 目标置信度
            loss = obj_conf.mean()  # 最大化置信度（白盒攻击）
            
            # 您可以在这里添加自定义的损失计算逻辑
            # loss = loss * self.custom_param  # 使用自定义参数
            
            # 反向传播
            model.model.zero_grad()
            if adv_images.grad is not None:
                adv_images.grad.zero_()
            loss.backward()
            
            # 计算梯度
            grad = adv_images.grad.data
            
            # 您可以在这里添加自定义的梯度处理逻辑
            # 例如：梯度变换、噪声添加等
            
            # FGSM步骤
            perturbation = self.alpha * grad.sign()
            adv_images.data = adv_images.data + perturbation
            
            # 投影到扰动球内
            delta = adv_images - images_resized
            delta = torch.clamp(delta, -self.eps, self.eps)
            adv_images.data = images_resized + delta
            
            # 确保像素值在有效范围内
            adv_images.data = torch.clamp(adv_images.data, 0, 1)
            
        # 6. 调整回原始尺寸（如果需要）
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(
                adv_images, 
                size=orig_size, 
                mode="bilinear", 
                align_corners=False
            )
            
        return adv_images.detach()

# 重要：必须在文件末尾添加这行，用于动态加载
Attack = CustomAttackTemplate