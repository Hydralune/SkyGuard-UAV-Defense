# backend/utils/visualizer.py
import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

class Visualizer:
    """可视化器，负责生成可视化结果"""
    
    def __init__(self, save_dir=None):
        """
        初始化可视化器
        
        参数:
            save_dir: 保存结果的目录
        """
        self.save_dir = save_dir
        if save_dir and not os.path.exists(save_dir):
            os.makedirs(save_dir, exist_ok=True)
    
    def visualize_detection(self, image_path, results, save_name="detection_result.jpg"):
        """
        可视化检测结果
        
        参数:
            image_path: 图像路径
            results: 检测结果
            save_name: 保存文件名
            
        返回:
            可视化图像
        """
        # 使用YOLO的内置可视化
        result_image = results[0].plot()
        
        # 如果需要保存结果
        if self.save_dir:
            cv2.imwrite(os.path.join(self.save_dir, save_name), result_image)
        
        return result_image
    
    def visualize_attack(self, original_image, adv_image, save_name="attack_comparison.jpg"):
        """
        可视化攻击结果
        
        参数:
            original_image: 原始图像
            adv_image: 对抗样本
            save_name: 保存文件名
            
        返回:
            可视化图像
        """
        # 确保输入是RGB格式
        if isinstance(original_image, str):
            original_image = cv2.imread(original_image)
            original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
        
        if isinstance(adv_image, str):
            adv_image = cv2.imread(adv_image)
            adv_image = cv2.cvtColor(adv_image, cv2.COLOR_BGR2RGB)
        
        # 计算差异图
        diff = np.abs(original_image.astype(np.float32) - adv_image.astype(np.float32))
        diff = np.clip(diff * 5, 0, 255).astype(np.uint8)  # 放大差异以便可视化
        
        # 创建热力图
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
        heatmap = cv2.applyColorMap(diff_gray, cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # 创建对比图
        fig = Figure(figsize=(15, 5))
        canvas = FigureCanvas(fig)
        
        ax1 = fig.add_subplot(1, 3, 1)
        ax1.imshow(original_image)
        ax1.set_title("Original Image")
        ax1.axis('off')
        
        ax2 = fig.add_subplot(1, 3, 2)
        ax2.imshow(adv_image)
        ax2.set_title("Adversarial Image")
        ax2.axis('off')
        
        ax3 = fig.add_subplot(1, 3, 3)
        ax3.imshow(heatmap_rgb)
        ax3.set_title("Perturbation Heatmap")
        ax3.axis('off')
        
        fig.tight_layout()
        
        # 如果需要保存结果
        if self.save_dir:
            # 保存差异图和热力图
            cv2.imwrite(os.path.join(self.save_dir, "difference.jpg"), cv2.cvtColor(diff, cv2.COLOR_RGB2BGR))
            cv2.imwrite(os.path.join(self.save_dir, "heatmap.jpg"), heatmap)
            
            # 保存对比图
            fig.savefig(os.path.join(self.save_dir, save_name))
        
        # 转换为OpenCV格式
        canvas.draw()
        comparison = np.array(canvas.renderer.buffer_rgba())
        comparison = cv2.cvtColor(comparison, cv2.COLOR_RGBA2BGR)
        
        return comparison
    
    def visualize_defense(self, original_image, adv_image, defended_image, save_name="defense_comparison.jpg"):
        """
        可视化防御结果
        
        参数:
            original_image: 原始图像
            adv_image: 对抗样本
            defended_image: 防御后的图像
            save_name: 保存文件名
            
        返回:
            可视化图像
        """
        # 确保输入是RGB格式
        if isinstance(original_image, str):
            original_image = cv2.imread(original_image)
            original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
        
        if isinstance(adv_image, str):
            adv_image = cv2.imread(adv_image)
            adv_image = cv2.cvtColor(adv_image, cv2.COLOR_BGR2RGB)
        
        if isinstance(defended_image, str):
            defended_image = cv2.imread(defended_image)
            defended_image = cv2.cvtColor(defended_image, cv2.COLOR_BGR2RGB)
        
        # 创建对比图
        fig = Figure(figsize=(15, 5))
        canvas = FigureCanvas(fig)
        
        ax1 = fig.add_subplot(1, 3, 1)
        ax1.imshow(original_image)
        ax1.set_title("Original Image")
        ax1.axis('off')
        
        ax2 = fig.add_subplot(1, 3, 2)
        ax2.imshow(adv_image)
        ax2.set_title("Adversarial Image")
        ax2.axis('off')
        
        ax3 = fig.add_subplot(1, 3, 3)
        ax3.imshow(defended_image)
        ax3.set_title("Defended Image")
        ax3.axis('off')
        
        fig.tight_layout()
        
        # 如果需要保存结果
        if self.save_dir:
            fig.savefig(os.path.join(self.save_dir, save_name))
        
        # 转换为OpenCV格式
        canvas.draw()
        comparison = np.array(canvas.renderer.buffer_rgba())
        comparison = cv2.cvtColor(comparison, cv2.COLOR_RGBA2BGR)
        
        return comparison