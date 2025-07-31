import torch
import torch.nn.functional as F
import numpy as np
from .base import BaseAttack

class BrightnessInterferenceAttack(BaseAttack):
    """亮度干扰攻击算法
    
    通过调整图像的亮度来干扰YOLO模型的检测性能。
    
    Args:
        brightness_factor (float): 亮度调整因子，范围通常在[0.1, 3.0]之间
                                 小于1.0会降低亮度，大于1.0会提高亮度
        input_size (int or None): 如果指定，图像会在攻击前调整到指定尺寸
    """

    def __init__(self, brightness_factor=0.5, input_size=640):
        super().__init__(name="brightness_interference")
        self.brightness_factor = brightness_factor
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """执行亮度干扰攻击
        
        Args:
            model: Ultralytics YOLO模型
            images (torch.Tensor): 输入图像，范围[0,1]，形状(B,C,H,W)
            targets: 不使用
            **kwargs: 额外参数，可包含brightness_factor来覆盖默认值
            
        Returns:
            torch.Tensor: 与输入图像相同形状的对抗样本
        """
        # 获取亮度因子，优先使用kwargs中的值
        brightness_factor = kwargs.get('brightness_factor', self.brightness_factor)
        
        # 确保图像在正确的设备上
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        
        # 如果指定了输入尺寸，调整图像大小
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images = F.interpolate(images, size=(self.input_size, self.input_size), 
                                 mode="bilinear", align_corners=False)
        
        # 应用亮度干扰
        # 方法1: 直接乘以亮度因子
        adv_images = images * brightness_factor
        
        # 方法2: 使用更复杂的亮度调整（可选）
        # 将图像转换到HSV空间，调整V通道，再转换回RGB
        # adv_images = self._adjust_brightness_hsv(images, brightness_factor)
        
        # 确保像素值在[0,1]范围内
        adv_images = torch.clamp(adv_images, 0, 1)
        
        # 如果之前调整了尺寸，现在调整回原始尺寸
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = F.interpolate(adv_images, size=orig_size, 
                                     mode="bilinear", align_corners=False)
        
        return adv_images
    
    def _adjust_brightness_hsv(self, images, brightness_factor):
        """使用HSV空间调整亮度（可选方法）
        
        Args:
            images (torch.Tensor): 输入图像
            brightness_factor (float): 亮度调整因子
            
        Returns:
            torch.Tensor: 调整后的图像
        """
        # 将RGB转换为HSV
        # 注意：这里简化处理，实际应用中可能需要更复杂的转换
        batch_size, channels, height, width = images.shape
        
        # 简化的亮度调整（在实际应用中，应该使用完整的RGB到HSV转换）
        # 这里我们直接调整图像的亮度通道
        if channels == 3:  # RGB图像
            # 计算亮度（使用加权平均）
            luminance = 0.299 * images[:, 0:1, :, :] + 0.587 * images[:, 1:2, :, :] + 0.114 * images[:, 2:3, :, :]
            
            # 调整亮度
            adjusted_luminance = luminance * brightness_factor
            
            # 计算调整比例
            ratio = adjusted_luminance / (luminance + 1e-8)
            
            # 应用调整
            adv_images = images * ratio
        else:
            # 灰度图像或单通道图像
            adv_images = images * brightness_factor
            
        return adv_images

# 为了向后兼容的导入样式
Attack = BrightnessInterferenceAttack