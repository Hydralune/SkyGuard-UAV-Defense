"""
统计检测防御算法

基于统计特征异常检测对抗样本的防御方法。
通过分析图像的梯度、方差、熵等统计特征来识别对抗样本，
并对检测到的对抗样本进行净化处理。
"""

import torch
import torch.nn.functional as F
import numpy as np
import cv2
from scipy import ndimage
from .base import BaseDefense

class StatisticalDetectorDefense(BaseDefense):
    """基于统计特征的对抗样本检测防御"""
    
    def __init__(self, threshold=0.6, purify_method="gaussian_blur", 
                 use_gradient=True, use_variance=True, use_entropy=True):
        """
        初始化统计检测防御
        
        参数:
            threshold: 检测阈值，超过此值认为是对抗样本
            purify_method: 净化方法 ("gaussian_blur", "median_filter", "bilateral_filter")
            use_gradient: 是否使用梯度特征检测
            use_variance: 是否使用方差特征检测
            use_entropy: 是否使用熵特征检测
        """
        super().__init__(name="statistical_detector")
        self.threshold = threshold
        self.purify_method = purify_method
        self.use_gradient = use_gradient
        self.use_variance = use_variance
        self.use_entropy = use_entropy
        
        # 正常图像的统计特征基准值（可通过校准获得更精确的值）
        self.normal_stats = {
            'gradient_mean': 0.1,
            'gradient_std': 0.05,
            'variance_mean': 0.02,
            'variance_std': 0.01,
            'entropy_mean': 6.5,
            'entropy_std': 1.0
        }
    
    def defend(self, images, **kwargs):
        """
        执行统计检测防御
        
        参数:
            images: 输入图像 (torch.Tensor 或 numpy.ndarray)
            **kwargs: 额外参数
                - purify_method: 覆盖默认净化方法
                - threshold: 覆盖默认检测阈值
        
        返回:
            defended_images: 防御后的图像
            detection_info: 检测信息字典
        """
        # 获取参数
        purify_method = kwargs.get('purify_method', self.purify_method)
        threshold = kwargs.get('threshold', self.threshold)
        
        # 转换为torch tensor以便处理
        if isinstance(images, np.ndarray):
            images_tensor = torch.from_numpy(images).float()
            is_numpy_input = True
        else:
            images_tensor = images.float()
            is_numpy_input = False
        
        # 确保图像在[0,1]范围内
        if images_tensor.max() > 1.0:
            images_tensor = images_tensor / 255.0
        
        # 1. 检测对抗样本
        detection_scores, is_adversarial = self.detect_adversarial(images_tensor, threshold)
        
        # 2. 对检测到的对抗样本进行净化
        defended_images = images_tensor.clone()
        purified_count = 0
        
        if torch.any(is_adversarial):
            adversarial_indices = torch.where(is_adversarial)[0]
            for idx in adversarial_indices:
                defended_images[idx] = self.purify_image(images_tensor[idx], purify_method)
                purified_count += 1
        
        # 3. 转换回原始格式
        if is_numpy_input:
            defended_images = defended_images.numpy()
        
        # 4. 构建检测信息
        detection_info = {
            'detection_scores': detection_scores.tolist() if isinstance(detection_scores, torch.Tensor) else detection_scores,
            'is_adversarial': is_adversarial.tolist() if isinstance(is_adversarial, torch.Tensor) else is_adversarial,
            'purified_count': purified_count,
            'total_count': len(images_tensor),
            'detection_rate': purified_count / len(images_tensor),
            'method': self.name,
            'threshold': threshold,
            'purify_method': purify_method
        }
        
        return defended_images, detection_info
    
    def detect_adversarial(self, images, threshold):
        """
        检测对抗样本
        
        参数:
            images: 输入图像张量 (batch_size, channels, height, width)
            threshold: 检测阈值
        
        返回:
            detection_scores: 每张图像的检测分数
            is_adversarial: 布尔数组，True表示是对抗样本
        """
        batch_size = images.shape[0]
        detection_scores = torch.zeros(batch_size, device=images.device)
        
        for i, img in enumerate(images):
            features = []
            
            # 1. 梯度特征分析
            if self.use_gradient:
                gradient_score = self._analyze_gradient_features(img)
                features.append(gradient_score)
            
            # 2. 方差特征分析
            if self.use_variance:
                variance_score = self._analyze_variance_features(img)
                features.append(variance_score)
            
            # 3. 熵特征分析
            if self.use_entropy:
                entropy_score = self._analyze_entropy_features(img)
                features.append(entropy_score)
            
            # 综合特征得分
            if features:
                detection_scores[i] = torch.mean(torch.stack(features))
        
        # 判断是否为对抗样本
        is_adversarial = detection_scores > threshold
        
        return detection_scores, is_adversarial
    
    def _analyze_gradient_features(self, image):
        """分析梯度特征异常"""
        # 计算Sobel梯度
        sobel_x = torch.tensor([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], 
                              dtype=torch.float32, device=image.device).unsqueeze(0).unsqueeze(0)
        sobel_y = torch.tensor([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], 
                              dtype=torch.float32, device=image.device).unsqueeze(0).unsqueeze(0)
        
        gradient_scores = []
        for c in range(image.shape[0]):  # 对每个通道
            channel = image[c:c+1].unsqueeze(0)
            
            grad_x = F.conv2d(channel, sobel_x, padding=1)
            grad_y = F.conv2d(channel, sobel_y, padding=1)
            gradient_magnitude = torch.sqrt(grad_x**2 + grad_y**2)
            
            # 计算梯度统计量
            grad_mean = torch.mean(gradient_magnitude)
            grad_std = torch.std(gradient_magnitude)
            
            # 与正常基准比较
            mean_diff = abs(grad_mean - self.normal_stats['gradient_mean'])
            std_diff = abs(grad_std - self.normal_stats['gradient_std'])
            
            # 归一化异常分数
            mean_score = min(mean_diff / self.normal_stats['gradient_mean'], 1.0)
            std_score = min(std_diff / self.normal_stats['gradient_std'], 1.0)
            
            gradient_scores.append((mean_score + std_score) / 2)
        
        return torch.mean(torch.stack(gradient_scores))
    
    def _analyze_variance_features(self, image):
        """分析方差特征异常"""
        # 计算局部方差
        kernel_size = 5
        unfold = F.unfold(image.unsqueeze(0), kernel_size, padding=kernel_size//2)
        local_patches = unfold.transpose(1, 2).reshape(-1, image.shape[0], kernel_size, kernel_size)
        
        # 计算每个patch的方差
        local_variances = torch.var(local_patches.flatten(2), dim=2)
        
        # 整体方差统计
        variance_mean = torch.mean(local_variances)
        variance_std = torch.std(local_variances)
        
        # 与正常基准比较
        mean_diff = abs(variance_mean - self.normal_stats['variance_mean'])
        std_diff = abs(variance_std - self.normal_stats['variance_std'])
        
        mean_score = min(mean_diff / self.normal_stats['variance_mean'], 1.0)
        std_score = min(std_diff / self.normal_stats['variance_std'], 1.0)
        
        return (mean_score + std_score) / 2
    
    def _analyze_entropy_features(self, image):
        """分析熵特征异常"""
        # 将图像转换为灰度并量化
        gray_image = torch.mean(image, dim=0)
        quantized = (gray_image * 255).long().clamp(0, 255)
        
        # 计算直方图
        hist = torch.histc(quantized.float(), bins=256, min=0, max=255)
        
        # 计算概率分布
        prob = hist / torch.sum(hist)
        prob = prob[prob > 0]  # 移除零概率
        
        # 计算熵
        entropy = -torch.sum(prob * torch.log2(prob))
        
        # 与正常基准比较
        entropy_diff = abs(entropy - self.normal_stats['entropy_mean'])
        entropy_score = min(entropy_diff / self.normal_stats['entropy_std'], 1.0)
        
        return entropy_score
    
    def purify_image(self, image, method):
        """
        净化对抗样本
        
        参数:
            image: 单张图像 (channels, height, width)
            method: 净化方法
        
        返回:
            purified_image: 净化后的图像
        """
        if method == "gaussian_blur":
            return self._gaussian_blur_purify(image)
        elif method == "median_filter":
            return self._median_filter_purify(image)
        elif method == "bilateral_filter":
            return self._bilateral_filter_purify(image)
        else:
            return image
    
    def _gaussian_blur_purify(self, image):
        """高斯模糊净化"""
        # 转换为numpy进行OpenCV处理
        img_np = image.permute(1, 2, 0).cpu().numpy()
        img_np = (img_np * 255).astype(np.uint8)
        
        # 应用高斯模糊
        blurred = cv2.GaussianBlur(img_np, (5, 5), 1.0)
        
        # 转换回tensor
        blurred_tensor = torch.from_numpy(blurred).permute(2, 0, 1).float() / 255.0
        return blurred_tensor.to(image.device)
    
    def _median_filter_purify(self, image):
        """中值滤波净化"""
        img_np = image.permute(1, 2, 0).cpu().numpy()
        img_np = (img_np * 255).astype(np.uint8)
        
        # 应用中值滤波
        filtered = cv2.medianBlur(img_np, 3)
        
        filtered_tensor = torch.from_numpy(filtered).permute(2, 0, 1).float() / 255.0
        return filtered_tensor.to(image.device)
    
    def _bilateral_filter_purify(self, image):
        """双边滤波净化"""
        img_np = image.permute(1, 2, 0).cpu().numpy()
        img_np = (img_np * 255).astype(np.uint8)
        
        # 应用双边滤波
        filtered = cv2.bilateralFilter(img_np, 9, 75, 75)
        
        filtered_tensor = torch.from_numpy(filtered).permute(2, 0, 1).float() / 255.0
        return filtered_tensor.to(image.device)
    
    def calibrate(self, normal_images):
        """
        在正常图像数据集上校准基准统计值
        
        参数:
            normal_images: 正常图像数据集 (batch_size, channels, height, width)
        """
        print("🔧 正在校准统计特征基准值...")
        
        gradient_means, variance_means, entropy_values = [], [], []
        
        with torch.no_grad():
            for img in normal_images:
                if len(img.shape) == 3:
                    img = img.unsqueeze(0)
                
                # 收集梯度特征
                grad_score = self._analyze_gradient_features(img[0])
                gradient_means.append(grad_score)
                
                # 收集方差特征
                var_score = self._analyze_variance_features(img[0])
                variance_means.append(var_score)
                
                # 收集熵特征
                entropy_score = self._analyze_entropy_features(img[0])
                entropy_values.append(entropy_score)
        
        # 更新基准值
        self.normal_stats = {
            'gradient_mean': torch.mean(torch.stack(gradient_means)).item(),
            'gradient_std': torch.std(torch.stack(gradient_means)).item(),
            'variance_mean': torch.mean(torch.stack(variance_means)).item(),
            'variance_std': torch.std(torch.stack(variance_means)).item(),
            'entropy_mean': torch.mean(torch.stack(entropy_values)).item(),
            'entropy_std': torch.std(torch.stack(entropy_values)).item(),
        }
        
        print("✅ 统计特征基准值校准完成！")
        print(f"   梯度基准: {self.normal_stats['gradient_mean']:.4f} ± {self.normal_stats['gradient_std']:.4f}")
        print(f"   方差基准: {self.normal_stats['variance_mean']:.4f} ± {self.normal_stats['variance_std']:.4f}")
        print(f"   熵基准: {self.normal_stats['entropy_mean']:.4f} ± {self.normal_stats['entropy_std']:.4f}")

# 导出类供动态加载使用
Defense = StatisticalDetectorDefense