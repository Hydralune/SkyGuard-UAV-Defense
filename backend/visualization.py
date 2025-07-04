import torch
import cv2
import os
import numpy as np
import matplotlib.pyplot as plt
from celery_app import celery_app
import torchvision.transforms as transforms
from PIL import Image

@celery_app.task
def generate_visualization(task_id, image_path=None, result_path=None):
    """生成可视化结果"""
    try:
        if result_path is None:
            result_path = os.path.join("backend", "results", task_id)
        
        os.makedirs(result_path, exist_ok=True)
        
        # 如果没有提供图像路径，使用默认图像
        if image_path is None:
            image_path = os.path.join("backend", "assets", "test_image.jpg")
            if not os.path.exists(image_path):
                image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
        # 读取原始图像
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 加载对抗样本（如果存在）
        adv_image_path = os.path.join(result_path, "adversarial_image.jpg")
        if os.path.exists(adv_image_path):
            adv_image = cv2.imread(adv_image_path)
            adv_image_rgb = cv2.cvtColor(adv_image, cv2.COLOR_BGR2RGB)
            
            # 计算差异图
            diff = np.abs(image_rgb.astype(np.float32) - adv_image_rgb.astype(np.float32))
            diff = np.clip(diff * 5, 0, 255).astype(np.uint8)  # 放大差异以便可视化
            
            # 创建热力图
            diff_gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
            heatmap = cv2.applyColorMap(diff_gray, cv2.COLORMAP_JET)
            
            # 保存差异图和热力图
            cv2.imwrite(os.path.join(result_path, "difference.jpg"), cv2.cvtColor(diff, cv2.COLOR_RGB2BGR))
            cv2.imwrite(os.path.join(result_path, "heatmap.jpg"), heatmap)
            
            # 创建对比图
            plt.figure(figsize=(15, 5))
            
            plt.subplot(1, 3, 1)
            plt.imshow(image_rgb)
            plt.title("Original Image")
            plt.axis('off')
            
            plt.subplot(1, 3, 2)
            plt.imshow(adv_image_rgb)
            plt.title("Adversarial Image")
            plt.axis('off')
            
            plt.subplot(1, 3, 3)
            plt.imshow(cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB))
            plt.title("Perturbation Heatmap")
            plt.axis('off')
            
            plt.tight_layout()
            plt.savefig(os.path.join(result_path, "comparison.jpg"))
            plt.close()
        
        # 检查是否存在防御后的图像
        defended_image_path = os.path.join(result_path, "defended_image.jpg")
        if os.path.exists(defended_image_path):
            defended_image = cv2.imread(defended_image_path)
            defended_image_rgb = cv2.cvtColor(defended_image, cv2.COLOR_BGR2RGB)
            
            # 创建对比图（原始、对抗、防御后）
            plt.figure(figsize=(15, 5))
            
            plt.subplot(1, 3, 1)
            plt.imshow(image_rgb)
            plt.title("Original Image")
            plt.axis('off')
            
            plt.subplot(1, 3, 2)
            plt.imshow(adv_image_rgb)
            plt.title("Adversarial Image")
            plt.axis('off')
            
            plt.subplot(1, 3, 3)
            plt.imshow(defended_image_rgb)
            plt.title("Defended Image")
            plt.axis('off')
            
            plt.tight_layout()
            plt.savefig(os.path.join(result_path, "defense_comparison.jpg"))
            plt.close()
        
        return {
            "status": "Completed",
            "visualization_path": result_path
        }
    
    except Exception as e:
        error_path = os.path.join(result_path, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(f"Visualization error: {str(e)}")
        print(f"Error in visualization task: {str(e)}")
        raise e 