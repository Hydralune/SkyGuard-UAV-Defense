"""
特征压缩防御算法

特征压缩通过减少输入特征空间来检测对抗样本。
主要包含两种压缩技术：颜色位深度压缩和空间平滑。
通过比较原始输入和压缩后输入的模型预测差异来检测对抗样本。
"""

import torch
import numpy as np
import cv2
from .base import BaseDefense

class FeatureSqueezingDefense(BaseDefense):
    """基于特征压缩的对抗样本检测防御"""
    
    def __init__(self, bit_depth=4, use_median_filter=True, median_window=2, 
                 use_non_local_means=False, nlm_h=10, nlm_template_window=7, 
                 nlm_search_window=21, threshold=0.5, detection_method="joint"):
        """
        初始化特征压缩防御
        
        参数:
            bit_depth: 颜色位深度压缩级别 (1-8)
            use_median_filter: 是否使用中值滤波
            median_window: 中值滤波窗口大小
            use_non_local_means: 是否使用非局部均值去噪
            nlm_h: 非局部均值去噪强度
            nlm_template_window: 模板窗口大小
            nlm_search_window: 搜索窗口大小
            threshold: 检测阈值
            detection_method: 检测方法 ("bit_depth", "median", "non_local", "joint")
        """
        super().__init__(name="feature_squeezing")
        self.bit_depth = max(1, min(8, bit_depth))
        self.use_median_filter = use_median_filter
        self.median_window = max(2, median_window)
        self.use_non_local_means = use_non_local_means
        self.nlm_h = nlm_h
        self.nlm_template_window = nlm_template_window
        self.nlm_search_window = nlm_search_window
        self.threshold = threshold
        self.detection_method = detection_method
        
    def bit_depth_squeezing(self, image):
        """
        颜色位深度压缩
        
        参数:
            image: 输入图像张量 (1, channels, height, width)
            
        返回:
            squeezed_image: 压缩后的图像张量
        """
        # 转换为numpy进行处理
        img_np = image.squeeze(0).permute(1, 2, 0).cpu().numpy()
        
        # 确保像素值在[0,1]范围内
        img_np = np.clip(img_np, 0, 1)
        
        # 位深度压缩
        levels = 2 ** self.bit_depth - 1
        squeezed = np.round(img_np * levels) / levels
        
        # 转换回tensor
        squeezed_tensor = torch.from_numpy(squeezed).permute(2, 0, 1).float()
        return squeezed_tensor.unsqueeze(0).to(image.device)
    
    def median_filter_squeezing(self, image):
        """
        中值滤波压缩
        
        参数:
            image: 输入图像张量 (1, channels, height, width)
            
        返回:
            squeezed_image: 压缩后的图像张量
        """
        # 转换为numpy进行OpenCV处理
        img_np = image.squeeze(0).permute(1, 2, 0).cpu().numpy()
        img_np = (img_np * 255).astype(np.uint8)
        
        # 应用中值滤波
        if img_np.shape[2] == 3:  # 彩色图像
            filtered = cv2.medianBlur(img_np, self.median_window)
        else:  # 灰度图像
            filtered = cv2.medianBlur(img_np[:,:,0], self.median_window)
            filtered = np.expand_dims(filtered, axis=2)
        
        # 转换回tensor
        filtered_tensor = torch.from_numpy(filtered).permute(2, 0, 1).float() / 255.0
        return filtered_tensor.unsqueeze(0).to(image.device)
    
    def non_local_means_squeezing(self, image):
        """
        非局部均值去噪压缩
        
        参数:
            image: 输入图像张量 (1, channels, height, width)
            
        返回:
            squeezed_image: 压缩后的图像张量
        """
        # 转换为numpy进行OpenCV处理
        img_np = image.squeeze(0).permute(1, 2, 0).cpu().numpy()
        img_np = (img_np * 255).astype(np.uint8)
        
        # 应用非局部均值去噪
        if img_np.shape[2] == 3:  # 彩色图像
            denoised = cv2.fastNlMeansDenoisingColored(
                img_np, None, self.nlm_h, self.nlm_h,
                self.nlm_template_window, self.nlm_search_window
            )
        else:  # 灰度图像
            denoised = cv2.fastNlMeansDenoising(
                img_np[:,:,0], None, self.nlm_h,
                self.nlm_template_window, self.nlm_search_window
            )
            denoised = np.expand_dims(denoised, axis=2)
        
        # 转换回tensor
        denoised_tensor = torch.from_numpy(denoised).permute(2, 0, 1).float() / 255.0
        return denoised_tensor.unsqueeze(0).to(image.device)
    
    def compute_prediction_difference(self, model, original_image, squeezed_image):
        """
        计算原始图像和压缩图像的预测差异
        
        参数:
            model: 目标模型（YOLO）
            original_image: 原始图像张量 (1, C, H, W)
            squeezed_image: 压缩后图像张量 (1, C, H, W)
            
        返回:
            l1_distance: L1距离差异
        """
        with torch.no_grad():
            # 转换为numpy格式进行YOLO推理
            original_np = (original_image.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).astype(np.uint8)
            squeezed_np = (squeezed_image.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).astype(np.uint8)
            
            # 使用YOLO模型进行推理
            original_results = model(original_np)
            squeezed_results = model(squeezed_np)
            
            # 提取检测结果的特征向量
            original_vector = self._extract_detection_features(original_results)
            squeezed_vector = self._extract_detection_features(squeezed_results)
            
            # 计算L1距离
            l1_distance = torch.sum(torch.abs(original_vector - squeezed_vector))
            
        return l1_distance.item()
    
    def _extract_detection_features(self, yolo_results):
        """
        从YOLO检测结果中提取特征向量
        
        参数:
            yolo_results: YOLO检测结果
            
        返回:
            feature_vector: 特征向量 (torch.Tensor)
        """
        # 假设使用YOLOv5的结果格式
        if hasattr(yolo_results, 'pred') and len(yolo_results.pred) > 0:
            detections = yolo_results.pred[0]  # 第一个图像的检测结果
        else:
            # 如果没有检测到任何对象，返回零向量
            return torch.zeros(10)  # 假设有10个类别
        
        # 如果没有检测到任何对象
        if detections.shape[0] == 0:
            return torch.zeros(10)
        
        # 提取检测结果的统计特征
        # detections format: [x1, y1, x2, y2, conf, class]
        confidences = detections[:, 4]  # 置信度
        classes = detections[:, 5].long()  # 类别ID
        
        # 创建类别概率分布向量
        num_classes = 10  # VisDrone数据集类别数
        class_probs = torch.zeros(num_classes)
        
        # 累加每个类别的置信度
        for i, cls in enumerate(classes):
            if cls < num_classes:
                class_probs[cls] += confidences[i]
        
        # 归一化
        if class_probs.sum() > 0:
            class_probs = class_probs / class_probs.sum()
        
        return class_probs
    
    def detect_adversarial(self, model, image):
        """
        检测单张图像是否为对抗样本
        
        参数:
            model: 目标模型
            image: 输入图像张量 (1, channels, height, width)
            
        返回:
            detection_results: 检测结果字典
        """
        detection_results = {
            'is_adversarial': False,
            'confidence': 0.0,
            'method_scores': {},
            'threshold': self.threshold,
            'detection_method': self.detection_method
        }
        
        scores = []
        
        # 位深度压缩检测
        if self.detection_method in ["bit_depth", "joint"]:
            squeezed_image = self.bit_depth_squeezing(image)
            bit_depth_score = self.compute_prediction_difference(model, image, squeezed_image)
            detection_results['method_scores']['bit_depth'] = bit_depth_score
            scores.append(bit_depth_score)
        
        # 中值滤波检测
        if self.use_median_filter and self.detection_method in ["median", "joint"]:
            squeezed_image = self.median_filter_squeezing(image)
            median_score = self.compute_prediction_difference(model, image, squeezed_image)
            detection_results['method_scores']['median'] = median_score
            scores.append(median_score)
        
        # 非局部均值检测
        if self.use_non_local_means and self.detection_method in ["non_local", "joint"]:
            squeezed_image = self.non_local_means_squeezing(image)
            nlm_score = self.compute_prediction_difference(model, image, squeezed_image)
            detection_results['method_scores']['non_local'] = nlm_score
            scores.append(nlm_score)
        
        # 联合检测使用最大分数
        if self.detection_method == "joint" and scores:
            final_score = max(scores)
        elif scores:
            final_score = scores[0]
        else:
            final_score = 0.0
        
        detection_results['confidence'] = final_score
        detection_results['is_adversarial'] = final_score > self.threshold
        
        return detection_results
    
    def defend(self, images, model=None, **kwargs):
        """
        防御函数 - 检测对抗样本并选择性净化
        
        参数:
            images: 输入图像张量 (batch_size, channels, height, width)
            model: 目标模型（用于检测）
            
        返回:
            defended_images: 防御后的图像
            detection_info: 检测信息字典
        """
        batch_size = images.shape[0]
        defended_images = []
        
        # 初始化检测信息
        detection_info = {
            'total_count': batch_size,
            'adversarial_detected': 0,
            'purified_count': 0,
            'detection_rate': 0.0,
            'threshold': self.threshold,
            'detection_method': self.detection_method,
            'individual_results': []
        }
        
        # 逐张处理图像
        for i in range(batch_size):
            image = images[i:i+1]  # 保持batch维度
            
            if model is not None:
                # 进行对抗样本检测
                detection_result = self.detect_adversarial(model, image)
                detection_info['individual_results'].append(detection_result)
                
                if detection_result['is_adversarial']:
                    # 检测到对抗样本，进行净化
                    detection_info['adversarial_detected'] += 1
                    detection_info['purified_count'] += 1
                    
                    # 选择最佳净化方法（使用检测分数最高的方法）
                    if detection_result['method_scores']:
                        best_method = max(detection_result['method_scores'].items(), 
                                        key=lambda x: x[1])[0]
                    else:
                        best_method = 'bit_depth'  # 默认方法
                    
                    if best_method == 'bit_depth':
                        purified_image = self.bit_depth_squeezing(image)
                    elif best_method == 'median':
                        purified_image = self.median_filter_squeezing(image)
                    elif best_method == 'non_local':
                        purified_image = self.non_local_means_squeezing(image)
                    else:
                        purified_image = self.bit_depth_squeezing(image)  # 默认方法
                    
                    defended_images.append(purified_image)
                else:
                    # 正常图像，直接通过
                    defended_images.append(image)
            else:
                # 没有模型时，直接应用默认净化
                purified_image = self.bit_depth_squeezing(image)
                defended_images.append(purified_image)
                detection_info['purified_count'] += 1
        
        # 计算检测率
        if model is not None:
            detection_info['detection_rate'] = detection_info['adversarial_detected'] / batch_size
        
        # 合并处理后的图像
        defended_images = torch.cat(defended_images, dim=0)
        
        return defended_images, detection_info
    
    def get_config_summary(self):
        """获取配置摘要"""
        config = {
            'name': 'Feature Squeezing',
            'bit_depth': self.bit_depth,
            'use_median_filter': self.use_median_filter,
            'median_window': self.median_window if self.use_median_filter else None,
            'use_non_local_means': self.use_non_local_means,
            'nlm_params': {
                'h': self.nlm_h,
                'template_window': self.nlm_template_window,
                'search_window': self.nlm_search_window
            } if self.use_non_local_means else None,
            'threshold': self.threshold,
            'detection_method': self.detection_method
        }
        return config

# 导出类供动态加载使用
Defense = FeatureSqueezingDefense