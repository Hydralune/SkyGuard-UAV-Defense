import torch
from .base import BaseAttack

class BrightnessAttack(BaseAttack):
    """
    亮度干扰攻击：通过调整图像亮度来影响目标检测模型的性能。
    这种攻击模拟了不同光照条件下的环境干扰。
    """

    def __init__(self, brightness_factor=1.5, input_size=640):
        """
        参数:
            brightness_factor (float): 亮度调整因子。
                - 1.0 表示不变
                - > 1.0 表示增加亮度
                - < 1.0 表示降低亮度
                - 建议范围：0.1 - 3.0
            input_size (int or None): 如果不是None，图像在攻击前将被调整为方形的input_size。
        """
        super().__init__(name="brightness")
        self.brightness_factor = brightness_factor
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """
        使用亮度调整生成干扰样本。

        参数:
            model: Ultralytics YOLO模型。
            images (torch.Tensor): 输入图像，范围在[0,1]，形状为(B,C,H,W)。
            targets: 未使用。
        返回:
            与`images`形状相同的torch.Tensor，包含亮度调整后的样本。
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

        # 应用亮度调整
        # 亮度调整公式：new_pixel = old_pixel * brightness_factor
        brightness_images = images_resized * self.brightness_factor
        
        # 确保像素值在有效范围内 [0, 1]
        brightness_images = torch.clamp(brightness_images, 0, 1)

        # 如果需要，调整回原始尺寸
        if self.input_size is not None and brightness_images.shape[-2:] != orig_size:
            brightness_images = torch.nn.functional.interpolate(
                brightness_images, 
                size=orig_size, 
                mode="bilinear", 
                align_corners=False
            )
            
        return brightness_images

# 为了向后兼容
Attack = BrightnessAttack