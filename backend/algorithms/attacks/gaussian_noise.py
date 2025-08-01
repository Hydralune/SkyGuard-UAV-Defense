import torch
from .base import BaseAttack

class GaussianNoiseAttack(BaseAttack):
    """
    高斯噪声攻击：通过向图像添加高斯分布的随机噪声来影响目标检测模型的性能。
    这种攻击模拟了传感器噪声、传输噪声等真实环境中的干扰。
    """

    def __init__(self, noise_std=0.1, input_size=640):
        """
        参数:
            noise_std (float): 高斯噪声的标准差。
                - 0.0 表示无噪声
                - 数值越大，噪声越强
                - 建议范围：0.01 - 0.5
            input_size (int or None): 如果不是None，图像在攻击前将被调整为方形的input_size。
        """
        super().__init__(name="gaussian_noise")
        self.noise_std = noise_std
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """
        使用高斯噪声生成干扰样本。

        参数:
            model: Ultralytics YOLO模型。
            images (torch.Tensor): 输入图像，范围在[0,1]，形状为(B,C,H,W)。
            targets: 未使用。
        返回:
            与`images`形状相同的torch.Tensor，包含添加高斯噪声后的样本。
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

        # 生成与图像同样形状的高斯噪声
        # 噪声的均值为0，标准差为noise_std
        noise = torch.randn_like(images_resized, device=self.device) * self.noise_std
        
        # 将噪声添加到图像上
        noisy_images = images_resized + noise
        
        # 确保像素值在有效范围内 [0, 1]
        noisy_images = torch.clamp(noisy_images, 0, 1)

        # 如果需要，调整回原始尺寸
        if self.input_size is not None and noisy_images.shape[-2:] != orig_size:
            noisy_images = torch.nn.functional.interpolate(
                noisy_images, 
                size=orig_size, 
                mode="bilinear", 
                align_corners=False
            )
            
        return noisy_images

# 为了向后兼容
Attack = GaussianNoiseAttack