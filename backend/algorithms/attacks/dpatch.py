import torch
from .base import BaseAttack
import random

class DPatchAttack(BaseAttack):
    """
    DPatch: 一种针对目标检测器的对抗性贴片攻击。
    此攻击会生成一个贴片，该贴片应用于图像以欺骗目标检测器。
    """

    def __init__(self, patch_size=30, eps=8/255, steps=40, input_size=640):
        """
        参数:
            patch_size (int): 方形贴片的大小。
            eps (float): 每一步的最大扰动。
            steps (int): 攻击的步数。
            input_size (int or None): 如果不是None，图像在攻击前将被调整为方形的input_size。
        """
        super().__init__(name="dpatch")
        self.patch_size = patch_size
        self.eps = eps
        self.steps = steps
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attack(self, model, images, targets=None, **kwargs):
        """
        使用DPatch生成对抗性样本。

        参数:
            model: Ultralytics YOLO模型。
            images (torch.Tensor): 输入图像，范围在[0,1]，形状为(B,C,H,W)。
            targets: 未使用。
        返回:
            与`images`形状相同的torch.Tensor，包含对抗性样本。
        """
        images = images.clone().detach().to(self.device)
        orig_size = images.shape[-2:]
        if self.input_size is not None and orig_size != (self.input_size, self.input_size):
            images_resized = torch.nn.functional.interpolate(images, size=(self.input_size, self.input_size), mode="bilinear", align_corners=False)
        else:
            images_resized = images

        batch_size, _, H, W = images_resized.shape

        # 初始化贴片
        patch = torch.rand((1, 3, self.patch_size, self.patch_size), device=self.device)
        patch.requires_grad = True

        # 确保模型在正确的设备上
        model.model.to(self.device)
        model.model.eval()

        for _ in range(self.steps):
            # 在随机位置应用贴片
            x_pos = random.randint(0, W - self.patch_size)
            y_pos = random.randint(0, H - self.patch_size)
            
            mask = torch.zeros_like(images_resized, device=self.device)
            mask[:, :, y_pos:y_pos+self.patch_size, x_pos:x_pos+self.patch_size] = 1
            
            patched_images = torch.mul(images_resized, 1 - mask) + torch.mul(patch, mask)
            patched_images = torch.clamp(patched_images, 0, 1)

            # 前向传播
            preds = model.model(patched_images)
            if isinstance(preds, (list, tuple)):
                preds = preds[0]
            
            # 使用目标置信度分数作为损失
            obj_conf = preds[..., 4]
            loss = -obj_conf.mean()

            # 反向传播
            model.model.zero_grad()
            if patch.grad is not None:
                patch.grad.zero_()
            loss.backward()

            # 更新贴片
            grad_sign = patch.grad.data.sign()
            patch.data = patch.data - self.eps * grad_sign
            patch.data = torch.clamp(patch.data, 0, 1)

        # 将最终的贴片应用于原始批次的图像
        x_pos = random.randint(0, W - self.patch_size)
        y_pos = random.randint(0, H - self.patch_size)
        mask = torch.zeros_like(images_resized, device=self.device)
        mask[:, :, y_pos:y_pos+self.patch_size, x_pos:x_pos+self.patch_size] = 1
        
        adv_images_resized = torch.mul(images_resized, 1 - mask) + torch.mul(patch.detach(), mask)
        adv_images_resized = torch.clamp(adv_images_resized, 0, 1)

        # 如果需要，调整回原始尺寸
        if self.input_size is not None and adv_images_resized.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images_resized, size=orig_size, mode="bilinear", align_corners=False)
        else:
            adv_images = adv_images_resized
            
        return adv_images

# 为了向后兼容
Attack = DPatchAttack 