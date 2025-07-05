# backend/test_model.py
import os
import argparse
import cv2
from utils.model_manager import ModelManager
from utils.dataset_manager import DatasetManager
from utils.evaluator import Evaluator
from utils.visualizer import Visualizer

def main():
    parser = argparse.ArgumentParser(description="测试模型、攻击和防御")
    parser.add_argument("--model", type=str, default="yolov8s-visdrone", help="模型名称")
    parser.add_argument("--dataset", type=str, default="VisDrone", help="数据集名称")
    parser.add_argument("--num_images", type=int, default=5, help="测试图像数量")
    parser.add_argument("--attack", type=str, default=None, help="攻击算法名称")
    parser.add_argument("--defense", type=str, default=None, help="防御算法名称")
    parser.add_argument("--save_dir", type=str, default="results", help="保存结果的目录")
    args = parser.parse_args()
    
    # 创建保存目录
    save_dir = os.path.join("backend", args.save_dir)
    os.makedirs(save_dir, exist_ok=True)
    
    # 加载模型
    model = ModelManager.load_yolov8_model(model_name=args.model)
    
    # 获取测试图像
    image_paths = DatasetManager.get_test_images(dataset_name=args.dataset, num_images=args.num_images)
    
    # 创建评估器和可视化器
    evaluator = Evaluator(model, save_dir=save_dir)
    visualizer = Visualizer(save_dir=save_dir)
    
    # 测试每张图片
    for i, image_path in enumerate(image_paths):
        print(f"\n测试图片 {i+1}/{len(image_paths)}: {os.path.basename(image_path)}")
        
        # 加载图像
        image, image_rgb, _ = DatasetManager.load_image(image_path)
        
        # 执行推理
        results, inference_time = evaluator.evaluate_detection(image_path, image_rgb)
        
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
        
        # 可视化检测结果
        result_image = visualizer.visualize_detection(image_path, results)
        
        # 如果指定了攻击算法
        if args.attack:
            # 导入攻击算法
            if args.attack == "pgd":
                from algorithms.attacks.pgd import PGDAttack
                attack_algo = PGDAttack(eps=8/255, alpha=2/255, steps=10)
            elif args.attack == "fgsm":
                from algorithms.attacks.fgsm import FGSMAttack
                attack_algo = FGSMAttack(eps=8/255)
            else:
                print(f"不支持的攻击算法: {args.attack}")
                continue
            
            # 评估攻击
            clean_results, adv_results, adv_image_rgb = evaluator.evaluate_attack(image_path, attack_algo)
            
            # 可视化攻击结果
            attack_comparison = visualizer.visualize_attack(image_rgb, adv_image_rgb)
            
            # 如果指定了防御算法
            if args.defense:
                # 导入防御算法
                if args.defense == "gaussian_blur":
                    from algorithms.defenses.gaussian_blur import GaussianBlurDefense
                    defense_algo = GaussianBlurDefense(kernel_size=5)
                elif args.defense == "jpeg_compression":
                    from algorithms.defenses.jpeg_compression import JPEGCompressionDefense
                    defense_algo = JPEGCompressionDefense(quality=75)
                else:
                    print(f"不支持的防御算法: {args.defense}")
                    continue
                
                # 评估防御
                clean_results, adv_results, defense_results = evaluator.evaluate_defense(
                    image_path, attack_algo, defense_algo)
                
                # 可视化防御结果
                defense_comparison = visualizer.visualize_defense(
                    image_rgb, adv_image_rgb, defense_algo(adv_image_rgb))
        
        # 显示结果图像
        cv2.imshow(f"YOLOv8 检测 - {os.path.basename(image_path)}", result_image)
        print("按任意键继续下一张图片...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    print("测试完成")

if __name__ == "__main__":
    main()