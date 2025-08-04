# backend/algorithms/attacks/distortion.py
import torch
import torch.nn.functional as F
import numpy as np
from .base import BaseAttack

class DistortionAttack(BaseAttack):
    """
    图像扭曲攻击实现
    
    通过对图像应用各种扭曲变换来生成对抗样本，包括弹性变形、波浪变形等。
    这类攻击模拟了现实世界中的物理变形，如透过水或玻璃观察物体时的扭曲效果。
    
    参数:
        distortion_type: 扭曲类型，支持 'elastic'（弹性）, 'wave'（波浪）, 'swirl'（漩涡）
        severity: 扭曲严重程度 (0.0-1.0)
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, distortion_type='elastic', severity=0.5, input_size=640):
        super().__init__(name="Distortion")
        self.distortion_type = distortion_type
        self.severity = severity
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
    
    def _create_elastic_grid(self, shape, sigma=10, alpha=50):
        """创建弹性变形网格"""
        h, w = shape
        
        # 创建位移场
        dx = torch.randn((h, w)).to(self.device) * sigma
        dy = torch.randn((h, w)).to(self.device) * sigma
        
        # 应用高斯滤波平滑位移场
        kernel_size = int(sigma * 4) + 1
        if kernel_size % 2 == 0:
            kernel_size += 1
        padding = kernel_size // 2
        
        dx = dx.unsqueeze(0).unsqueeze(0)
        dy = dy.unsqueeze(0).unsqueeze(0)
        
        dx = F.gaussian_blur(dx, kernel_size=[kernel_size, kernel_size], sigma=[sigma, sigma])
        dy = F.gaussian_blur(dy, kernel_size=[kernel_size, kernel_size], sigma=[sigma, sigma])
        
        dx = dx.squeeze() * alpha
        dy = dy.squeeze() * alpha
        
        # 创建基础网格
        x_grid, y_grid = torch.meshgrid(torch.arange(h, device=self.device), 
                                        torch.arange(w, device=self.device),
                                        indexing='ij')
        
        # 添加位移
        x_grid = x_grid + dx
        y_grid = y_grid + dy
        
        # 归一化到[-1, 1]范围
        x_grid = 2 * (x_grid / (h - 1)) - 1
        y_grid = 2 * (y_grid / (w - 1)) - 1
        
        # 组合为采样网格
        grid = torch.stack([y_grid, x_grid], dim=2)  # [h, w, 2]
        
        return grid
    
    def _create_wave_grid(self, shape, frequency=10, amplitude=0.05):
        """创建波浪变形网格"""
        h, w = shape
        
        # 创建基础网格
        x_grid, y_grid = torch.meshgrid(torch.arange(h, device=self.device), 
                                        torch.arange(w, device=self.device),
                                        indexing='ij')
        
        # 归一化到[0, 1]范围
        x_norm = x_grid / (h - 1)
        y_norm = y_grid / (w - 1)
        
        # 应用正弦波变形
        x_wave = x_norm + amplitude * torch.sin(2 * np.pi * frequency * y_norm)
        y_wave = y_norm + amplitude * torch.sin(2 * np.pi * frequency * x_norm)
        
        # 归一化到[-1, 1]范围
        x_wave = 2 * x_wave - 1
        y_wave = 2 * y_wave - 1
        
        # 组合为采样网格
        grid = torch.stack([y_wave, x_wave], dim=2)  # [h, w, 2]
        
        return grid
    
    def _create_swirl_grid(self, shape, strength=10):
        """创建漩涡变形网格"""
        h, w = shape
        
        # 创建基础网格
        x_grid, y_grid = torch.meshgrid(torch.arange(h, device=self.device), 
                                        torch.arange(w, device=self.device),
                                        indexing='ij')
        
        # 转换为中心坐标系
        x_center = x_grid - (h - 1) / 2
        y_center = y_grid - (w - 1) / 2
        
        # 计算半径和角度
        radius = torch.sqrt(x_center**2 + y_center**2)
        theta = torch.atan2(y_center, x_center) + strength * (1 - radius / torch.max(radius))
        
        # 转换回笛卡尔坐标
        x_swirl = radius * torch.cos(theta) + (h - 1) / 2
        y_swirl = radius * torch.sin(theta) + (w - 1) / 2
        
        # 归一化到[-1, 1]范围
        x_swirl = 2 * (x_swirl / (h - 1)) - 1
        y_swirl = 2 * (y_swirl / (w - 1)) - 1
        
        # 组合为采样网格
        grid = torch.stack([y_swirl, x_swirl], dim=2)  # [h, w, 2]
        
        return grid
    
    def _apply_distortion(self, images):
        """应用选定的扭曲变换"""
        batch_size = images.shape[0]
        h, w = images.shape[2], images.shape[3]
        
        # 根据扭曲类型创建采样网格
        if self.distortion_type == 'elastic':
            sigma = 10 * self.severity
            alpha = 50 * self.severity
            grid = self._create_elastic_grid((h, w), sigma, alpha)
        elif self.distortion_type == 'wave':
            frequency = 5 + 10 * self.severity
            amplitude = 0.05 * self.severity
            grid = self._create_wave_grid((h, w), frequency, amplitude)
        elif self.distortion_type == 'swirl':
            strength = 10 * self.severity
            grid = self._create_swirl_grid((h, w), strength)
        else:
            raise ValueError(f"不支持的扭曲类型: {self.distortion_type}")
        
        # 扩展网格到批次大小
        grid = grid.unsqueeze(0).repeat(batch_size, 1, 1, 1)
        
        # 应用网格采样
        distorted_images = F.grid_sample(images, grid, mode='bilinear', padding_mode='reflection', align_corners=True)
        
        return distorted_images
    
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行图像扭曲攻击
        
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
        
        # 应用扭曲变换
        adv_images = self._apply_distortion(images)
        
        # 还原到原始分辨率
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)
        
        return adv_images