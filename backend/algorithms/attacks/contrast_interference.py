import torch
import torch.nn.functional as F
from .base import BaseAttack

class ContrastInterferenceAttack(BaseAttack):
    """对比度干扰攻击算法
    
    通过调整图像的对比度来干扰YOLO模型的检测性能。
    
    Args:
        contrast_factor (float): 对比度调整因子，范围通常在[0.1, 3.0]之间
                                 小于1.0会降低对比度，大于1.0会提高对比度
        input_size (int or None): 如果指定，图像会在攻击前调整到指定尺寸
    """
    def __init__(self, contrast_factor=0.5, input_size=640):
        super().__init__(name="contrast_interference")
        self.contrast_factor = contrast_factor
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """执行对比度干扰攻击
        
        Args:
            model: Ultralytics YOLO模型
            images (torch.Tensor): 输入图像，范围[0,1]，形状(B,C,H,W)
            targets: 不使用
            **kwargs: 额外参数，可包含contrast_factor来覆盖默认值
        Returns:
            torch.Tensor: 与输入图像相同形状的对抗样本
        """
        # 获取对比度因子，优先使用kwargs中的值
        contrast_factor = kwargs.get('contrast_factor', self.contrast_factor)
        
        # 确保图像在正确的设备上
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        
        # 如果指定了输入尺寸，调整图像大小
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images = F.interpolate(images, size=(self.input_size, self.input_size), 
                                 mode="bilinear", align_corners=False)
        
        # 计算每张图片的均值 (保持通道维度)
        mean = images.mean(dim=[2, 3], keepdim=True)
        # 应用对比度调整: output = mean + factor * (image - mean)
        adv_images = mean + contrast_factor * (images - mean)
        
        # 确保像素值在[0,1]范围内
        adv_images = torch.clamp(adv_images, 0, 1)
        
        # 如果之前调整了尺寸，现在调整回原始尺寸
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = F.interpolate(adv_images, size=orig_size, 
                                     mode="bilinear", align_corners=False)
        
        return adv_images

# 为了向后兼容的导入样式
Attack = ContrastInterferenceAttack 