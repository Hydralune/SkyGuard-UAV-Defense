# backend/tasks.py 中添加的新任务
import torch
import cv2
import os
import numpy as np
from backend.celery_app import celery_app
from backend.evaluate_adversarial import AdversarialEvaluator, parse_fraction  
from algorithms.attacks.pgd import PGDAttack  
from algorithms.attacks.fgsm import FGSMAttack  # 新增导入
from utils.model_manager import ModelManager  
from utils.dataset_manager import DatasetManager  
import importlib, inspect
from algorithms.attacks.base import BaseAttack  # 用于类型检查

def test_model_task(task_id, model_name="yolov8s-visdrone", dataset_name="VisDrone", num_images=-1, conf_threshold=0.25, iou_threshold=0.5):
    """在后台评估模型原始性能（参考 backend/evaluate_model.py）"""
    try:
        from backend.evaluate_model import EnhancedEvaluator  # 延迟导入避免循环

        # 1. 结果目录
        result_path = os.path.join("backend", "evaluation_results", task_id)
        os.makedirs(result_path, exist_ok=True)

        # 2. 加载模型
        model = ModelManager.load_yolov8_model(model_name=model_name)
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold

        # 3. 获取测试图像
        image_paths = DatasetManager.get_test_images(
            dataset_name=dataset_name,
            num_images=(num_images if num_images != -1 else None),
            random_select=(num_images is not None and num_images != -1)
        )
        if not image_paths:
            raise ValueError(f"未找到 {dataset_name} 数据集图像，请检查数据集目录是否存在")

        # 4. 创建评估器并执行评估
        evaluator = EnhancedEvaluator(
            model=model,
            save_dir=result_path,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )
        evaluator.evaluate_dataset(image_paths)

        return {
            "status": "Completed",
            "result_path": result_path,
            "num_images_tested": len(image_paths)
        }

    except Exception as e:
        error_path = os.path.join("backend", "evaluation_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e

def _load_attack_by_name(name: str, **kwargs):
    """根据名称动态加载 algorithms.attacks.<name>.py 中的攻击类并实例化。
    如果传入的 kwargs 参数不被目标类接受，会自动过滤掉。"""
    module_name = f"algorithms.attacks.{name.lower()}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as e:
        raise ValueError(f"Unsupported attack algorithm: {name}. Expected file backend/{module_name.replace('.', '/')} .py") from e

    # 查找 BaseAttack 的子类
    for attr in dir(module):
        obj = getattr(module, attr)
        if isinstance(obj, type) and issubclass(obj, BaseAttack) and obj is not BaseAttack:
            try:
                # 直接尝试实例化
                return obj(**kwargs)
            except TypeError:
                # 过滤不兼容的 kwargs 再尝试一次
                sig = inspect.signature(obj.__init__)
                filtered_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters}
                return obj(**filtered_kwargs)

    raise ValueError(f"No attack class found in module {module_name}")

@celery_app.task(name="attack.pgd_dataset", bind=True)
def pgd_dataset_attack_task(self, task_id, attack_name="pgd", num_images=-1, eps="8/255", alpha="2/255", steps=10, conf_threshold=0.25, iou_threshold=0.5):
    """通用数据集级对抗评估任务，可通过 attack_name 指定算法 (默认 pgd)"""
    try:
        # 1. 结果目录
        save_dir = os.path.join("backend", "adversarial_results", task_id)
        os.makedirs(save_dir, exist_ok=True)

        # 2. 加载模型 (YOLOv8s)
        model = ModelManager.load_yolov8_model(model_name="yolov8s-visdrone")
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold

        # 3. 解析攻击参数并动态创建攻击实例
        eps_val = parse_fraction(str(eps))
        alpha_val = parse_fraction(str(alpha))
        attack = _load_attack_by_name(attack_name, eps=eps_val, alpha=alpha_val, steps=steps)

        # 4. 获取数据集图像
        image_paths = DatasetManager.get_test_images(
            dataset_name="VisDrone",
            num_images=(num_images if num_images != -1 else None),
            random_select=(num_images != -1 and num_images is not None)
        )
        if not image_paths:
            raise ValueError("未找到 VisDrone 数据集图像，请检查路径 backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images 是否存在")

        # 5. 创建评估器并执行评估
        evaluator = AdversarialEvaluator(
            model=model,
            attack=attack,
            save_dir=save_dir,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )
        evaluator.evaluate_dataset(image_paths)

        return {
            "status": "Completed",
            "result_path": save_dir,
            "num_images_tested": len(image_paths)
        }

    except Exception as e:
        # 记录错误信息
        error_path = os.path.join("backend", "adversarial_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e

# -----------------------------------------------------------------------------
# FGSM 数据集级对抗评估任务
# -----------------------------------------------------------------------------
@celery_app.task(name="attack.fgsm_dataset", bind=True)
def fgsm_dataset_attack_task(self, task_id, num_images=-1, eps="8/255", conf_threshold=0.25, iou_threshold=0.5):
    """执行 FGSM 对 VisDrone 数据集的完整对抗评估任务"""
    try:
        # 1. 结果目录
        save_dir = os.path.join("backend", "adversarial_results", task_id)
        os.makedirs(save_dir, exist_ok=True)

        # 2. 加载模型 (YOLOv8s)
        model = ModelManager.load_yolov8_model(model_name="yolov8s-visdrone")
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold

        # 3. 解析攻击参数
        eps_val = parse_fraction(str(eps))
        attack = FGSMAttack(eps=eps_val)

        # 4. 获取数据集图像
        image_paths = DatasetManager.get_test_images(
            dataset_name="VisDrone",
            num_images=(num_images if num_images != -1 else None),
            random_select=(num_images != -1 and num_images is not None)
        )
        if not image_paths:
            raise ValueError("未找到 VisDrone 数据集图像，请检查路径 backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images 是否存在")

        # 5. 创建评估器并执行评估
        evaluator = AdversarialEvaluator(
            model=model,
            attack=attack,
            save_dir=save_dir,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )
        evaluator.evaluate_dataset(image_paths)

        return {
            "status": "Completed",
            "result_path": save_dir,
            "num_images_tested": len(image_paths)
        }

    except Exception as e:
        # 记录错误信息
        error_path = os.path.join("backend", "adversarial_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e