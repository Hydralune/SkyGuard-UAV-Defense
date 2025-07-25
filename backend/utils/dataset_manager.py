# backend/utils/dataset_manager.py
import os
import glob
import random
import cv2
import numpy as np
from torchvision.transforms.functional import to_tensor

from .config_manager import ConfigManager

class DatasetManager:
    """数据集管理器，负责加载和处理数据集"""
    
    @staticmethod
    def get_test_images(dataset_name, num_images=None, random_select=False):
        """
        获取测试图像路径
        
        参数:
            dataset_name: 数据集名称（支持别名）
            num_images: 要获取的图像数量，如果为None则获取所有图像
            random_select: 是否随机选择图像
            
        返回:
            图像路径列表
        """
        print(f"DatasetManager.get_test_images: 获取数据集 {dataset_name} 的测试图像")
        print(f"当前工作目录: {os.getcwd()}")
        
        # 通过配置管理器获取数据集路径
        test_dir = ConfigManager.get_dataset_path(dataset_name, "test")
        print(f"ConfigManager返回的测试集路径: {test_dir}")
        
        # 修复可能的路径问题
        if test_dir and "backend/backend" in test_dir:
            fixed_test_dir = test_dir.replace("backend/backend", "backend")
            print(f"修复后的测试集路径: {fixed_test_dir}")
            test_dir = fixed_test_dir
        
        if test_dir is None:
            print(f"错误: 找不到数据集 {dataset_name} 的配置路径")
            # 尝试常见路径
            common_paths = [
                os.path.join(os.getcwd(), "backend", "datasets", "VisDrone_Dataset", "VisDrone2019-DET-test-dev", "images"),
                os.path.join(os.getcwd(), "datasets", "VisDrone_Dataset", "VisDrone2019-DET-test-dev", "images"),
                "/root/projects/SkyGuard-UAV-Defense/backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images",
                "/root/projects/SkyGuard-UAV-Defense/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images"
            ]
            
            for path in common_paths:
                if os.path.exists(path):
                    print(f"找到可用的测试集路径: {path}")
                    test_dir = path
                    break
            
            if test_dir is None:
                return []
            
        # 获取所有图像文件
        if os.path.exists(test_dir):
            print(f"测试集目录存在: {test_dir}")
            image_files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            print(f"找到 {len(image_files)} 个图像文件")
            if not image_files:
                print(f"警告: 数据集目录 {test_dir} 中没有找到图像文件")
                return []
                
            # 如果需要随机选择
            if random_select and num_images is not None and num_images < len(image_files):
                image_files = random.sample(image_files, num_images)
                print(f"随机选择了 {len(image_files)} 个图像文件")
            # 否则取前N个
            elif num_images is not None and num_images > 0:
                image_files = image_files[:num_images]
                print(f"选择了前 {len(image_files)} 个图像文件")
                
            # 生成完整路径
            image_paths = [os.path.join(test_dir, f) for f in image_files]
            
            # 验证路径是否存在
            valid_paths = []
            for path in image_paths:
                if os.path.exists(path):
                    valid_paths.append(path)
                else:
                    print(f"警告: 图像文件不存在: {path}")
            
            print(f"返回 {len(valid_paths)} 个有效的图像路径")
            return valid_paths
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
        # 从图像路径中提取文件名
        image_name = os.path.basename(image_path)
        image_name_no_ext = os.path.splitext(image_name)[0]
        
        # 获取标注目录
        anno_dir = ConfigManager.get_dataset_annotation_path(dataset_name, "test")
        
        if anno_dir:
            anno_path = os.path.join(anno_dir, f"{image_name_no_ext}.txt")
            if os.path.exists(anno_path):
                return anno_path
        
        # 回退到旧的逻辑
        if dataset_name == "VisDrone":
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
        return ConfigManager.get_dataset_classes(dataset_name)