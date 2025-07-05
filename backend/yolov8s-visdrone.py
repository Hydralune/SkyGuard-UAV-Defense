from ultralytics import YOLO
import torch
import os
import cv2
import functools
import glob
import random
import time

# Use absolute path to the model file
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'yolov8s-visdrone', 'best.pt')

print(f"Looking for model at: {model_path}")
if not os.path.exists(model_path):
    print(f"Model not found at {model_path}, please ensure the model file exists")
    exit(1)

# Patch torch.load to use weights_only=False
original_torch_load = torch.load

def patched_torch_load(f, *args, **kwargs):
    # Force weights_only to False to allow loading the model
    kwargs['weights_only'] = False
    print("Loading with weights_only=False")
    return original_torch_load(f, *args, **kwargs)

# Apply the patch
torch.load = patched_torch_load

try:
    # Now load the model with our patched function
    print("Loading model...")
    model = YOLO(model_path)
    
    # set model parameters
    model.overrides['conf'] = 0.25  # NMS confidence threshold
    model.overrides['iou'] = 0.45  # NMS IoU threshold
    model.overrides['agnostic_nms'] = False  # NMS class-agnostic
    model.overrides['max_det'] = 1000  # maximum number of detections per image

    # 默认图片路径
    default_image = 'C:/Users/Ylon/Desktop/SkyGuard-UAV-Defense/backend/drone_samples/drone_sample_3.jpg'
    
    # 检查VisDrone数据集
    visdrone_dir = os.path.join(current_dir, 'datasets', 'VisDrone_Dataset')
    val_images_dir = os.path.join(visdrone_dir, 'VisDrone2019-DET-val', 'images')
    
    if os.path.exists(val_images_dir):
        # 获取验证集中的所有图片
        image_files = glob.glob(os.path.join(val_images_dir, '*.jpg'))
        
        if image_files:
            print(f"找到 {len(image_files)} 张VisDrone验证集图片")
            
            # 随机选择5张图片进行测试（如果图片数量少于5，则测试全部）
            num_test_images = min(5, len(image_files))
            test_images = random.sample(image_files, num_test_images)
            
            print(f"将测试 {num_test_images} 张随机选择的图片")
            
            # 测试每张图片
            for i, image_path in enumerate(test_images):
                print(f"\n测试图片 {i+1}/{num_test_images}: {os.path.basename(image_path)}")
                
                # 执行推理
                start_time = time.time()
                results = model.predict(image_path)
                inference_time = time.time() - start_time
                
                # 显示结果
                boxes = results[0].boxes
                print(f"检测结果: 找到 {len(boxes)} 个目标，耗时 {inference_time:.2f} 秒")
                
                if len(boxes) == 0:
                    print("未检测到任何目标")
                else:
                    # 打印类别名称和置信度分数
                    for j, box in enumerate(boxes):
                        if j < 10:  # 只显示前10个检测结果
                            cls_id = int(box.cls[0].item())
                            conf = box.conf[0].item()
                            class_name = model.names[cls_id]
                            print(f"  {j+1}. {class_name}: {conf:.2f}")
                    if len(boxes) > 10:
                        print(f"  ... 以及 {len(boxes)-10} 个更多目标")
                
                # 显示结果图像
                result_image = results[0].plot()
                cv2.imshow(f"YOLOv8 VisDrone 检测 - {os.path.basename(image_path)}", result_image)
                print("按任意键继续下一张图片...")
                cv2.waitKey(0)
                cv2.destroyAllWindows()
        else:
            print("未找到VisDrone验证集图片，使用默认图片")
            # 使用默认图片
            image = default_image
            results = model.predict(image)
            result_image = results[0].plot()
            cv2.imshow("YOLOv8 VisDrone Detection", result_image)
            cv2.waitKey(0)
            cv2.destroyAllWindows()
    else:
        print(f"VisDrone验证集目录不存在: {val_images_dir}")
        print("使用默认图片")
        # 使用默认图片
        image = default_image
        results = model.predict(image)
        result_image = results[0].plot()
        cv2.imshow("YOLOv8 VisDrone Detection", result_image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    print("测试完成")
    
finally:
    # Restore the original torch.load function
    torch.load = original_torch_load