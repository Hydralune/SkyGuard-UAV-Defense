# backend/tasks.py 中添加的新任务
import torch
import cv2
import os
import numpy as np
import importlib
import inspect
from uuid import uuid4
from pathlib import Path
import sys
from celery_app import celery_app
from evaluate_model import EnhancedEvaluator  # 直接导入评估类
from evaluate_adversarial import AdversarialEvaluator, parse_fraction
from algorithms.attacks.base import BaseAttack  # 用于类型检查
from utils.model_manager import ModelManager
from utils.dataset_manager import DatasetManager
import traceback

def test_model_task(task_id, model_name="yolov8s-visdrone", dataset_name="VisDrone", num_images=-1, conf_threshold=0.25, iou_threshold=0.5):
    """在后台评估模型原始性能"""
    try:
        # 0. 打印调试信息
        print(f"开始执行测试任务: task_id={task_id}, model_name={model_name}, dataset_name={dataset_name}")
        print(f"当前工作目录: {os.getcwd()}")
        
        # 确保在正确的工作目录中
        project_root = Path(__file__).resolve().parent.parent
        os.chdir(project_root)
        print(f"切换到项目根目录: {os.getcwd()}")
        
        # 1. 结果目录 - 使用绝对路径
        result_path = os.path.join(project_root, "results", "evaluation_results", task_id)
        # 检查路径是否已经包含重复的backend
        if "backend/backend" in result_path:
            result_path = result_path.replace("backend/backend", "backend")
        os.makedirs(result_path, exist_ok=True)
        print(f"创建结果目录: {result_path}")

        # 2. 加载模型
        print(f"正在加载模型: {model_name}")
        model = ModelManager.load_yolov8_model(model_name=model_name)
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold
        print(f"模型加载成功")

        # 3. 获取测试图像
        print(f"正在获取数据集 {dataset_name} 的测试图像")
        
        # 检查数据集路径
        from utils.config_manager import ConfigManager
        test_path = ConfigManager.get_dataset_path(dataset_name, "test")
        print(f"数据集路径: {test_path}")
        print(f"路径存在: {os.path.exists(test_path) if test_path else False}")
        
        # 尝试常见路径
        if not test_path or not os.path.exists(test_path):
            print("尝试常见的路径组合:")
            root_dir = ConfigManager._ROOT_DIR
            
            # 确保root_dir是绝对路径
            if not os.path.isabs(root_dir):
                root_dir = os.path.abspath(root_dir)
            print(f"ConfigManager._ROOT_DIR (绝对路径): {root_dir}")
            
            # 检查是否有重复的backend
            if "backend/backend" in root_dir:
                fixed_root_dir = root_dir.replace("backend/backend", "backend")
                print(f"修正后的ROOT_DIR: {fixed_root_dir}")
                root_dir = fixed_root_dir
            
            # 使用绝对路径
            common_paths = [
                os.path.join(root_dir, "datasets", "VisDrone_Dataset", "VisDrone2019-DET-test-dev", "images"),
                os.path.join(root_dir, "datasets", "VisDrone_Dataset", "images"),
                os.path.join(os.path.dirname(root_dir), "datasets", "VisDrone_Dataset", "VisDrone2019-DET-test-dev", "images"),
                "/root/projects/SkyGuard-UAV-Defense/backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images",
                # 添加更多可能的路径
                "/root/projects/SkyGuard-UAV-Defense/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images",
                str(project_root / "backend" / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "images"),
                str(project_root / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "images"),
                # 添加不包含重复backend的路径
                root_dir.replace("/backend/backend/", "/backend/") + "/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images"
            ]
            
            for path in common_paths:
                exists = os.path.exists(path)
                print(f"  路径: {path}, 存在: {exists}")
                if exists:
                    # 使用找到的路径
                    print(f"使用找到的路径: {path}")
                    # 手动获取图像文件
                    image_files = [f for f in os.listdir(path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
                    if image_files:
                        print(f"找到 {len(image_files)} 个图像文件")
                        if num_images is not None and num_images > 0 and num_images < len(image_files):
                            import random
                            if num_images != -1:
                                if num_images is not None and num_images != -1:
                                    image_files = random.sample(image_files, num_images)
                                else:
                                    image_files = image_files[:num_images]
                        
                        image_paths = [os.path.join(path, f) for f in image_files]
                        print(f"使用手动获取的图像路径: {len(image_paths)} 个")
                        break
        
        # 如果没有手动获取到图像路径，使用DatasetManager
        if 'image_paths' not in locals():
            print("使用DatasetManager获取图像路径")
            try:
                image_paths = DatasetManager.get_test_images(
                    dataset_name=dataset_name,
                    num_images=(num_images if num_images != -1 else None),
                    random_select=(num_images is not None and num_images != -1)
                )
                print(f"DatasetManager返回的图像路径数量: {len(image_paths) if image_paths else 0}")
            except Exception as e:
                print(f"DatasetManager.get_test_images出错: {str(e)}")
                traceback.print_exc()
                image_paths = []
        
        # 检查图像路径
        print(f"获取到的图像路径数量: {len(image_paths) if image_paths else 0}")
        if image_paths:
            print("图像路径示例:")
            for i, path in enumerate(image_paths[:3]):
                print(f"  {i+1}. {path} (存在: {os.path.exists(path)})")
        
        if not image_paths:
            # 尝试在数据集目录中手动查找图像文件
            print("尝试手动查找图像文件:")
            found_images = False
            
            search_dirs = [
                os.path.join(ConfigManager._ROOT_DIR, "datasets"),
                os.path.join(str(Path(ConfigManager._ROOT_DIR).parent), "datasets"),
                "/root/projects/SkyGuard-UAV-Defense/backend/datasets",
                "/root/projects/SkyGuard-UAV-Defense/datasets"
            ]
            
            for search_dir in search_dirs:
                if os.path.exists(search_dir):
                    print(f"搜索目录: {search_dir}")
                    for root, dirs, files in os.walk(search_dir):
                        image_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        if image_files:
                            print(f"在目录 {root} 中找到 {len(image_files)} 个图像文件")
                            print(f"示例: {', '.join(image_files[:3])}")
                            
                            # 使用找到的图像
                            if num_images > 0 and num_images < len(image_files):
                                import random
                                image_files = random.sample(image_files, num_images)
                            else:
                                image_files = image_files[:num_images if num_images > 0 else len(image_files)]
                                
                            image_paths = [os.path.join(root, f) for f in image_files]
                            print(f"使用手动找到的图像路径: {len(image_paths)} 个")
                            found_images = True
                            break
                    
                    if found_images:
                        break
            
            if not found_images:
                print("在所有搜索目录中未找到任何图像文件")
                raise ValueError(f"未找到 {dataset_name} 数据集图像，请检查数据集目录是否存在")
            
        # 4. 创建评估器并执行评估
        print("创建评估器并执行评估")
        evaluator = EnhancedEvaluator(
            model=model,
            save_dir=result_path,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )
        evaluator.evaluate_dataset(image_paths)

        # 5. 计算指标并生成可视化
        print("计算指标并生成可视化")
        try:
            metrics = evaluator.calculate_summary_metrics()
            print(f"计算得到的指标: {metrics}")
            
            evaluator.generate_visualizations()
            evaluator.save_metrics()
            
            # 确保metrics不为None
            if metrics is None:
                print("警告: 计算得到的metrics为None，使用evaluator中的metrics")
                metrics = evaluator.metrics
                
            evaluator.generate_html_report(metrics)
            print("HTML报告生成成功")
        except Exception as e:
            print(f"生成报告时出错: {str(e)}")
            traceback.print_exc()
            # 继续执行，不要因为报告生成失败而中断整个任务

        print("评估完成")
        return {
            "status": "Completed",
            "result_path": result_path,
            "num_images_tested": len(image_paths),
            "metrics": metrics
        }

    except Exception as e:
        # 使用绝对路径处理错误日志
        error_path = os.path.join(project_root, "results", "evaluation_results", task_id, "error.txt")
        # 检查路径是否已经包含重复的backend
        if "backend/backend" in error_path:
            error_path = error_path.replace("backend/backend", "backend")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(f"错误: {str(e)}\n")
            f.write(f"当前工作目录: {os.getcwd()}\n")
            f.write(f"PYTHONPATH: {sys.path}\n")
            f.write(f"项目根目录: {project_root}\n")
            f.write(f"结果目录: {result_path}\n")
            f.write(f"异常堆栈跟踪:\n")
            import traceback
            traceback.print_exc(file=f)
        print(f"Error in task {task_id}: {str(e)}")
        print(f"错误日志已保存到: {error_path}")
        traceback.print_exc()
        raise e

def load_attack_by_name(name: str, **kwargs):
    """根据名称动态加载 algorithms.attacks.<name>.py 中的攻击类并实例化。
    如果传入的 kwargs 参数不被目标类接受，会自动过滤掉。"""
    module_name = f"algorithms.attacks.{name.lower()}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as e:
        raise ValueError(f"不支持的攻击算法: {name}。预期的文件路径: algorithms/attacks/{name.lower()}.py") from e

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

    raise ValueError(f"在模块 {module_name} 中未找到攻击类")

@celery_app.task(name="attack.run")
def run_attack_task(task_id=None, attack_name="pgd", model_name="yolov8s-visdrone", 
                   dataset_name="VisDrone", num_images=10, eps="8/255", alpha="2/255", 
                   steps=10, conf_threshold=0.25, iou_threshold=0.5):
    """
    通用对抗攻击评估任务
    
    参数:
        task_id: 任务ID，如果为None则自动生成
        attack_name: 攻击算法名称 (pgd, fgsm等)
        model_name: 模型名称
        dataset_name: 数据集名称
        num_images: 评估图像数量，-1表示全部
        eps: 最大扰动大小 (如 "8/255")
        alpha: 每步扰动大小 (如 "2/255")，仅PGD等迭代攻击使用
        steps: 攻击迭代步数，仅迭代攻击使用
        conf_threshold: 置信度阈值
        iou_threshold: IoU阈值
    """
    if task_id is None:
        task_id = str(uuid4())
        
    try:
        # 1. 结果目录
        save_dir = os.path.join("results", "adversarial_results", task_id)
        os.makedirs(save_dir, exist_ok=True)

        # 2. 加载模型
        model = ModelManager.load_yolov8_model(model_name=model_name)
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold

        # 3. 解析攻击参数并动态创建攻击实例
        eps_val = parse_fraction(str(eps))
        alpha_val = parse_fraction(str(alpha))
        
        # 根据攻击类型准备参数
        attack_params = {"eps": eps_val}
        if attack_name.lower() == "pgd":
            attack_params.update({"alpha": alpha_val, "steps": steps})
        
        # 动态加载攻击算法
        attack = load_attack_by_name(attack_name, **attack_params)

        # 4. 获取数据集图像
        image_paths = DatasetManager.get_test_images(
            dataset_name=dataset_name,
            num_images=(num_images if num_images != -1 else None),
            random_select=(num_images != -1 and num_images is not None)
        )
        if not image_paths:
            raise ValueError(f"未找到 {dataset_name} 数据集图像，请检查数据集目录是否存在")

        # 5. 创建评估器并执行评估
        evaluator = AdversarialEvaluator(
            model=model,
            attack=attack,
            save_dir=save_dir,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )
        
        # 6. 执行评估
        evaluator.evaluate_dataset(image_paths)
        
        # 7. 生成报告
        metrics = evaluator.metrics.get("summary", {})
        
        return {
            "status": "Completed",
            "result_path": save_dir,
            "num_images_tested": len(image_paths),
            "attack_name": attack_name,
            "metrics": metrics
        }

    except Exception as e:
        # 记录错误信息
        error_path = os.path.join("results", "adversarial_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in attack task {task_id}: {str(e)}")
        raise e