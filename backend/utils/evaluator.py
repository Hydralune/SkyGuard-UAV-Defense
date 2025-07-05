# backend/utils/evaluator.py
import os
import time
import json
import numpy as np
import torch
import cv2

class Evaluator:
    """评估器，负责评估模型性能"""
    
    def __init__(self, model, save_dir=None):
        """
        初始化评估器
        
        参数:
            model: 要评估的模型
            save_dir: 保存结果的目录
        """
        self.model = model
        self.save_dir = save_dir
        if save_dir and not os.path.exists(save_dir):
            os.makedirs(save_dir, exist_ok=True)
    
    def evaluate_detection(self, image_path, image_rgb=None, save_results=True):
        """
        评估目标检测性能
        
        参数:
            image_path: 图像路径
            image_rgb: 预加载的RGB图像（可选）
            save_results: 是否保存结果
            
        返回:
            检测结果，推理时间
        """
        # 如果没有提供RGB图像，则加载图像
        if image_rgb is None:
            image = cv2.imread(image_path)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 执行推理并计时
        start_time = time.time()
        results = self.model.predict(image_rgb)
        inference_time = time.time() - start_time
        
        # 如果需要保存结果
        if save_results and self.save_dir:
            # 创建保存目录
            os.makedirs(os.path.join(self.save_dir, "results"), exist_ok=True)
            
            # 保存结果图像
            result_image = results[0].plot()
            image_name = os.path.basename(image_path)
            cv2.imwrite(os.path.join(self.save_dir, "results", image_name), result_image)
        
        return results, inference_time
    
    def evaluate_attack(self, image_path, attack_algo, save_results=True):
        """
        评估攻击算法
        
        参数:
            image_path: 图像路径
            attack_algo: 攻击算法实例
            save_results: 是否保存结果
            
        返回:
            原始检测结果，攻击后检测结果，对抗样本
        """
        from utils.dataset_manager import DatasetManager
        
        # 加载图像
        _, image_rgb, img_tensor = DatasetManager.load_image(image_path)
        
        # 在原始图像上进行检测
        clean_results, _ = self.evaluate_detection(image_path, image_rgb, save_results)
        
        # 执行攻击
        adv_image_tensor = attack_algo(self.model, img_tensor)
        
        # 将对抗样本转换回图像格式
        adv_image_np = adv_image_tensor.squeeze(0).permute(1, 2, 0).detach().cpu().numpy() * 255
        adv_image_rgb = adv_image_np.astype('uint8')
        
        # 在对抗样本上进行检测
        adv_results = self.model(adv_image_rgb)
        
        # 如果需要保存结果
        if save_results and self.save_dir:
            # 保存对抗样本
            adv_image_bgr = cv2.cvtColor(adv_image_rgb, cv2.COLOR_RGB2BGR)
            image_name = os.path.basename(image_path)
            adv_image_path = os.path.join(self.save_dir, "adversarial_" + image_name)
            cv2.imwrite(adv_image_path, adv_image_bgr)
            
            # 保存对抗样本检测结果
            adv_result_image = adv_results[0].plot()
            cv2.imwrite(os.path.join(self.save_dir, "results", "adv_" + image_name), adv_result_image)
        
        return clean_results, adv_results, adv_image_rgb
    
    def evaluate_defense(self, image_path, attack_algo, defense_algo, save_results=True):
        """
        评估防御算法
        
        参数:
            image_path: 图像路径
            attack_algo: 攻击算法实例
            defense_algo: 防御算法实例
            save_results: 是否保存结果
            
        返回:
            原始检测结果，攻击后检测结果，防御后检测结果
        """
        # 评估攻击
        clean_results, adv_results, adv_image_rgb = self.evaluate_attack(image_path, attack_algo, save_results)
        
        # 应用防御
        defended_image = defense_algo(adv_image_rgb)
        
        # 在防御后的图像上进行检测
        defense_results = self.model(defended_image)
        
        # 如果需要保存结果
        if save_results and self.save_dir:
            # 保存防御后的图像
            defended_image_bgr = cv2.cvtColor(defended_image, cv2.COLOR_RGB2BGR)
            image_name = os.path.basename(image_path)
            defended_image_path = os.path.join(self.save_dir, "defended_" + image_name)
            cv2.imwrite(defended_image_path, defended_image_bgr)
            
            # 保存防御后的检测结果
            defense_result_image = defense_results[0].plot()
            cv2.imwrite(os.path.join(self.save_dir, "results", "def_" + image_name), defense_result_image)
        
        return clean_results, adv_results, defense_results