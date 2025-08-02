import torch
import torch.nn.functional as F
import random
from .base import BaseAttack

class SceneChangeAttack(BaseAttack):
    """
    场景跃变攻击：通过快速场景切换来影响目标检测模型的性能。
    这种攻击模拟了摄像头快速移动、光照突然变化等真实世界中的场景切换干扰。
    """
    def __init__(self, change_intensity=0.8, change_type="brightness", num_changes=3, input_size=640):
        """
        参数:
            change_intensity (float): 场景变化强度因子。
                - 0.0 表示无变化
                - 数值越大，变化越明显
                - 建议范围：0.1 - 2.0
            change_type (str): 场景变化类型。
                - "brightness": 亮度突变
                - "contrast": 对比度突变
                - "color": 颜色突变
                - "mixed": 混合变化
            num_changes (int): 场景变化次数。
                - 在图像上产生的变化区域数量
                - 建议范围：1 - 10
            input_size (int or None): 如果不是None，图像在攻击前将被调整为方形的input_size。
        """
        super().__init__(name="scene_change")
        self.change_intensity = change_intensity
        self.change_type = change_type
        self.num_changes = num_changes
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _apply_brightness_change(self, images, mask):
        """应用亮度突变"""
        # 随机选择增亮或变暗
        brightness_factor = self.change_intensity if random.random() > 0.5 else 1.0 / self.change_intensity
        brightness_images = images * brightness_factor
        return torch.mul(images, 1 - mask) + torch.mul(brightness_images, mask)

    def _apply_contrast_change(self, images, mask):
        """应用对比度突变"""
        # 随机选择增加或降低对比度
        contrast_factor = self.change_intensity if random.random() > 0.5 else 1.0 / self.change_intensity
        mean = torch.mean(images, dim=[1, 2, 3], keepdim=True)
        contrast_images = (images - mean) * contrast_factor + mean
        return torch.mul(images, 1 - mask) + torch.mul(contrast_images, mask)

    def _apply_color_change(self, images, mask):
        """应用颜色突变"""
        # 随机改变颜色通道的权重
        color_weights = torch.rand(3, device=self.device) * self.change_intensity + 0.5
        color_weights = color_weights.view(1, 3, 1, 1)
        color_images = images * color_weights
        return torch.mul(images, 1 - mask) + torch.mul(color_images, mask)

    def _apply_mixed_change(self, images, mask):
        """应用混合变化"""
        # 随机选择一种变化类型
        change_types = ["brightness", "contrast", "color"]
        selected_type = random.choice(change_types)
        
        if selected_type == "brightness":
            return self._apply_brightness_change(images, mask)
        elif selected_type == "contrast":
            return self._apply_contrast_change(images, mask)
        else:  # color
            return self._apply_color_change(images, mask)

    def _create_random_mask(self, images, change_idx):
        """创建随机变化区域掩码"""
        batch_size, _, H, W = images.shape
        
        # 创建不同形状的变化区域
        mask_types = ["rectangle", "circle", "stripe"]
        mask_type = random.choice(mask_types)
        
        mask = torch.zeros_like(images, device=self.device)
        
        if mask_type == "rectangle":
            # 矩形区域
            rect_size = min(H, W) // (2 + change_idx)
            x_start = random.randint(0, max(1, W - rect_size))
            y_start = random.randint(0, max(1, H - rect_size))
            x_end = min(W, x_start + rect_size)
            y_end = min(H, y_start + rect_size)
            mask[:, :, y_start:y_end, x_start:x_end] = 1
            
        elif mask_type == "circle":
            # 圆形区域
            center_x = random.randint(0, W-1)
            center_y = random.randint(0, H-1)
            radius = min(H, W) // (4 + change_idx)
            
            y_coords, x_coords = torch.meshgrid(
                torch.arange(H, device=self.device), 
                torch.arange(W, device=self.device),
                indexing='ij'
            )
            distances = torch.sqrt((x_coords - center_x)**2 + (y_coords - center_y)**2)
            circle_mask = (distances <= radius).float()
            mask = circle_mask.unsqueeze(0).unsqueeze(0).repeat(batch_size, 3, 1, 1)
            
        else:  # stripe
            # 条纹区域
            stripe_width = H // (5 + change_idx)
            start_row = random.randint(0, max(1, H - stripe_width))
            mask[:, :, start_row:start_row + stripe_width, :] = 1
        
        return mask

    def attack(self, model, images, targets=None, **kwargs):
        """
        使用场景跃变生成干扰样本。
        
        参数:
            model: YOLO模型实例
            images: 输入图像张量，形状为 (batch_size, channels, height, width)
            targets: 目标标签（此攻击中不使用）
            **kwargs: 额外参数
            
        返回:
            经过场景跃变干扰的图像张量
        """
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        
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

        # 应用多个场景变化
        changed_images = images_resized.clone()
        
        for change_idx in range(self.num_changes):
            # 为每次变化创建随机掩码
            mask = self._create_random_mask(changed_images, change_idx)
            
            # 根据变化类型应用相应的变化
            if self.change_type == "brightness":
                changed_images = self._apply_brightness_change(changed_images, mask)
            elif self.change_type == "contrast":
                changed_images = self._apply_contrast_change(changed_images, mask)
            elif self.change_type == "color":
                changed_images = self._apply_color_change(changed_images, mask)
            elif self.change_type == "mixed":
                changed_images = self._apply_mixed_change(changed_images, mask)
            
            # 确保像素值在有效范围内 [0, 1]
            changed_images = torch.clamp(changed_images, 0, 1)

        # 如果需要，调整回原始尺寸
        if self.input_size is not None and changed_images.shape[-2:] != orig_size:
            changed_images = F.interpolate(
                changed_images, 
                size=orig_size, 
                mode="bilinear", 
                align_corners=False
            )
            
        return changed_images

# 导出类供动态加载使用
Attack = SceneChangeAttack