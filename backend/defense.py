import torch
import cv2
import os
import numpy as np
from torchvision.transforms.functional import to_tensor
import torchvision.transforms as T

def run_defense_task(task_id, defense_type="gaussian_blur", params=None):
    """执行防御任务"""
    if params is None:
        params = {}
    
    try:
        # --- 1. 准备工作 ---
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 加载模型
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        
        # 加载测试图片和对抗样本
        # 这里假设我们已经有了对抗样本，如果没有，可以先生成
        image_path = os.path.join("backend", "assets", "test_image.jpg")
        if not os.path.exists(image_path):
            image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
        print(f"Using image: {image_path}")
        
        # 生成对抗样本
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_tensor = to_tensor(image_rgb).unsqueeze(0)
        
        # 使用FGSM攻击生成对抗样本
        import torchattacks
        attack = torchattacks.FGSM(model, eps=8/255)
        adv_image_tensor = attack(img_tensor, torch.tensor([0]))
        
        adv_image_np = adv_image_tensor.squeeze(0).permute(1, 2, 0).detach().cpu().numpy() * 255
        adv_image_rgb = adv_image_np.astype('uint8')
        
        # --- 2. 未防御的结果 ---
        results_before = model(adv_image_rgb)
        os.makedirs(os.path.join(result_path, "result_before"), exist_ok=True)
        results_before.save(save_dir=result_path, name="result_before")
        
        # 保存对抗样本
        adv_image_bgr = cv2.cvtColor(adv_image_rgb, cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(result_path, "adversarial_image.jpg"), adv_image_bgr)
        
        # --- 3. 应用防御 ---
        if defense_type == "gaussian_blur":
            # 高斯模糊
            kernel_size = params.get("kernel_size", 5)
            defended_image = cv2.GaussianBlur(adv_image_rgb, (kernel_size, kernel_size), 0)
        
        elif defense_type == "median_blur":
            # 中值滤波
            kernel_size = params.get("kernel_size", 5)
            defended_image = cv2.medianBlur(adv_image_rgb, kernel_size)
        
        elif defense_type == "jpeg_compression":
            # JPEG压缩
            quality = params.get("quality", 75)
            # 保存为JPEG然后重新加载来模拟压缩
            temp_path = os.path.join(result_path, "temp.jpg")
            cv2.imwrite(temp_path, adv_image_bgr, [cv2.IMWRITE_JPEG_QUALITY, quality])
            defended_image_bgr = cv2.imread(temp_path)
            defended_image = cv2.cvtColor(defended_image_bgr, cv2.COLOR_BGR2RGB)
            os.remove(temp_path)  # 清理临时文件
        
        elif defense_type == "bit_depth_reduction":
            # 位深度降低
            depth = params.get("depth", 5)  # 默认降到5位
            defended_image = np.floor(adv_image_rgb / (2**(8-depth))) * (2**(8-depth))
            defended_image = defended_image.astype(np.uint8)
        
        elif defense_type == "statistical_detector":
            # 统计检测防御
            from algorithms.defenses.statistical_detector import StatisticalDetectorDefense
            
            # 获取参数
            threshold = params.get("threshold", 0.6)
            purify_method = params.get("purify_method", "gaussian_blur")
            use_gradient = params.get("use_gradient", True)
            use_variance = params.get("use_variance", True)
            use_entropy = params.get("use_entropy", True)
            
            # 创建防御实例
            detector = StatisticalDetectorDefense(
                threshold=threshold,
                purify_method=purify_method,
                use_gradient=use_gradient,
                use_variance=use_variance,
                use_entropy=use_entropy
            )
            
            # 转换图像格式 (RGB -> CHW tensor)
            adv_tensor = torch.from_numpy(adv_image_rgb).permute(2, 0, 1).float() / 255.0
            adv_tensor = adv_tensor.unsqueeze(0)  # 添加batch维度
            
            # 执行检测防御
            defended_tensor, detection_info = detector.defend(adv_tensor)
            
            # 转换回RGB格式
            defended_image = (defended_tensor.squeeze(0).permute(1, 2, 0).numpy() * 255).astype(np.uint8)
            
            # 保存检测信息
            import json
            with open(os.path.join(result_path, "detection_info.json"), "w", encoding='utf-8') as f:
                json.dump(detection_info, f, indent=2, ensure_ascii=False)
            
            print(f"🔍 统计检测结果:")
            print(f"   检测到 {detection_info['purified_count']}/{detection_info['total_count']} 张对抗样本")
            print(f"   检测率: {detection_info['detection_rate']:.2%}")
            print(f"   使用净化方法: {detection_info['purify_method']}")
        
        elif defense_type == "feature_squeezing":
            # 特征压缩检测防御
            from algorithms.defenses.feature_squeezing import FeatureSqueezingDefense
            
            # 获取参数（使用前端的参数名）
            bit_depth = params.get("fs_bit_depth", 4)
            use_median_filter = params.get("fs_use_median_filter", True)
            median_window = params.get("fs_median_window", 2)
            use_non_local_means = params.get("fs_use_non_local_means", False)
            nlm_h = params.get("fs_nlm_h", 10)
            nlm_template_window = params.get("fs_nlm_template_window", 7)
            nlm_search_window = params.get("fs_nlm_search_window", 21)
            threshold = params.get("fs_threshold", 0.5)
            detection_method = params.get("fs_detection_method", "joint")
            
            # 创建防御实例
            squeezer = FeatureSqueezingDefense(
                bit_depth=bit_depth,
                use_median_filter=use_median_filter,
                median_window=median_window,
                use_non_local_means=use_non_local_means,
                nlm_h=nlm_h,
                nlm_template_window=nlm_template_window,
                nlm_search_window=nlm_search_window,
                threshold=threshold,
                detection_method=detection_method
            )
            
            # 转换图像格式 (RGB -> CHW tensor)
            adv_tensor = torch.from_numpy(adv_image_rgb).permute(2, 0, 1).float() / 255.0
            adv_tensor = adv_tensor.unsqueeze(0)  # 添加batch维度
            
            # 执行特征压缩防御
            defended_tensor, detection_info = squeezer.defend(adv_tensor, model=model)
            
            # 转换回RGB格式
            defended_image = (defended_tensor.squeeze(0).permute(1, 2, 0).numpy() * 255).astype(np.uint8)
            
            # 保存检测信息
            import json
            with open(os.path.join(result_path, "feature_squeezing_info.json"), "w", encoding='utf-8') as f:
                json.dump(detection_info, f, indent=2, ensure_ascii=False)
            
            # 保存配置摘要
            config_summary = squeezer.get_config_summary()
            with open(os.path.join(result_path, "squeezing_config.json"), "w", encoding='utf-8') as f:
                json.dump(config_summary, f, indent=2, ensure_ascii=False)
            
            print(f"🔧 特征压缩检测结果:")
            print(f"   检测到 {detection_info['adversarial_detected']}/{detection_info['total_count']} 张对抗样本")
            print(f"   检测率: {detection_info['detection_rate']:.2%}")
            print(f"   净化处理: {detection_info['purified_count']} 张图像")
            print(f"   检测方法: {detection_info['detection_method']}")
            print(f"   检测阈值: {detection_info['threshold']}")
            print(f"   位深度: {config_summary['bit_depth']} 位")
            if config_summary['use_median_filter']:
                print(f"   中值滤波: {config_summary['median_window']}x{config_summary['median_window']} 窗口")
            if config_summary['use_non_local_means']:
                print(f"   非局部均值: 启用")
        
        else:
            raise ValueError(f"不支持的防御类型: {defense_type}")
        
        # --- 4. 防御后的结果 ---
        # 保存防御后的图像
        defended_image_bgr = cv2.cvtColor(defended_image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(result_path, "defended_image.jpg"), defended_image_bgr)
        
        # 对防御后的图像进行检测
        results_after = model(defended_image)
        os.makedirs(os.path.join(result_path, "result_after"), exist_ok=True)
        results_after.save(save_dir=result_path, name="result_after")
        
        # --- 5. 保存防御参数 ---
        defense_params = {
            "method": defense_type,
            **params
        }
        with open(os.path.join(result_path, "defense_params.json"), "w") as f:
            import json
            json.dump(defense_params, f)
        
        return {"status": "Completed", "result_path": result_path}
    
    except Exception as e:
        error_path = os.path.join("backend", "results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in defense task {task_id}: {str(e)}")
        raise e 