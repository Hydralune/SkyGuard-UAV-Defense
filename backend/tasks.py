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
        adv_image_np = cv2.cvtColor(adv_image_np.astype('uint8'), cv2.COLOR_BGR2RGB)
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
