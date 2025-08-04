# backend/algorithms/attacks/advpatch.py
import torch
import numpy as np
from .base import BaseAttack

class AdvPatchAttack(BaseAttack):
    """
    通用对抗补丁攻击实现
    
    AdvPatch是一种物理世界攻击方法，通过在图像上添加可优化的补丁来欺骗目标检测器。
    与DPatch不同，AdvPatch更专注于生成视觉上更自然的补丁，并支持多位置放置。
    
    参数:
        patch_size: 补丁大小（像素）或相对于图像大小的比例（0-1之间）
        learning_rate: 补丁优化的学习率
        max_iter: 最大优化迭代次数
        random_locations: 是否在随机位置放置补丁
        num_patches: 放置的补丁数量
        input_size: 输入图像的固定尺寸
    """
    
    def __init__(self, patch_size=0.1, learning_rate=0.1, max_iter=100, 
                 random_locations=True, num_patches=1, input_size=640):
        super().__init__(name="AdvPatch")
        self.patch_size = patch_size  # 如果是0-1之间，则为相对大小
        self.learning_rate = learning_rate
        self.max_iter = max_iter
        self.random_locations = random_locations
        self.num_patches = num_patches
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.input_size = input_size
        self.patch = None
    
    def _init_patch(self, image_size):
        """初始化对抗补丁"""
        # 确定补丁大小
        if isinstance(self.patch_size, float) and 0 < self.patch_size < 1:
            patch_h = int(image_size[0] * self.patch_size)
            patch_w = int(image_size[1] * self.patch_size)
        else:
            patch_h = patch_w = self.patch_size
            
        # 创建随机初始化的补丁
        patch = torch.rand(1, 3, patch_h, patch_w, device=self.device)
        return patch
    
    def _apply_patch(self, images, patch):
        """将补丁应用到图像上的指定位置"""
        batch_size = images.shape[0]
        image_h, image_w = images.shape[2], images.shape[3]
        patch_h, patch_w = patch.shape[2], patch.shape[3]
        
        # 创建修改后的图像副本
        patched_images = images.clone()
        
        for i in range(batch_size):
            for _ in range(self.num_patches):
                # 确定补丁位置
                if self.random_locations:
                    x = np.random.randint(0, image_w - patch_w)
                    y = np.random.randint(0, image_h - patch_h)
                else:
                    # 默认放在中心位置
                    x = (image_w - patch_w) // 2
                    y = (image_h - patch_h) // 2
                
                # 应用补丁
                patched_images[i, :, y:y+patch_h, x:x+patch_w] = patch
        
        return patched_images
    
    def attack(self, model, images, targets=None, **kwargs):
        """
        执行AdvPatch攻击
        
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
        
        # 使用模型
        model.model.to(self.device)
        model.model.eval()
        
        # 初始化补丁（如果需要）
        if self.patch is None or self.patch.shape[2:] != (int(images.shape[2] * self.patch_size), int(images.shape[3] * self.patch_size)):
            self.patch = self._init_patch((images.shape[2], images.shape[3]))
        
        # 优化补丁
        patch = self.patch.clone().detach().requires_grad_(True)
        optimizer = torch.optim.Adam([patch], lr=self.learning_rate)
        
        for _ in range(self.max_iter):
            # 应用补丁到图像
            patched_images = self._apply_patch(images, patch)
            
            # 前向传播
            preds = model.model(patched_images)
            if isinstance(preds, (list, tuple)):
                preds = preds[0]
            
            # 目标: 减少检测置信度
            obj_conf = preds[..., 4]
            loss = -obj_conf.mean()  # 最小化置信度
            
            # 反向传播和优化
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            # 裁剪补丁值到有效范围
            with torch.no_grad():
                patch.data = torch.clamp(patch.data, 0, 1)
        
        # 保存优化后的补丁
        self.patch = patch.detach()
        
        # 生成最终的对抗样本
        adv_images = self._apply_patch(images, self.patch)
        
        # 还原到原始分辨率
        if self.input_size is not None and adv_images.shape[-2:] != orig_size:
            adv_images = torch.nn.functional.interpolate(adv_images, size=orig_size, mode="bilinear", align_corners=False)
        
        return adv_images