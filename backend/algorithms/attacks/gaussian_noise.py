from .base import BaseAttack
import numpy as np

class GaussianNoiseAttack(BaseAttack):
    def __init__(self, mean=0.0, std=0.1):
        super().__init__()
        self.mean = mean
        self.std = std

    def attack(self, image, **kwargs):
        """
        对输入图像添加高斯噪声
        :param image: numpy array, 0~255, uint8
        :return: 噪声扰动后的图像, numpy array, 0~255, uint8
        """
        noise = np.random.normal(self.mean, self.std * 255, image.shape).astype(np.float32)
        noisy_image = image.astype(np.float32) + noise
        noisy_image = np.clip(noisy_image, 0, 255).astype(np.uint8)
        return noisy_image 