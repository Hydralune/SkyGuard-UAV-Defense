# backend/utils/dataset_manager.py
import os
import glob
import random
import cv2
from torchvision.transforms.functional import to_tensor

class DatasetManager:
    """数据集管理器，负责加载和处理数据集"""
    
    @staticmethod
    def get_test_images(dataset_name="VisDrone", num_images=5, random_select=True):
        """
        获取测试图像
        
        参数:
            dataset_name: 数据集名称
            num_images: 要返回的图像数量
            random_select: 是否随机选择图像
            
        返回:
            图像路径列表
        """
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 默认图片路径，如果找不到数据集
        default_image = os.path.join(current_dir, 'drone_samples', 'drone_sample_3.jpg')
        
        if dataset_name == "VisDrone":
            visdrone_dir = os.path.join(current_dir, 'datasets', 'VisDrone_Dataset')
            val_images_dir = os.path.join(visdrone_dir, 'VisDrone2019-DET-val', 'images')
            
            if os.path.exists(val_images_dir):
                # 获取验证集中的所有图片
                image_files = glob.glob(os.path.join(val_images_dir, '*.jpg'))
                
                if image_files:
                    print(f"找到 {len(image_files)} 张{dataset_name}验证集图片")
                    
                    if random_select:
                        # 随机选择指定数量的图片
                        num_test_images = min(num_images, len(image_files))
                        return random.sample(image_files, num_test_images)
                    else:
                        # 返回前N张图片
                        return image_files[:min(num_images, len(image_files))]
        
        # 如果找不到数据集或图像，返回默认图像
        print(f"未找到{dataset_name}数据集图像，使用默认图片")
        return [default_image]
    
    @staticmethod
    def load_image(image_path):
        """
        加载图像
        
        参数:
            image_path: 图像路径
            
        返回:
            原始图像，RGB图像和张量
        """
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_tensor = to_tensor(image_rgb).unsqueeze(0)
        
        return image, image_rgb, img_tensor