# backend/utils/evaluator.py
import os
import time
import json
import numpy as np
import torch
import cv2
from sklearn.metrics import precision_recall_curve, average_precision_score
from utils.dataset_manager import DatasetManager

class Evaluator:
    """模型评估器，用于评估模型性能"""
    
    def __init__(self, model, save_dir="results", conf_threshold=0.25, iou_threshold=0.5):
        """
        初始化评估器
        
        参数:
            model: 要评估的模型
            save_dir: 保存结果的目录
            conf_threshold: 置信度阈值
            iou_threshold: IoU阈值
        """
        self.model = model
        self.save_dir = save_dir
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        
        # 创建保存目录
        os.makedirs(save_dir, exist_ok=True)
    
    def evaluate_detection(self, image_path, image_rgb=None):
        """
        评估目标检测性能
        
        参数:
            image_path: 图像路径
            image_rgb: 预加载的RGB图像（可选）
            
        返回:
            检测结果，推理时间
        """
        # 如果没有提供图像，则加载图像
        if image_rgb is None:
            _, image_rgb, _ = DatasetManager.load_image(image_path)
        
        # 执行推理并计时
        start_time = time.time()
        results = self.model.predict(image_rgb, conf=self.conf_threshold, iou=self.iou_threshold)
        inference_time = time.time() - start_time
        
        return results, inference_time
    
    def evaluate_attack(self, image_path, attack_algo, image_rgb=None):
        """
        评估攻击算法对模型的影响
        
        参数:
            image_path: 图像路径
            attack_algo: 攻击算法
            image_rgb: 预加载的RGB图像（可选）
            
        返回:
            原始检测结果，攻击后检测结果，攻击后图像
        """
        # 如果没有提供图像，则加载图像
        if image_rgb is None:
            _, image_rgb, _ = DatasetManager.load_image(image_path)
        
        # 对原始图像进行检测
        clean_results = self.model.predict(image_rgb, conf=self.conf_threshold, iou=self.iou_threshold)
        
        # 生成对抗样本
        adv_image_rgb = attack_algo.generate(self.model, image_rgb)
        
        # 对对抗样本进行检测
        adv_results = self.model.predict(adv_image_rgb, conf=self.conf_threshold, iou=self.iou_threshold)
        
        return clean_results, adv_results, adv_image_rgb
    
    def evaluate_defense(self, image_path, attack_algo, defense_algo, image_rgb=None):
        """
        评估防御算法对抗攻击的效果
        
        参数:
            image_path: 图像路径
            attack_algo: 攻击算法
            defense_algo: 防御算法
            image_rgb: 预加载的RGB图像（可选）
            
        返回:
            原始检测结果，攻击后检测结果，防御后检测结果
        """
        # 如果没有提供图像，则加载图像
        if image_rgb is None:
            _, image_rgb, _ = DatasetManager.load_image(image_path)
        
        # 对原始图像进行检测
        clean_results = self.model.predict(image_rgb, conf=self.conf_threshold, iou=self.iou_threshold)
        
        # 生成对抗样本
        adv_image_rgb = attack_algo.generate(self.model, image_rgb)
        
        # 对对抗样本进行检测
        adv_results = self.model.predict(adv_image_rgb, conf=self.conf_threshold, iou=self.iou_threshold)
        
        # 应用防御算法
        defended_image_rgb = defense_algo(adv_image_rgb)
        
        # 对防御后的图像进行检测
        defense_results = self.model.predict(defended_image_rgb, conf=self.conf_threshold, iou=self.iou_threshold)
        
        return clean_results, adv_results, defense_results
    
    def calculate_metrics(self, detections, ground_truth, iou_threshold=0.5):
        """
        计算评估指标（精确率、召回率等）
        
        参数:
            detections: 检测结果 [[x, y, w, h, class_id, conf], ...]
            ground_truth: 真实标注 [[x, y, w, h, class_id, _], ...]
            iou_threshold: IoU阈值
            
        返回:
            指标字典
        """
        # 如果没有检测结果或标注，返回空指标
        if not detections or not ground_truth:
            return {
                "precision": 0,
                "recall": 0,
                "f1_score": 0,
                "ap": 0,
                "map": 0
            }
        
        # 计算每个检测结果与真实标注的IoU
        ious = self._calculate_iou_matrix(detections, ground_truth)
        
        # 初始化指标
        true_positives = 0
        false_positives = 0
        false_negatives = len(ground_truth)
        
        # 记录已匹配的真实标注
        matched_gt = set()
        
        # 按置信度排序检测结果
        sorted_detections = sorted(detections, key=lambda x: x[5], reverse=True)
        
        # 计算TP和FP
        for i, det in enumerate(sorted_detections):
            det_class = det[4]
            
            # 找到最大IoU的真实标注
            max_iou = 0
            max_idx = -1
            
            for j, gt in enumerate(ground_truth):
                gt_class = gt[4]
                
                # 只匹配相同类别
                if det_class == gt_class and j not in matched_gt:
                    if ious[i][j] > max_iou:
                        max_iou = ious[i][j]
                        max_idx = j
            
            # 如果IoU超过阈值，则为TP
            if max_iou >= iou_threshold and max_idx != -1:
                true_positives += 1
                matched_gt.add(max_idx)
                false_negatives -= 1
            else:
                false_positives += 1
        
        # 计算精确率和召回率
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        
        # 计算F1分数
        f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        # 计算AP（简化版）
        ap = precision * recall
        
        # 返回指标
        return {
            "precision": precision,
            "recall": recall,
            "f1_score": f1_score,
            "ap": ap,
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives
        }
    
    def _calculate_iou_matrix(self, boxes1, boxes2):
        """
        计算两组边界框之间的IoU矩阵
        
        参数:
            boxes1: 第一组边界框 [[x, y, w, h, ...], ...]
            boxes2: 第二组边界框 [[x, y, w, h, ...], ...]
            
        返回:
            IoU矩阵 [len(boxes1) x len(boxes2)]
        """
        iou_matrix = np.zeros((len(boxes1), len(boxes2)))
        
        for i, box1 in enumerate(boxes1):
            for j, box2 in enumerate(boxes2):
                iou_matrix[i, j] = self._calculate_iou(box1[:4], box2[:4])
        
        return iou_matrix
    
    def _calculate_iou(self, box1, box2):
        """
        计算两个边界框的IoU
        
        参数:
            box1: [x, y, w, h]
            box2: [x, y, w, h]
            
        返回:
            IoU值
        """
        # 转换为 [x1, y1, x2, y2] 格式
        box1_x1, box1_y1 = box1[0], box1[1]
        box1_x2, box1_y2 = box1[0] + box1[2], box1[1] + box1[3]
        
        box2_x1, box2_y1 = box2[0], box2[1]
        box2_x2, box2_y2 = box2[0] + box2[2], box2[1] + box2[3]
        
        # 计算交集区域
        x1 = max(box1_x1, box2_x1)
        y1 = max(box1_y1, box2_y1)
        x2 = min(box1_x2, box2_x2)
        y2 = min(box1_y2, box2_y2)
        
        # 如果没有交集，返回0
        if x2 < x1 or y2 < y1:
            return 0.0
        
        # 计算交集面积
        intersection = (x2 - x1) * (y2 - y1)
        
        # 计算各自面积
        box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
        box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
        
        # 计算并集面积
        union = box1_area + box2_area - intersection
        
        # 返回IoU
        return intersection / union if union > 0 else 0.0
    
    def evaluate_with_annotations(self, image_path, annotation_path=None):
        """
        使用标注数据评估模型性能
        
        参数:
            image_path: 图像路径
            annotation_path: 标注文件路径（可选）
            
        返回:
            检测结果，评估指标
        """
        # 加载图像
        _, image_rgb, _ = DatasetManager.load_image(image_path)
        
        # 执行检测
        results, inference_time = self.evaluate_detection(image_path, image_rgb)
        
        # 如果没有提供标注路径，尝试自动查找
        if annotation_path is None:
            annotation_path = DatasetManager.get_annotation_path(image_path)
        
        # 如果找到标注文件，计算指标
        metrics = {}
        if annotation_path:
            # 加载标注数据
            ground_truth = DatasetManager.load_annotations(annotation_path)
            
            # 转换检测结果为标准格式
            detections = []
            for box in results[0].boxes:
                x, y, w, h = box.xywh[0].cpu().numpy()
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                detections.append([x, y, w, h, cls_id, conf])
            
            # 计算评估指标
            metrics = self.calculate_metrics(detections, ground_truth, self.iou_threshold)
        
        return results, metrics, inference_time