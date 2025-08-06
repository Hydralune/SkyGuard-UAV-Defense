import torch
import cv2
import os
import numpy as np
import importlib
import inspect
from uuid import uuid4
from pathlib import Path
import sys
import requests
import json
import traceback
from celery_app import celery_app
from evaluate_model import EnhancedEvaluator
from evaluate_adversarial import AdversarialEvaluator, parse_fraction
from algorithms.attacks.base import BaseAttack
from algorithms.defenses.base import BaseTrainingDefense
from utils.model_manager import ModelManager
from utils.dataset_manager import DatasetManager

def update_progress(task_id, progress_data):
    """向进度API发送进度更新"""
    try:
        url = f"http://localhost:8000/progress/update/{task_id}"
        requests.post(url, json=progress_data, timeout=2)
    except Exception as e:
        print(f"更新进度失败: {str(e)}")
        try:
            task_dirs = [
                os.path.join("results", "evaluation_results", task_id),
                os.path.join("results", "adversarial_results", task_id),
                os.path.join("results", "defense_results", task_id)
            ]
            result_dir = None
            for dir_path in task_dirs:
                if os.path.exists(dir_path):
                    result_dir = dir_path
                    break
            if not result_dir:
                if "defense_type" in progress_data:
                    result_dir = os.path.join("results", "defense_results", task_id)
                elif "attack_name" in progress_data:
                    result_dir = os.path.join("results", "adversarial_results", task_id)
                else:
                    result_dir = os.path.join("results", "evaluation_results", task_id)
                os.makedirs(result_dir, exist_ok=True)
            progress_file = os.path.join(result_dir, "progress.json")
            with open(progress_file, 'w') as f:
                json.dump(progress_data, f)
        except Exception as write_err:
            print(f"写入进度文件也失败: {str(write_err)}")

def test_model_task(task_id, model_name="yolov8s-visdrone", dataset_name="VisDrone", num_images=-1, conf_threshold=0.25, iou_threshold=0.5):
    """在后台评估模型原始性能"""
    try:
        print(f"开始执行测试任务: task_id={task_id}, model_name={model_name}, dataset_name={dataset_name}")
        print(f"当前工作目录: {os.getcwd()}")

        project_root = Path(__file__).resolve().parent.parent
        os.chdir(project_root)
        print(f"切换到项目根目录: {os.getcwd()}")

        result_path = os.path.join(project_root,"backend", "results", "evaluation_results", task_id)
        if "backend/backend" in result_path:
            result_path = result_path.replace("backend/backend", "backend")
        os.makedirs(result_path, exist_ok=True)
        print(f"创建结果目录: {result_path}")

        print(f"正在加载模型: {model_name}")
        model = ModelManager.load_yolov8_model(model_name=model_name)
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold
        print(f"模型加载成功")

        print(f"正在获取数据集 {dataset_name} 的测试图像")
        from utils.config_manager import ConfigManager
        test_path = ConfigManager.get_dataset_path(dataset_name, "test")
        print(f"数据集路径: {test_path}")
        print(f"路径存在: {os.path.exists(test_path) if test_path else False}")

        if not test_path or not os.path.exists(test_path):
            print("尝试常见的路径组合:")
            root_dir = ConfigManager._ROOT_DIR
            if not os.path.isabs(root_dir):
                root_dir = os.path.abspath(root_dir)
            print(f"ConfigManager._ROOT_DIR (绝对路径): {root_dir}")

            if "backend/backend" in root_dir:
                fixed_root_dir = root_dir.replace("backend/backend", "backend")
                print(f"修正后的ROOT_DIR: {fixed_root_dir}")
                root_dir = fixed_root_dir

            common_paths = [
                os.path.join(root_dir, "datasets", "VisDrone_Dataset", "VisDrone2019-DET-test-dev", "images"),
                os.path.join(root_dir, "datasets", "VisDrone_Dataset", "images"),
                os.path.join(os.path.dirname(root_dir), "datasets", "VisDrone_Dataset", "VisDrone2019-DET-test-dev", "images"),
                "/root/projects/SkyGuard-UAV-Defense/backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images",
                "/root/projects/SkyGuard-UAV-Defense/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images",
                str(project_root / "backend" / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "images"),
                str(project_root / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "images"),
                root_dir.replace("/backend/backend/", "/backend/") + "/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images"
            ]

            for path in common_paths:
                exists = os.path.exists(path)
                print(f"  路径: {path}, 存在: {exists}")
                if exists:
                    print(f"使用找到的路径: {path}")
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

        print(f"获取到的图像路径数量: {len(image_paths) if image_paths else 0}")
        if image_paths:
            print("图像路径示例:")
            for i, path in enumerate(image_paths[:3]):
                print(f"  {i+1}. {path} (存在: {os.path.exists(path)})")

        if not image_paths:
            print("尝试手动查找图像文件:")
            found_images = False
            search_dirs = [
                os.path.join(ConfigManager._ROOT_DIR, "datasets"),
                os.path.join(str(Path(ConfigManager._ROOT_DIR).parent), "datasets"),
                "/backend/datasets",
                "datasets"
            ]
            for search_dir in search_dirs:
                if os.path.exists(search_dir):
                    print(f"搜索目录: {search_dir}")
                    for root, dirs, files in os.walk(search_dir):
                        image_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        if image_files:
                            print(f"在目录 {root} 中找到 {len(image_files)} 个图像文件")
                            print(f"示例: {', '.join(image_files[:3])}")

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

        print("创建评估器并执行评估")
        evaluator = EnhancedEvaluator(
            model=model,
            save_dir=result_path,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )

        total_images = len(image_paths)

        update_progress(task_id, {
            "status": "running",
            "model_name": model_name,
            "dataset_name": dataset_name,
            "current_image": 0,
            "total_images": total_images,
            "percent": 0,
            "message": f"开始评估模型 {model_name} 在 {dataset_name} 数据集上的性能"
        })

        original_evaluate_image = evaluator.evaluate_image

        def evaluate_image_with_progress(image_path, image_idx=None):
            result = original_evaluate_image(image_path, image_idx)
            current = image_idx if image_idx is not None else getattr(evaluator, 'current_idx', 0)
            percent = min(100, int((current + 1) / total_images * 100))
            update_progress(task_id, {
                "status": "running",
                "model_name": model_name,
                "dataset_name": dataset_name,
                "current_image": current + 1,
                "total_images": total_images,
                "percent": percent,
                "message": f"正在评估图像 {current + 1}/{total_images}"
            })
            return result

        evaluator.evaluate_image = evaluate_image_with_progress
        evaluator.evaluate_dataset(image_paths)

        print("计算指标并生成可视化")
        try:
            metrics = evaluator.calculate_summary_metrics()
            print(f"计算得到的指标: {metrics}")
            evaluator.generate_visualizations()
            evaluator.save_metrics()
            if metrics is None:
                print("警告: 计算得到的metrics为None，使用evaluator中的metrics")
                metrics = evaluator.metrics
            evaluator.generate_html_report(metrics)
            print("HTML报告生成成功")
        except Exception as e:
            print(f"生成报告时出错: {str(e)}")
            traceback.print_exc()

        print("评估完成")
        update_progress(task_id, {
            "status": "completed",
            "model_name": model_name,
            "dataset_name": dataset_name,
            "current_image": len(image_paths),
            "total_images": len(image_paths),
            "percent": 100,
            "message": "模型评估完成",
            "metrics": metrics
        })

        return {
            "status": "Completed",
            "result_path": result_path,
            "num_images_tested": len(image_paths),
            "metrics": metrics
        }

    except Exception as e:
        error_path = os.path.join(project_root, "backend", "results", "evaluation_results", task_id, "error.txt")
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
            traceback.print_exc(file=f)
        print(f"Error in task {task_id}: {str(e)}")
        print(f"错误日志已保存到: {error_path}")
        traceback.print_exc()
        raise e

def load_attack_by_name(name: str, **kwargs):
    """根据名称动态加载 algorithms.attacks.<name>.py 中的攻击类并实例化。"""
    module_name = f"algorithms.attacks.{name.lower()}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as e:
        raise ValueError(f"不支持的攻击算法: {name}。预期的文件路径: algorithms/attacks/{name.lower()}.py") from e

    for attr in dir(module):
        obj = getattr(module, attr)
        if isinstance(obj, type) and issubclass(obj, BaseAttack) and obj is not BaseAttack:
            try:
                return obj(**kwargs)
            except TypeError:
                sig = inspect.signature(obj.__init__)
                filtered_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters}
                return obj(**filtered_kwargs)

    raise ValueError(f"在模块 {module_name} 中未找到攻击类")

def load_defense_by_name(name: str, **kwargs):
    """根据名称动态加载 algorithms.defenses.<n>.py 中的防御类并实例化。"""
    module_name = f"algorithms.defenses.{name.lower()}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as e:
        raise ValueError(f"不支持的防御算法: {name}。预期的文件路径: algorithms/defenses/{name.lower()}.py") from e

    for attr in dir(module):
        obj = getattr(module, attr)
        if isinstance(obj, type) and issubclass(obj, BaseTrainingDefense) and obj is not BaseTrainingDefense:
            try:
                return obj(**kwargs)
            except TypeError:
                sig = inspect.signature(obj.__init__)
                filtered_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters}
                return obj(**filtered_kwargs)

    raise ValueError(f"在模块 {module_name} 中未找到防御类")

@celery_app.task(name="defense.train")
def adv_defense_train_task(task_id=None, defense_type="pgd", base_model="yolov8s.pt",
                           data_yaml="backend/datasets/VisDrone_Dataset/visdrone.yaml",
                           epochs=30, imgsz=640, batch=16,
                           model_name=None, device=0,
                           eps="8/255", alpha="2/255", steps=None, attack_ratio=0.5):
    """对抗训练防御异步任务"""
    import subprocess
    import json
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    os.chdir(project_root)
    print(f"切换到项目根目录: {os.getcwd()}")

    try:
        from backend.train_model import train_visdrone
        print("成功从backend.train_model导入train_visdrone")
    except ImportError:
        try:
            sys.path.append(str(project_root / "backend"))
            from train_model import train_visdrone
            print("成功从train_model直接导入train_visdrone")
        except ImportError as e:
            print(f"导入失败: {str(e)}")
            print(f"Python路径: {sys.path}")
            print(f"当前目录: {os.getcwd()}")
            print(f"目录内容: {os.listdir('.')}")
            print(f"backend目录内容: {os.listdir('./backend') if os.path.exists('./backend') else '不存在'}")
            raise

    os.environ["OMP_NUM_THREADS"] = "1"
    os.environ["MKL_NUM_THREADS"] = "1"
    os.environ["NUMEXPR_NUM_THREADS"] = "1"
    os.environ["OPENBLAS_NUM_THREADS"] = "1"

    import torch.multiprocessing as mp
    try:
        mp.set_start_method('spawn', force=True)
        print("PyTorch多进程启动方法设置为'spawn'")
    except RuntimeError:
        print("PyTorch多进程启动方法已经设置，无法更改")

    if task_id is None:
        task_id = str(uuid4())

    defense_type = defense_type.lower()

    if model_name is None:
        model_name = f"yolov8s-{defense_type}-defended"

    if steps is None:
        if defense_type == "pgd":
            steps = 10
        elif defense_type == "fgm":
            steps = 1
        elif defense_type == "freeat":
            steps = 4
        elif defense_type == "yopo":
            steps = 5
        elif defense_type == "freelb":
            steps = 5
        else:
            steps = 3

    try:
        result_file = os.path.join("results", "defense_results", task_id, "result.json")
        os.makedirs(os.path.dirname(result_file), exist_ok=True)

        cmd = [
            "python", "backend/run_defense_training.py",
            "--defense_type", defense_type,
            "--base_model", base_model,
            "--data_yaml", data_yaml,
            "--epochs", str(epochs),
            "--imgsz", str(imgsz),
            "--batch", str(batch),
            "--device", str(device),
            "--eps", eps,
            "--alpha", alpha,
            "--attack_ratio", str(attack_ratio),
            "--task_id", task_id,
            "--result_file", result_file
        ]

        if model_name:
            cmd.extend(["--model_name", model_name])
        if steps:
            cmd.extend(["--steps", str(steps)])

        print(f"执行命令: {' '.join(cmd)}")

        print(f"开始执行训练脚本，实时输出日志...")
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True
        )

        for line in process.stdout:
            line_text = line.strip()
            print(line_text)

            try:
                if "epoch" in line_text.lower() and ("/" in line_text) and ("%" in line_text):
                    parts = line_text.split()
                    epoch_info = next((p for p in parts if "epoch" in p.lower() and "/" in p), "")
                    if epoch_info:
                        current_epoch = int(epoch_info.split("/")[0].replace("epoch", "").strip())
                        total_epochs = int(epoch_info.split("/")[1].split()[0].strip())

                        percent_info = next((p for p in parts if "%" in p), "0%")
                        percent = float(percent_info.replace("%", "").strip())

                        progress_data = {
                            "status": "training",
                            "defense_type": defense_type,
                            "current_epoch": current_epoch,
                            "total_epochs": total_epochs,
                            "percent": percent,
                            "message": line_text
                        }
                        update_progress(task_id, progress_data)
                elif "results saved to" in line_text.lower():
                    progress_data = {
                        "status": "completed",
                        "defense_type": defense_type,
                        "message": "训练完成，正在处理结果",
                        "percent": 100
                    }
                    update_progress(task_id, progress_data)
            except Exception as e:
                print(f"解析进度信息失败: {str(e)}")

        process.wait()

        if process.returncode != 0:
            print(f"训练脚本执行失败，返回码: {process.returncode}")
            raise RuntimeError(f"训练脚本执行失败，返回码: {process.returncode}")

        if os.path.exists(result_file):
            with open(result_file, 'r') as f:
                result = json.load(f)
        else:
            result = {
                "status": "Completed",
                "message": "训练完成，但未找到结果文件"
            }

        return {
            "status": "Completed",
            "task_id": task_id,
            "defense_type": defense_type,
            "model_name": model_name,
            "result": result
        }

    except Exception as e:
        error_path = os.path.join("results", "defense_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
            f.write("\n")
            traceback.print_exc(file=f)
        print(f"Error in defense training task {task_id}: {str(e)}")
        traceback.print_exc()
        raise e

@celery_app.task(name="attack.run")
def run_attack_task(task_id=None, attack_name="pgd", model_name="yolov8s-visdrone",
                    dataset_name="VisDrone", num_images=10, eps="8/255", alpha="2/255",
                    steps=10, conf_threshold=0.25, iou_threshold=0.5, confidence=0, lr=0.01, initial_const=0.1,
                    patch_size=30, brightness_factor=1.5, noise_std=0.1, contrast_factor=1.5,
                    max_iter=50, overshoot=0.02,
                    random_locations=True, num_patches=1,
                    distortion_type='elastic', severity=0.5,
                    transition_type='weather'):
    """通用对抗攻击评估任务"""
    if task_id is None:
        task_id = str(uuid4())

    try:
        save_dir = os.path.join("results", "adversarial_results", task_id)
        os.makedirs(save_dir, exist_ok=True)

        model = ModelManager.load_yolov8_model(model_name=model_name)
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold

        eps_val = parse_fraction(str(eps))
        alpha_val = parse_fraction(str(alpha))

        attack_params = {"eps": eps_val}
        if attack_name.lower() == "pgd":
            attack_params.update({"alpha": alpha_val, "steps": steps})
        elif attack_name.lower() == "fgsm":
            attack_params.update({"steps": steps})
        elif attack_name.lower() == "cw_l2":
            attack_params = {
                "confidence": confidence,
                "steps": steps,
                "lr": lr,
                "initial_const": initial_const
            }
        elif attack_name.lower() == "dpatch":
            attack_params.update({"patch_size": patch_size, "steps": steps})
        elif attack_name.lower() == "brightness":
            attack_params = {"brightness_factor": brightness_factor}
        elif attack_name.lower() == "gaussian":
            attack_params = {"noise_std": noise_std}
        elif attack_name.lower() == "contrast":
            attack_params = {"contrast_factor": contrast_factor}
        elif attack_name.lower() == "deepfool":
            attack_params = {
                "max_iter": max_iter,
                "overshoot": overshoot
            }
        elif attack_name.lower() == "advpatch":
            attack_params = {
                "patch_size": patch_size,
                "learning_rate": lr,
                "max_iter": steps,
                "random_locations": random_locations,
                "num_patches": num_patches
            }
        elif attack_name.lower() == "distortion":
            attack_params = {
                "distortion_type": distortion_type,
                "severity": severity
            }
        elif attack_name.lower() == "scene_transition":
            attack_params = {
                "transition_type": transition_type,
                "severity": severity
            }

        attack = load_attack_by_name(attack_name, **attack_params)

        image_paths = DatasetManager.get_test_images(
            dataset_name=dataset_name,
            num_images=(num_images if num_images != -1 else None),
            random_select=(num_images != -1 and num_images is not None)
        )
        if not image_paths:
            raise ValueError(f"未找到 {dataset_name} 数据集图像，请检查数据集目录是否存在")

        evaluator = AdversarialEvaluator(
            model=model,
            attack=attack,
            save_dir=save_dir,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )

        total_images = len(image_paths)

        update_progress(task_id, {
            "status": "running",
            "attack_name": attack_name,
            "current_image": 0,
            "total_images": total_images,
            "percent": 0,
            "message": f"开始执行 {attack_name} 攻击评估"
        })

        original_evaluate_image = evaluator.evaluate_image

        def evaluate_image_with_progress(image_path, image_idx=None):
            result = original_evaluate_image(image_path, image_idx)
            current = image_idx if image_idx is not None else evaluator.current_idx
            percent = min(100, int((current + 1) / total_images * 100))
            update_progress(task_id, {
                "status": "running",
                "attack_name": attack_name,
                "current_image": current + 1,
                "total_images": total_images,
                "percent": percent,
                "message": f"正在处理图像 {current + 1}/{total_images}"
            })
            return result

        evaluator.evaluate_image = evaluate_image_with_progress
        evaluator.evaluate_dataset(image_paths)

        metrics = evaluator.metrics.get("summary", {})

        update_progress(task_id, {
            "status": "completed",
            "attack_name": attack_name,
            "current_image": total_images,
            "total_images": total_images,
            "percent": 100,
            "message": "攻击评估完成",
            "metrics": metrics
        })

        return {
            "status": "Completed",
            "result_path": save_dir,
            "num_images_tested": len(image_paths),
            "attack_name": attack_name,
            "metrics": metrics
        }

    except Exception as e:
        error_path = os.path.join("results", "adversarial_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in attack task {task_id}: {str(e)}")
        raise e