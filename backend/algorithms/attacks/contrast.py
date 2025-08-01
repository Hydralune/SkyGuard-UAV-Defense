import torch
from .base import BaseAttack

class ContrastAttack(BaseAttack):
    """
    对比度调整攻击：通过调整图像对比度来影响目标检测模型的性能。
    这种攻击模拟了不同成像设备、光照条件下的对比度变化。
    """

    def __init__(self, contrast_factor=1.5, input_size=640):
        """
        参数:
            contrast_factor (float): 对比度调整因子。
                - 1.0 表示不变
                - > 1.0 表示增加对比度
                - < 1.0 表示降低对比度
                - 建议范围：0.1 - 3.0
            input_size (int or None): 如果不是None，图像在攻击前将被调整为方形的input_size。
        """
        super().__init__(name="contrast")
        self.contrast_factor = contrast_factor
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """
        使用对比度调整生成干扰样本。

        参数:
            model: Ultralytics YOLO模型。
            images (torch.Tensor): 输入图像，范围在[0,1]，形状为(B,C,H,W)。
            targets: 未使用。
        返回:
            与`images`形状相同的torch.Tensor，包含对比度调整后的样本。
        """
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        
        # 如果需要，调整图像尺寸
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images_resized = torch.nn.functional.interpolate(
                images, 
                size=(self.input_size, self.input_size), 
                mode="bilinear", 
                align_corners=False
            )
        else:
            images_resized = images

        # 应用对比度调整
        # 对比度调整公式：new_pixel = (old_pixel - 0.5) * contrast_factor + 0.5
        # 这样可以保持中间灰度值不变，同时增加或减少亮暗区域的差异
        mean = torch.mean(images_resized, dim=[1, 2, 3], keepdim=True)
        contrast_images = (images_resized - mean) * self.contrast_factor + mean
        
        # 确保像素值在有效范围内 [0, 1]
        contrast_images = torch.clamp(contrast_images, 0, 1)

        # 如果需要，调整回原始尺寸
        if self.input_size is not None and contrast_images.shape[-2:] != orig_size:
            contrast_images = torch.nn.functional.interpolate(
                contrast_images, 
                size=orig_size, 
                mode="bilinear", 
                align_corners=False
            )
            
        return contrast_images

# 为了向后兼容
Attack = ContrastAttack