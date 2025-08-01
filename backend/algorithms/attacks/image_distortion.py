import torch
import torch.nn.functional as F
from .base import BaseAttack

class SceneJumpAttack(BaseAttack):
    """
    场景跃迁攻击算法

    将输入图像整体替换为指定的场景图片，或与场景图片进行alpha混合，以干扰YOLO模型检测。
    Args:
        scene_image (torch.Tensor): 跃迁场景图片，形状(C, H, W)，像素范围[0,1]
        alpha (float): 融合比例，1.0为完全替换，0.0为无替换，(0,1)为混合
        input_size (int or None): 若指定，攻击前会调整到该尺寸
    """
    def __init__(self, scene_image, alpha=1.0, input_size=640):
        super().__init__(name="scene_jump")
        self.scene_image = scene_image  # 期望为torch.Tensor, [C, H, W], [0,1]
        self.alpha = alpha
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """
        Args:
            model: YOLO模型
            images (torch.Tensor): (B, C, H, W), [0,1]
            targets: 不使用
            **kwargs: 可选alpha/scene_image覆盖
        Returns:
            torch.Tensor: (B, C, H, W)
        """
        alpha = kwargs.get('alpha', self.alpha)
        scene_image = kwargs.get('scene_image', self.scene_image)
        images = images.clone().detach().to(self.device)
        scene_image = scene_image.to(self.device)
        orig_size = images.shape[-2:]

        # 调整场景图片尺寸
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images = F.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)
            scene_image = F.interpolate(scene_image.unsqueeze(0), size=(self.input_size, self.input_size), mode="bilinear", align_corners=False).squeeze(0)
        else:
            scene_image = F.interpolate(scene_image.unsqueeze(0), size=orig_size, mode="bilinear", align_corners=False).squeeze(0)

        # 扩展场景图片到batch
        B = images.shape[0]
        scene_batch = scene_image.unsqueeze(0).repeat(B, 1, 1, 1)

        # 融合或直接替换
        adv_images = alpha * scene_batch + (1 - alpha) * images
        adv_images = torch.clamp(adv_images, 0, 1)

        # 恢复原始尺寸
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = F.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)

        return adv_images

# 兼容导入
Attack = SceneJumpAttack 