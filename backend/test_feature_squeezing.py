#!/usr/bin/env python3
"""
特征压缩防御算法测试脚本

演示如何使用特征压缩防御算法检测和净化对抗样本
"""

import torch
import numpy as np
import cv2
import os
import sys

# 添加算法路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from algorithms.defenses.feature_squeezing import FeatureSqueezingDefense

def create_test_image(size=(224, 224)):
    """创建测试图像"""
    # 创建一个简单的测试图像
    image = np.random.rand(*size, 3).astype(np.float32)
    
    # 添加一些结构化内容
    # 添加矩形
    image[50:150, 50:150] = [1.0, 0.0, 0.0]  # 红色矩形
    image[100:200, 100:200] = [0.0, 1.0, 0.0]  # 绿色矩形
    
    return image

def create_adversarial_example(clean_image, noise_level=0.1):
    """创建模拟对抗样本"""
    # 添加随机噪声模拟对抗扰动
    noise = np.random.normal(0, noise_level, clean_image.shape).astype(np.float32)
    adversarial = np.clip(clean_image + noise, 0, 1)
    return adversarial

def dummy_model(x):
    """虚拟模型 - 用于演示"""
    # 简单的分类器：基于图像的平均颜色进行分类
    batch_size = x.shape[0]
    
    # 计算每个通道的平均值
    mean_values = torch.mean(x.view(batch_size, 3, -1), dim=2)
    
    # 创建虚拟的10类分类结果
    logits = torch.zeros(batch_size, 10)
    for i in range(batch_size):
        # 基于RGB均值创建不同的分类结果
        r, g, b = mean_values[i]
        logits[i, 0] = r * 10
        logits[i, 1] = g * 10
        logits[i, 2] = b * 10
        logits[i, 3] = (r + g) * 5
        logits[i, 4] = (g + b) * 5
        logits[i, 5] = (r + b) * 5
        logits[i, 6] = (r + g + b) * 3
        logits[i, 7] = abs(r - g) * 8
        logits[i, 8] = abs(g - b) * 8
        logits[i, 9] = abs(r - b) * 8
    
    return logits

def test_feature_squeezing():
    """测试特征压缩防御"""
    print("🔧 特征压缩防御算法测试")
    print("=" * 50)
    
    # 创建测试数据
    print("1. 创建测试数据...")
    clean_image = create_test_image()
    adversarial_image = create_adversarial_example(clean_image, noise_level=0.15)
    
    # 转换为tensor
    clean_tensor = torch.from_numpy(clean_image).permute(2, 0, 1).unsqueeze(0)
    adv_tensor = torch.from_numpy(adversarial_image).permute(2, 0, 1).unsqueeze(0)
    
    print(f"   清洁图像形状: {clean_tensor.shape}")
    print(f"   对抗图像形状: {adv_tensor.shape}")
    
    # 测试不同的特征压缩配置
    configs = [
        {
            'name': '仅位深度压缩',
            'bit_depth': 4,
            'use_median_filter': False,
            'use_non_local_means': False,
            'detection_method': 'bit_depth',
            'threshold': 0.3
        },
        {
            'name': '仅中值滤波',
            'bit_depth': 8,
            'use_median_filter': True,
            'median_window': 3,
            'use_non_local_means': False,
            'detection_method': 'median',
            'threshold': 0.3
        },
        {
            'name': '联合检测',
            'bit_depth': 4,
            'use_median_filter': True,
            'median_window': 2,
            'use_non_local_means': False,
            'detection_method': 'joint',
            'threshold': 0.5
        }
    ]
    
    for i, config in enumerate(configs, 1):
        print(f"\n{i+1}. 测试配置: {config['name']}")
        print("-" * 30)
        
        # 创建防御实例
        squeezer = FeatureSqueezingDefense(**config)
        
        # 测试清洁图像
        print("   测试清洁图像:")
        clean_detection = squeezer.detect_adversarial(dummy_model, clean_tensor)
        print(f"     检测结果: {'对抗样本' if clean_detection['is_adversarial'] else '正常图像'}")
        print(f"     置信度: {clean_detection['confidence']:.4f}")
        print(f"     各方法得分: {clean_detection['method_scores']}")
        
        # 测试对抗样本
        print("   测试对抗样本:")
        adv_detection = squeezer.detect_adversarial(dummy_model, adv_tensor)
        print(f"     检测结果: {'对抗样本' if adv_detection['is_adversarial'] else '正常图像'}")
        print(f"     置信度: {adv_detection['confidence']:.4f}")
        print(f"     各方法得分: {adv_detection['method_scores']}")
        
        # 执行完整防御
        print("   执行完整防御:")
        test_batch = torch.cat([clean_tensor, adv_tensor], dim=0)
        defended_images, defense_info = squeezer.defend(test_batch, model=dummy_model)
        
        print(f"     总图像数: {defense_info['total_count']}")
        print(f"     检测到对抗样本: {defense_info['adversarial_detected']}")
        print(f"     净化处理: {defense_info['purified_count']}")
        print(f"     检测率: {defense_info['detection_rate']:.2%}")
    
    # 演示不同压缩方法的效果
    print(f"\n{len(configs)+2}. 压缩方法效果演示")
    print("-" * 30)
    
    squeezer = FeatureSqueezingDefense()
    
    # 位深度压缩
    print("   位深度压缩效果:")
    for bit_depth in [1, 2, 4, 6, 8]:
        squeezer.bit_depth = bit_depth
        compressed = squeezer.bit_depth_squeezing(adv_tensor)
        diff = torch.mean(torch.abs(compressed - adv_tensor)).item()
        print(f"     {bit_depth}位: 平均差异 = {diff:.4f}")
    
    # 中值滤波
    print("   中值滤波效果:")
    for window_size in [2, 3, 5, 7]:
        squeezer.median_window = window_size
        filtered = squeezer.median_filter_squeezing(adv_tensor)
        diff = torch.mean(torch.abs(filtered - adv_tensor)).item()
        print(f"     {window_size}x{window_size}窗口: 平均差异 = {diff:.4f}")
    
    print(f"\n✅ 测试完成！")
    print("\n📊 总结:")
    print("• 特征压缩通过比较原始图像和压缩图像的预测差异来检测对抗样本")
    print("• 位深度压缩对噪声型对抗样本效果较好")
    print("• 中值滤波对椒盐噪声型攻击效果显著")
    print("• 联合检测可以提高整体检测率")
    print("• 压缩程度越大，对图像的改变越明显，但检测能力也越强")

def save_demo_images():
    """保存演示图像"""
    print("\n💾 保存演示图像...")
    
    # 创建输出目录
    output_dir = "demo_images"
    os.makedirs(output_dir, exist_ok=True)
    
    # 创建测试图像
    clean_image = create_test_image()
    adversarial_image = create_adversarial_example(clean_image, noise_level=0.2)
    
    # 转换为tensor
    clean_tensor = torch.from_numpy(clean_image).permute(2, 0, 1).unsqueeze(0)
    adv_tensor = torch.from_numpy(adversarial_image).permute(2, 0, 1).unsqueeze(0)
    
    # 创建压缩器
    squeezer = FeatureSqueezingDefense(bit_depth=4, use_median_filter=True, median_window=3)
    
    # 应用不同的压缩方法
    bit_compressed = squeezer.bit_depth_squeezing(adv_tensor)
    median_filtered = squeezer.median_filter_squeezing(adv_tensor)
    
    # 保存图像
    def save_tensor_as_image(tensor, filename):
        img_np = tensor.squeeze(0).permute(1, 2, 0).numpy()
        img_np = (img_np * 255).astype(np.uint8)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(output_dir, filename), img_bgr)
    
    save_tensor_as_image(clean_tensor, "1_clean_image.jpg")
    save_tensor_as_image(adv_tensor, "2_adversarial_image.jpg")
    save_tensor_as_image(bit_compressed, "3_bit_depth_compressed.jpg")
    save_tensor_as_image(median_filtered, "4_median_filtered.jpg")
    
    print(f"   演示图像已保存到 {output_dir}/ 目录")
    print("   包含: 清洁图像、对抗样本、位深度压缩、中值滤波结果")

if __name__ == "__main__":
    try:
        test_feature_squeezing()
        save_demo_images()
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()