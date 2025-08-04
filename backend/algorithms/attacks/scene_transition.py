# backend/algorithms/attacks/scene_transition.py
import torch
import torch.nn.functional as F
import numpy as np
from .base import BaseAttack

class SceneTransitionAttack(BaseAttack):
    """
    场景跃变攻击实现
    
    通过模拟场景突变（如天气变化、光照变化、视角变化等）来生成对抗样本。
    这类攻击旨在测试模型在场景突变情况下的鲁棒性。
    
    参数:
        transition_type: 跃变类型，支持 'weather'（天气）, 'lighting'（光照）, 'blur'（模糊）
        severity: 跃变严重程度 (0.0-1.0)
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, transition_type='weather', severity=0.5, input_size=640):
        super().__init__(name="SceneTransition")
        self.transition_type = transition_type
        self.severity = severity
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
    
    def _apply_weather_effect(self, images):
        """应用天气效果（如雨、雪、雾）"""
        batch_size, c, h, w = images.shape
        
        # 创建雨滴/雪花效果
        if np.random.random() < 0.5:  # 雨
            # 创建随机雨滴
            num_drops = int(2000 * self.severity)
            rain = torch.zeros((batch_size, c, h, w), device=self.device)
            
            for _ in range(num_drops):
                # 随机雨滴位置和大小
                drop_h = np.random.randint(1, 5)
                drop_w = 1
                x = np.random.randint(0, w)
                y = np.random.randint(0, h)
                
                # 确保雨滴在图像范围内
                if y + drop_h > h or x + drop_w > w:
                    continue
                
                # 添加雨滴（白色）
                rain[:, :, y:y+drop_h, x:x+drop_w] = 1.0
            
            # 应用雨滴效果
            result = torch.clamp(images * (1 - self.severity * 0.3) + rain * self.severity, 0, 1)
            
        else:  # 雾
            # 创建雾效果
            fog = torch.randn((batch_size, c, h, w), device=self.device) * 0.2 + 0.8
            fog = F.gaussian_blur(fog, kernel_size=31, sigma=20)
            
            # 应用雾效果
            result = torch.clamp(images * (1 - self.severity) + fog * self.severity, 0, 1)
        
        return result
    
    def _apply_lighting_effect(self, images):
        """应用光照变化效果（如昼夜变化、闪光等）"""
        batch_size = images.shape[0]
        
        # 随机选择光照效果
        effect_type = np.random.choice(['darken', 'brighten', 'flash'])
        
        if effect_type == 'darken':
            # 模拟变暗/夜晚
            darkness = 1.0 - self.severity * 0.7
            result = torch.clamp(images * darkness, 0, 1)
            
        elif effect_type == 'brighten':
            # 模拟变亮/曝光过度
            brightness = 1.0 + self.severity * 1.5
            result = torch.clamp(images * brightness, 0, 1)
            
        else:  # flash
            # 模拟闪光/强光
            flash = torch.ones_like(images) * self.severity
            result = torch.clamp(images * (1 - self.severity * 0.5) + flash, 0, 1)
        
        return result
    
    def _apply_blur_effect(self, images):
        """应用模糊效果（如运动模糊、散焦等）"""
        batch_size = images.shape[0]
        
        # 随机选择模糊效果
        effect_type = np.random.choice(['motion', 'defocus'])
        
        if effect_type == 'motion':
            # 运动模糊
            kernel_size = int(15 * self.severity) + 1
            if kernel_size % 2 == 0:
                kernel_size += 1
            
            # 随机运动方向
            angle = np.random.uniform(0, 360)
            rad = np.deg2rad(angle)
            dx = np.cos(rad)
            dy = np.sin(rad)
            
            # 创建运动模糊核
            kernel = torch.zeros((kernel_size, kernel_size), device=self.device)
            center = kernel_size // 2
            
            for i in range(kernel_size):
                x = int(center + dx * (i - center))
                y = int(center + dy * (i - center))
                
                if 0 <= x < kernel_size and 0 <= y < kernel_size:
                    kernel[y, x] = 1
            
            kernel = kernel / kernel.sum()
            kernel = kernel.unsqueeze(0).unsqueeze(0).repeat(3, 1, 1, 1)
            
            # 应用运动模糊
            padding = kernel_size // 2
            result = torch.zeros_like(images)
            for b in range(batch_size):
                for c in range(3):
                    result[b, c:c+1] = F.conv2d(
                        images[b, c:c+1].unsqueeze(0),
                        kernel[c:c+1],
                        padding=padding
                    )
            
        else:  # defocus
            # 散焦模糊（高斯模糊）
            kernel_size = int(21 * self.severity) + 1
            if kernel_size % 2 == 0:
                kernel_size += 1
            
            sigma = self.severity * 5
            result = F.gaussian_blur(images, kernel_size=[kernel_size, kernel_size], sigma=[sigma, sigma])
        
        return result
    
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行场景跃变攻击
        
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
        
        # 根据跃变类型应用不同效果
        if self.transition_type == 'weather':
            adv_images = self._apply_weather_effect(images)
        elif self.transition_type == 'lighting':
            adv_images = self._apply_lighting_effect(images)
        elif self.transition_type == 'blur':
            adv_images = self._apply_blur_effect(images)
        else:
            raise ValueError(f"不支持的跃变类型: {self.transition_type}")
        
        # 还原到原始分辨率
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)
        
        return adv_images