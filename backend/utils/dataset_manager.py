# backend/utils/dataset_manager.py
import os
import glob
import random
import cv2
import numpy as np
from torchvision.transforms.functional import to_tensor

class DatasetManager:
    """数据集管理器，负责加载和处理数据集"""
    
    @staticmethod
    def get_test_images(dataset_name, num_images=None, random_select=False):
        """
        获取测试图像路径
        
        参数:
            dataset_name: 数据集名称
            num_images: 要获取的图像数量，如果为None则获取所有图像
            random_select: 是否随机选择图像
            
        返回:
            图像路径列表
        """
        if dataset_name == "VisDrone":
            # VisDrone数据集路径
            dataset_dir = os.path.join("backend", "datasets", "VisDrone_Dataset")
            test_dir = os.path.join(dataset_dir, "VisDrone2019-DET-test-dev", "images")
            
            if not os.path.exists(test_dir):
                # 尝试查找其他可能的路径
                test_dir = os.path.join(dataset_dir, "images")
                if not os.path.exists(test_dir):
                    # 如果找不到测试集，使用示例图像
                    test_dir = os.path.join("backend", "drone_samples")
        else:
            # 默认使用示例图像
            test_dir = os.path.join("backend", "drone_samples")
        
        # 获取所有图像文件
        if os.path.exists(test_dir):
            image_files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            # 如果需要随机选择
            if random_select and num_images is not None and num_images < len(image_files):
                image_files = random.sample(image_files, num_images)
            # 否则取前N个
            elif num_images is not None:
                image_files = image_files[:num_images]
                
            # 生成完整路径
            image_paths = [os.path.join(test_dir, f) for f in image_files]
            return image_paths
        else:
            print(f"错误: 找不到数据集目录 {test_dir}")
            return []
    
    @staticmethod
    def load_image(image_path):
        """
        加载图像
        
        参数:
            image_path: 图像路径
            
        返回:
            原始图像, RGB图像, 图像尺寸
        """
        # 读取图像
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"无法加载图像: {image_path}")
        
        # 转换为RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 获取图像尺寸
        height, width = image.shape[:2]
        
        return image, image_rgb, (width, height)
    
    @staticmethod
    def get_annotation_path(image_path, dataset_name="VisDrone"):
        """
        获取对应的标注文件路径
        
        参数:
            image_path: 图像路径
            dataset_name: 数据集名称
            
        返回:
            标注文件路径，如果不存在则返回None
        """
        if dataset_name == "VisDrone":
            # 从图像路径中提取文件名
            image_name = os.path.basename(image_path)
            image_name_no_ext = os.path.splitext(image_name)[0]
            
            # 构建可能的标注路径
            dataset_dir = os.path.join("backend", "datasets", "VisDrone_Dataset")
            
            # 尝试不同的可能路径
            possible_paths = [
                os.path.join(dataset_dir, "VisDrone2019-DET-test-dev", "annotations", f"{image_name_no_ext}.txt"),
                os.path.join(dataset_dir, "annotations", f"{image_name_no_ext}.txt")
            ]
            
            # 检查路径是否存在
            for path in possible_paths:
                if os.path.exists(path):
                    return path
        
        return None
    
    @staticmethod
    def load_annotations(annotation_path):
        """
        加载标注数据
        
        参数:
            annotation_path: 标注文件路径
            
        返回:
            标注数据列表，每个标注为 [x, y, width, height, class_id, score]
        """
        if annotation_path is None or not os.path.exists(annotation_path):
            return []
        
        annotations = []
        
        try:
            with open(annotation_path, 'r') as f:
                for line in f:
                    parts = line.strip().split(',')
                    if len(parts) >= 6:
                        # VisDrone格式: <bbox_left>,<bbox_top>,<bbox_width>,<bbox_height>,<score>,<object_category>,<truncation>,<occlusion>
                        x, y, w, h = float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3])
                        class_id = int(parts[5]) - 1  # VisDrone类别从1开始，转换为从0开始
                        score = float(parts[4]) if float(parts[4]) <= 1.0 else float(parts[4]) / 100.0  # 确保分数在0-1之间
                        
                        annotations.append([x, y, w, h, class_id, score])
        except Exception as e:
            print(f"加载标注文件时出错: {e}")
        
        return annotations
    
    @staticmethod
    def get_class_names(dataset_name="VisDrone"):
        """
        获取数据集的类别名称
        
        参数:
            dataset_name: 数据集名称
            
        返回:
            类别名称列表
        """
        if dataset_name == "VisDrone":
            return [
                'pedestrian', 'people', 'bicycle', 'car', 'van', 
                'truck', 'tricycle', 'awning-tricycle', 'bus', 'motor'
            ]
        else:
            return []