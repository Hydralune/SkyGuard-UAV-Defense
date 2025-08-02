import torch
import torch.nn.functional as F
import numpy as np
from .base import BaseAttack

class DistortionAttack(BaseAttack):
    """
    图像扭曲攻击：通过几何变换扭曲图像内容来影响目标检测模型的性能。
    这种攻击模拟了镜头畸变、运动模糊等真实世界中的干扰因素。
    """

    def __init__(self, distortion_factor=0.3, distortion_type="radial", input_size=640):
        """
        参数:
            distortion_factor (float): 扭曲强度因子。
                - 0.0 表示无扭曲
                - 数值越大，扭曲越强
                - 建议范围：0.1 - 1.0
            distortion_type (str): 扭曲类型。
                - "radial": 径向扭曲（桶形/枕形）
                - "wave": 波浪扭曲
            input_size (int or None): 如果不是None，图像在攻击前将被调整为方形的input_size。
        """
        super().__init__(name="distortion")
        self.distortion_factor = distortion_factor
        self.distortion_type = distortion_type
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _create_grid(self, h, w):
        """创建标准网格"""
        # 创建标准网格坐标 [-1,1] x [-1,1]
        x = torch.linspace(-1, 1, w).view(1, -1).repeat(h, 1)
        y = torch.linspace(-1, 1, h).view(-1, 1).repeat(1, w)
        
        # 将x和y堆叠为网格
        grid = torch.stack([x, y], dim=2).to(self.device)
        return grid

    def _apply_radial_distortion(self, grid, factor):
        """应用径向扭曲（桶形/枕形）"""
        # 计算每个点到中心的距离
        x, y = grid[..., 0], grid[..., 1]
        r = torch.sqrt(x**2 + y**2)
        
        # 计算扭曲因子，正值为桶形，负值为枕形
        distortion = 1.0 + factor * r**2
        
        # 应用扭曲
        x_distorted = x * distortion
        y_distorted = y * distortion
        
        # 裁剪到 [-1, 1] 范围
        x_distorted = torch.clamp(x_distorted, -1, 1)
        y_distorted = torch.clamp(y_distorted, -1, 1)
        
        return torch.stack([x_distorted, y_distorted], dim=2)

    def _apply_wave_distortion(self, grid, factor):
        """应用波浪扭曲"""
        # 提取x和y坐标
        x, y = grid[..., 0], grid[..., 1]
        
        # 应用正弦波扭曲
        freq = 4.0  # 波浪频率
        x_distorted = x + factor * torch.sin(y * np.pi * freq)
        y_distorted = y + factor * torch.sin(x * np.pi * freq)
        
        # 裁剪到 [-1, 1] 范围
        x_distorted = torch.clamp(x_distorted, -1, 1)
        y_distorted = torch.clamp(y_distorted, -1, 1)
        
        return torch.stack([x_distorted, y_distorted], dim=2)

    def attack(self, model, images, targets=None, **kwargs):
        """
        使用图像扭曲生成干扰样本。

        参数:
            model: Ultralytics YOLO模型。
            images (torch.Tensor): 输入图像，范围在[0,1]，形状为(B,C,H,W)。
            targets: 未使用。
        返回:
            与`images`形状相同的torch.Tensor，包含扭曲后的样本。
        """
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        batch_size = images.shape[0]
        
        # 如果需要，调整图像尺寸
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images_resized = F.interpolate(
                images, 
                size=(self.input_size, self.input_size), 
                mode="bilinear", 
                align_corners=False
            )
        else:
            images_resized = images
        
        _, _, h, w = images_resized.shape
        
        # 创建基础网格
        base_grid = self._create_grid(h, w)
        
        # 根据扭曲类型应用扭曲
        if self.distortion_type == "radial":
            distorted_grid = self._apply_radial_distortion(base_grid, self.distortion_factor)
        elif self.distortion_type == "wave":
            distorted_grid = self._apply_wave_distortion(base_grid, self.distortion_factor)
        else:
            # 默认使用径向扭曲
            distorted_grid = self._apply_radial_distortion(base_grid, self.distortion_factor)
        
        # 扩展网格到批次维度
        distorted_grid = distorted_grid.unsqueeze(0).repeat(batch_size, 1, 1, 1)
        
        # 使用网格采样应用扭曲
        distorted_images = F.grid_sample(
            images_resized, 
            distorted_grid, 
            mode='bilinear', 
            padding_mode='border', 
            align_corners=True
        )
        
        # 如果需要，调整回原始尺寸
        if self.input_size is not None and distorted_images.shape[-2:] != orig_size:
            distorted_images = F.interpolate(
                distorted_images, 
                size=orig_size, 
                mode="bilinear", 
                align_corners=False
            )
            
        return distorted_images

# 为了向后兼容
Attack = DistortionAttack