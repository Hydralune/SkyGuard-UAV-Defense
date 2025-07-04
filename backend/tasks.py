import torch
import cv2
import os
import numpy as np
from celery_app import celery_app
from torchvision.transforms.functional import to_tensor
import torchattacks

@celery_app.task
def run_attack_task(task_id):
    """执行对抗攻击任务"""
    try:
        # --- 1. 准备工作 ---
        # 创建结果目录
        # 注意Windows下路径使用反斜杠，但Python中可以使用正斜杠
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 加载模型 (YOLOv5)
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        
        # 加载测试图片 (如果不存在，则使用YOLOv5仓库的样例图片)
        image_path = os.path.join("backend", "assets", "test_image.jpg")
        if not os.path.exists(image_path):
            # 如果没有测试图片，使用COCO数据集中的图片（通过YOLOv5仓库获取）
            image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
        print(f"Using image: {image_path}")
        
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_tensor = to_tensor(image_rgb).unsqueeze(0)  # 转换成PyTorch Tensor
        
        # --- 2. 攻击前 ---
        # 对原始图片进行检测
        results_before = model(image_rgb)
        os.makedirs(os.path.join(result_path, "result_before"), exist_ok=True)
        results_before.save(save_dir=result_path, name="result_before")  # YOLOv5自带的保存结果功能
        
        # --- 3. 执行攻击 (使用 Torchattacks) ---
        # 硬编码一个FGSM攻击
        attack = torchattacks.FGSM(model, eps=8/255)
        adv_image_tensor = attack(img_tensor, torch.tensor([0]))  # 这里的label可以随便给
        
        # --- 4. 攻击后 ---
        # 对抗样本转换回图片格式
        adv_image_np = adv_image_tensor.squeeze(0).permute(1, 2, 0).detach().cpu().numpy() * 255
        adv_image_np = cv2.cvtColor(adv_image_np.astype('uint8'), cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(result_path, "adversarial_image.jpg"), adv_image_np)
        
        # 对抗样本检测结果
        adv_image_rgb = cv2.cvtColor(adv_image_np, cv2.COLOR_BGR2RGB)
        results_after = model(adv_image_rgb)
        os.makedirs(os.path.join(result_path, "result_after"), exist_ok=True)
        results_after.save(save_dir=result_path, name="result_after")  # 保存攻击后的结果
        
        return {"status": "Completed", "result_path": result_path}
    
    except Exception as e:
        # 记录错误信息
        error_path = os.path.join("backend", "results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e

@celery_app.task
def pgd_attack_task(task_id, eps=8/255, alpha=2/255, steps=10):
    """执行PGD对抗攻击任务"""
    try:
        # --- 1. 准备工作 ---
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 加载模型
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        
        # 加载测试图片
        image_path = os.path.join("backend", "assets", "test_image.jpg")
        if not os.path.exists(image_path):
            image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
        print(f"Using image: {image_path}")
        
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_tensor = to_tensor(image_rgb).unsqueeze(0)
        
        # --- 2. 攻击前 ---
        results_before = model(image_rgb)
        os.makedirs(os.path.join(result_path, "result_before"), exist_ok=True)
        results_before.save(save_dir=result_path, name="result_before")
        
        # --- 3. 执行PGD攻击 ---
        attack = torchattacks.PGD(model, eps=eps, alpha=alpha, steps=steps)
        adv_image_tensor = attack(img_tensor, torch.tensor([0]))
        
        # --- 4. 攻击后 ---
        adv_image_np = adv_image_tensor.squeeze(0).permute(1, 2, 0).detach().cpu().numpy() * 255
        adv_image_np = cv2.cvtColor(adv_image_np.astype('uint8'), cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(result_path, "adversarial_image.jpg"), adv_image_np)
        
        adv_image_rgb = cv2.cvtColor(adv_image_np, cv2.COLOR_BGR2RGB)
        results_after = model(adv_image_rgb)
        os.makedirs(os.path.join(result_path, "result_after"), exist_ok=True)
        results_after.save(save_dir=result_path, name="result_after")
        
        # --- 5. 保存攻击参数 ---
        attack_params = {
            "method": "PGD",
            "eps": eps,
            "alpha": alpha,
            "steps": steps
        }
        with open(os.path.join(result_path, "attack_params.json"), "w") as f:
            import json
            json.dump(attack_params, f)
        
        return {"status": "Completed", "result_path": result_path}
    
    except Exception as e:
        error_path = os.path.join(result_path, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e

@celery_app.task
def environment_attack_task(task_id, attack_type="brightness", intensity=0.5):
    """执行环境干扰攻击任务"""
    try:
        # --- 1. 准备工作 ---
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 加载模型
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        
        # 加载测试图片
        image_path = os.path.join("backend", "assets", "test_image.jpg")
        if not os.path.exists(image_path):
            image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
        print(f"Using image: {image_path}")
        
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # --- 2. 攻击前 ---
        results_before = model(image_rgb)
        os.makedirs(os.path.join(result_path, "result_before"), exist_ok=True)
        results_before.save(save_dir=result_path, name="result_before")
        
        # --- 3. 执行环境干扰 ---
        if attack_type == "brightness":
            # 调整亮度
            perturbed_image = cv2.convertScaleAbs(image_rgb, alpha=1, beta=intensity * 100)
        elif attack_type == "noise":
            # 添加高斯噪声
            mean = 0
            stddev = intensity * 50
            noise = np.random.normal(mean, stddev, image_rgb.shape).astype(np.uint8)
            perturbed_image = cv2.add(image_rgb, noise)
        elif attack_type == "contrast":
            # 调整对比度
            perturbed_image = cv2.convertScaleAbs(image_rgb, alpha=1 + intensity, beta=0)
        elif attack_type == "blur":
            # 添加模糊
            kernel_size = int(intensity * 20) * 2 + 1  # 确保是奇数
            perturbed_image = cv2.GaussianBlur(image_rgb, (kernel_size, kernel_size), 0)
        else:
            raise ValueError(f"不支持的环境干扰类型: {attack_type}")
        
        # --- 4. 攻击后 ---
        perturbed_image_bgr = cv2.cvtColor(perturbed_image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(result_path, "perturbed_image.jpg"), perturbed_image_bgr)
        
        results_after = model(perturbed_image)
        os.makedirs(os.path.join(result_path, "result_after"), exist_ok=True)
        results_after.save(save_dir=result_path, name="result_after")
        
        # --- 5. 保存攻击参数 ---
        attack_params = {
            "method": f"Environment_{attack_type}",
            "intensity": intensity
        }
        with open(os.path.join(result_path, "attack_params.json"), "w") as f:
            import json
            json.dump(attack_params, f)
        
        return {"status": "Completed", "result_path": result_path}
    
    except Exception as e:
        error_path = os.path.join(result_path, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e
