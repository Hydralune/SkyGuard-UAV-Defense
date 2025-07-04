import os
import torch
import cv2
import numpy as np
from celery_app import celery_app
import json
import torchvision.transforms as transforms
from torchvision.transforms.functional import to_tensor
import torchattacks

@celery_app.task
def evaluate_defense_task(task_id, model_path=None, dataset_path=None, defense_type=None):
    """评估防御效果的任务"""
    try:
        # 创建结果目录
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 如果没有提供模型路径，使用默认YOLOv5模型
        if model_path is None:
            model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        else:
            # 加载自定义模型
            model = torch.load(model_path)
            model.eval()
        
        # 如果没有提供数据集路径，使用测试图像
        if dataset_path is None:
            # 使用单张测试图像
            image_path = os.path.join("backend", "assets", "test_image.jpg")
            if not os.path.exists(image_path):
                image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
            
            images = [image_path]
        else:
            # 使用数据集中的所有图像
            images = []
            for root, _, files in os.walk(dataset_path):
                for file in files:
                    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                        images.append(os.path.join(root, file))
        
        # 评估结果
        results = {
            "clean_accuracy": 0.0,
            "adversarial_accuracy": 0.0,
            "defense_accuracy": 0.0,
            "images_tested": len(images),
            "defense_type": defense_type
        }
        
        # 对每张图像进行评估
        clean_detections = 0
        adv_detections = 0
        defense_detections = 0
        
        for img_path in images:
            # 加载图像
            image = cv2.imread(img_path)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            img_tensor = to_tensor(image_rgb).unsqueeze(0)
            
            # 在原始图像上进行检测
            clean_results = model(image_rgb)
            if len(clean_results.pred[0]) > 0:  # 如果检测到了物体
                clean_detections += 1
            
            # 生成对抗样本
            attack = torchattacks.FGSM(model, eps=8/255)
            adv_image_tensor = attack(img_tensor, torch.tensor([0]))
            
            # 将对抗样本转换回图像格式
            adv_image_np = adv_image_tensor.squeeze(0).permute(1, 2, 0).detach().cpu().numpy() * 255
            adv_image_rgb = adv_image_np.astype('uint8')
            
            # 在对抗样本上进行检测
            adv_results = model(adv_image_rgb)
            if len(adv_results.pred[0]) > 0:  # 如果检测到了物体
                adv_detections += 1
            
            # 如果指定了防御类型，应用防御
            if defense_type:
                if defense_type == "gaussian_blur":
                    defended_image = cv2.GaussianBlur(adv_image_rgb, (5, 5), 0)
                elif defense_type == "median_blur":
                    defended_image = cv2.medianBlur(adv_image_rgb, 5)
                elif defense_type == "jpeg_compression":
                    # 保存为JPEG然后重新加载来模拟压缩
                    temp_path = os.path.join(result_path, "temp.jpg")
                    cv2.imwrite(temp_path, cv2.cvtColor(adv_image_rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 75])
                    defended_image_bgr = cv2.imread(temp_path)
                    defended_image = cv2.cvtColor(defended_image_bgr, cv2.COLOR_BGR2RGB)
                    os.remove(temp_path)  # 清理临时文件
                else:
                    # 默认不应用防御
                    defended_image = adv_image_rgb
                
                # 在防御后的图像上进行检测
                defense_results = model(defended_image)
                if len(defense_results.pred[0]) > 0:  # 如果检测到了物体
                    defense_detections += 1
        
        # 计算准确率
        results["clean_accuracy"] = clean_detections / len(images) if images else 0
        results["adversarial_accuracy"] = adv_detections / len(images) if images else 0
        if defense_type:
            results["defense_accuracy"] = defense_detections / len(images) if images else 0
        
        # 保存评估结果
        with open(os.path.join(result_path, "evaluation_results.json"), "w") as f:
            json.dump(results, f, indent=4)
        
        return {
            "status": "Completed",
            "results": results
        }
    
    except Exception as e:
        error_path = os.path.join(result_path, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in evaluation task {task_id}: {str(e)}")
        raise e 