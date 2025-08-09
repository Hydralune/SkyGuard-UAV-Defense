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
from evaluate_defense import DefenseEvaluator  # 防御评估器
from evaluate_defense import load_defense as load_input_defense  # 动态加载输入预处理防御
from typing import Optional, Dict, Any

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
    alias_map = {
        # 名称别名映射
        "gaussian": "gaussian_noise",
        "gaussian-noise": "gaussian_noise",
        "gaussian_noise": "gaussian_noise",
    }
    canonical = alias_map.get(name.lower(), name.lower())
    module_name = f"algorithms.attacks.{canonical}"
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


def run_defense_eval_task(task_id: Optional[str] = None,
                          defense_type: str = "gaussian_blur",
                          model_name: str = "yolov8s-visdrone",
                          dataset_name: str = "VisDrone",
                          num_images: int = 10,
                          conf_threshold: float = 0.25,
                          iou_threshold: float = 0.5,
                          # 评估所针对的攻击（若提供则走 原始→对抗→防御 的三段评估）
                          attack_name: Optional[str] = "pgd",
                          eps: Optional[str] = "8/255",
                          alpha: Optional[str] = "2/255",
                          steps: Optional[int] = 10,
                          # 通用防御参数（根据不同算法选择性使用）
                          ksize: Optional[int] = None,
                          sigma: Optional[float] = None,
                          quality: Optional[int] = None,
                          bits: Optional[int] = None,
                          **extra_params: Any):
    """输入预处理类防御的评估任务。

    生成目录: results/defense_results/{task_id}
    输出: 原始检测、经防御检测、对比图、指标与图表
    """
    if task_id is None:
        task_id = str(uuid4())

    try:
        save_dir = os.path.join("results", "defense_results", task_id)
        os.makedirs(save_dir, exist_ok=True)

        # 加载模型
        model = ModelManager.load_yolov8_model(model_name=model_name)
        model.overrides['conf'] = conf_threshold
        model.overrides['iou'] = iou_threshold

        # 解析防御参数
        defense_type = defense_type.lower()
        defense_kwargs = {}
        if defense_type in ("gaussian_blur", "gaussian"):
            if ksize is not None:
                defense_kwargs["ksize"] = int(ksize)
            if sigma is not None:
                defense_kwargs["sigma"] = float(sigma)
            defense_type = "gaussian_blur"
        elif defense_type in ("median_blur", "median_filter", "median"):
            if ksize is not None:
                defense_kwargs["ksize"] = int(ksize)
            defense_type = "median_blur"
        elif defense_type in ("jpeg_compression", "jpeg"):
            if quality is not None:
                defense_kwargs["quality"] = int(quality)
            defense_type = "jpeg_compression"
        elif defense_type in ("bit_depth_reduction", "bit_depth", "feature_squeezing"):
            if bits is not None:
                defense_kwargs["bits"] = int(bits)
            defense_type = "bit_depth_reduction"
        # 透传额外参数（若与签名重复，以上优先）
        for k, v in extra_params.items():
            if k not in defense_kwargs and v is not None:
                defense_kwargs[k] = v

        # 加载防御
        defense = load_input_defense(defense_type, **defense_kwargs)

        # 收集数据集图像
        image_paths = DatasetManager.get_test_images(
            dataset_name=dataset_name,
            num_images=(num_images if num_images != -1 else None),
            random_select=(num_images != -1 and num_images is not None)
        )
        if not image_paths:
            raise ValueError(f"未找到 {dataset_name} 数据集图像，请检查数据集目录是否存在")

        total_images = len(image_paths)

        update_progress(task_id, {
            "status": "running",
            "defense_type": defense_type,
            "attack_name": attack_name,
            "current_image": 0,
            "total_images": total_images,
            "percent": 0,
            "message": f"开始执行防御评估（攻击: {attack_name or 'none'} → 防御: {defense_type}）"
        })

        # 若提供 attack_name，则执行 原始→对抗→防御 的三段评估
        if attack_name:
            # 解析 eps/alpha
            def _parse_fraction(val: Optional[str]) -> float:
                try:
                    s = str(val)
                    if "/" in s:
                        a, b = s.split("/", 1)
                        return float(a) / float(b)
                    return float(s)
                except Exception:
                    return 0.0

            eps_val = _parse_fraction(eps) if eps is not None else 0.0
            alpha_val = _parse_fraction(alpha) if alpha is not None else 0.0

            attack_params: Dict[str, Any] = {"eps": eps_val}
            if attack_name.lower() == "pgd":
                attack_params.update({"alpha": alpha_val, "steps": steps or 10})
            elif attack_name.lower() == "fgsm":
                attack_params.update({"steps": steps or 1})
            elif attack_name.lower() == "cw_l2":
                attack_params.update({"confidence": extra_params.get("confidence", 0), "steps": steps or 10, "lr": extra_params.get("lr", 0.01), "initial_const": extra_params.get("initial_const", 0.1)})
            elif attack_name.lower() == "dpatch":
                attack_params.update({"patch_size": extra_params.get("patch_size", 30), "steps": steps or 10})
            # 其他攻击略

            attack = load_attack_by_name(attack_name, **attack_params)

            # 目录
            det_dir = os.path.join(save_dir, "original_results")
            adv_dir = os.path.join(save_dir, "adversarial_results")
            def_dir = os.path.join(save_dir, "defended_results")
            cmp_dir = os.path.join(save_dir, "comparison_results")
            plots_dir = os.path.join(save_dir, "plots")
            metrics_dir = os.path.join(save_dir, "metrics")
            for d in (det_dir, adv_dir, def_dir, cmp_dir, plots_dir, metrics_dir):
                os.makedirs(d, exist_ok=True)

            import cv2, numpy as np, time as _time, torch

            m = {
                "total_images": 0,
                "original_detections": 0,
                "adversarial_detections": 0,
                "defended_detections": 0,
                "inference_times": [],
                "attack_times": [],
                "defense_times": [],
                "original_by_class": {},
                "adversarial_by_class": {},
                "defended_by_class": {},
                "per_image": {"o": [], "a": [], "d": []},
                "conf": {"o": [], "a": [], "d": []},
            }

            for idx, img_path in enumerate(image_paths):
                img_bgr = cv2.imread(img_path)
                if img_bgr is None:
                    continue
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                # Ensure contiguity for Ultralytics Annotator
                img_rgb = np.ascontiguousarray(img_rgb)

                # 原始推理
                t0 = _time.time()
                orig_res = model.predict(img_rgb)
                infer_t = _time.time() - t0
                orig_boxes = orig_res[0].boxes

                # 生成对抗图
                t1 = _time.time()
                tensor = torch.from_numpy(img_rgb.transpose(2, 0, 1)).float().unsqueeze(0) / 255.0
                try:
                    adv_tensor = attack(model, tensor)
                except Exception:
                    adv_tensor = tensor
                attack_t = _time.time() - t1
                adv_img = adv_tensor[0].permute(1, 2, 0).cpu().numpy()
                adv_img = np.clip(adv_img * 255.0, 0, 255).astype(np.uint8)
                adv_img = np.ascontiguousarray(adv_img)

                # 防御预处理
                t2 = _time.time()
                defended_img = defense(adv_img)
                defense_t = _time.time() - t2
                defended_img = np.ascontiguousarray(defended_img)

                # 对抗与防御推理
                adv_res = model.predict(adv_img)
                def_res = model.predict(defended_img)

                adv_boxes = adv_res[0].boxes
                def_boxes = def_res[0].boxes

                # 计数与时间
                m["total_images"] += 1
                m["inference_times"].append(infer_t)
                m["attack_times"].append(attack_t)
                m["defense_times"].append(defense_t)
                m["original_detections"] += len(orig_boxes)
                m["adversarial_detections"] += len(adv_boxes)
                m["defended_detections"] += len(def_boxes)
                m["per_image"]["o"].append(len(orig_boxes))
                m["per_image"]["a"].append(len(adv_boxes))
                m["per_image"]["d"].append(len(def_boxes))

                # 类别累计
                for b in orig_boxes:
                    cls = int(b.cls[0].item())
                    name = model.names.get(cls, str(cls))
                    m["original_by_class"][name] = m["original_by_class"].get(name, 0) + 1
                    # 置信度
                    try:
                        m["conf"]["o"].append(float(b.conf[0].item()))
                    except Exception:
                        pass
                for b in adv_boxes:
                    cls = int(b.cls[0].item())
                    name = model.names.get(cls, str(cls))
                    m["adversarial_by_class"][name] = m["adversarial_by_class"].get(name, 0) + 1
                    try:
                        m["conf"]["a"].append(float(b.conf[0].item()))
                    except Exception:
                        pass
                for b in def_boxes:
                    cls = int(b.cls[0].item())
                    name = model.names.get(cls, str(cls))
                    m["defended_by_class"][name] = m["defended_by_class"].get(name, 0) + 1
                    try:
                        m["conf"]["d"].append(float(b.conf[0].item()))
                    except Exception:
                        pass

                # 保存图像
                name = f"{m['total_images']:04d}_" + os.path.basename(img_path)
                cv2.imwrite(os.path.join(det_dir, name), orig_res[0].plot())
                cv2.imwrite(os.path.join(adv_dir, name), adv_res[0].plot())
                cv2.imwrite(os.path.join(def_dir, name), def_res[0].plot())

                # 三联图 Original | Adversarial | Defended
                h, w = img_bgr.shape[:2]
                comp = np.zeros((h, w * 3, 3), dtype=np.uint8)
                comp[:, :w] = cv2.cvtColor(orig_res[0].plot(), cv2.COLOR_BGR2RGB)
                comp[:, w:2*w] = cv2.cvtColor(adv_res[0].plot(), cv2.COLOR_BGR2RGB)
                comp[:, 2*w:] = cv2.cvtColor(def_res[0].plot(), cv2.COLOR_BGR2RGB)
                cv2.imwrite(os.path.join(cmp_dir, name), cv2.cvtColor(comp, cv2.COLOR_RGB2BGR))

                percent = min(100, int((idx + 1) / total_images * 100))
                update_progress(task_id, {
                    "status": "running",
                    "defense_type": defense_type,
                    "attack_name": attack_name,
                    "current_image": idx + 1,
                    "total_images": total_images,
                    "percent": percent,
                    "message": f"正在处理图像 {idx + 1}/{total_images}"
                })

            # 汇总
            import numpy as _np, json as _json
            summary = {
                "avg_inference_time": float(_np.mean(m["inference_times"])) if m["inference_times"] else 0.0,
                "avg_attack_time": float(_np.mean(m["attack_times"])) if m["attack_times"] else 0.0,
                "avg_defense_time": float(_np.mean(m["defense_times"])) if m["defense_times"] else 0.0,
                "detection_retention_rate": (m["defended_detections"] / m["original_detections"]) if m["original_detections"] else 0.0,
                "attack_reduction_rate": (1.0 - (m["adversarial_detections"] / m["original_detections"])) if m["original_detections"] else 0.0,
                "defense_recovery_rate": ((m["defended_detections"] - m["adversarial_detections"]) / (m["original_detections"] if m["original_detections"] else 1)) if m["original_detections"] else 0.0,
                "class_vulnerability_attack": {k: (1.0 - (m["adversarial_by_class"].get(k, 0) / v)) if v else 0.0 for k, v in m["original_by_class"].items()},
                "class_recovery_defense": {k: ((m["defended_by_class"].get(k, 0) - m["adversarial_by_class"].get(k, 0)) / v) if v else 0.0 for k, v in m["original_by_class"].items()},
            }

            out = {
                "total_images": m["total_images"],
                "original_detections": m["original_detections"],
                "adversarial_detections": m["adversarial_detections"],
                "defended_detections": m["defended_detections"],
                "original_detection_by_class": m["original_by_class"],
                "adversarial_detection_by_class": m["adversarial_by_class"],
                "defended_detection_by_class": m["defended_by_class"],
                "summary": summary,
                "defense_params": {"name": defense_type, **defense_kwargs},
                "attack": {"name": attack_name, **attack_params},
            }
            with open(os.path.join(metrics_dir, "defense_metrics.json"), "w", encoding="utf-8") as f:
                _json.dump(out, f, ensure_ascii=False, indent=2)

            # 生成基础三段对比图
            try:
                import matplotlib.pyplot as _plt
                _plt.figure(figsize=(6,4))
                _plt.bar(["Original","Adversarial","Defended"], [m["original_detections"], m["adversarial_detections"], m["defended_detections"]], color=["#3b82f6","#ef4444","#22c55e"])
                _plt.ylabel("Detections")
                _plt.title("Detection Count (O/A/D)")
                _plt.tight_layout()
                _plt.savefig(os.path.join(plots_dir, "detection_count_triplet.png"))
                _plt.close()

                # 类别Top10三段分布
                if m["original_by_class"]:
                    items = sorted(m["original_by_class"].items(), key=lambda x: x[1], reverse=True)[:10]
                    labels = [k for k,_ in items]
                    o = [m["original_by_class"].get(k,0) for k in labels]
                    a = [m["adversarial_by_class"].get(k,0) for k in labels]
                    d = [m["defended_by_class"].get(k,0) for k in labels]
                    x = _np.arange(len(labels)); width = 0.27
                    _plt.figure(figsize=(10,5))
                    _plt.bar(x - width, o, width, label='Orig', color='#3b82f6')
                    _plt.bar(x, a, width, label='Adv', color='#ef4444')
                    _plt.bar(x + width, d, width, label='Def', color='#22c55e')
                    _plt.xticks(x, labels, rotation=45, ha='right')
                    _plt.ylabel('Detections')
                    _plt.title('Top-10 Class Distribution (O/A/D)')
                    _plt.legend(); _plt.tight_layout()
                    _plt.savefig(os.path.join(plots_dir, 'class_distribution_triplet.png'))
                    _plt.close()

                    # 类别恢复率
                    rec = [summary["class_recovery_defense"].get(k,0.0) for k in labels]
                    _plt.figure(figsize=(10,4))
                    _plt.bar(labels, rec, color=['#22c55e' if v>0 else '#ef4444' for v in rec])
                    _plt.xticks(rotation=45, ha='right'); _plt.ylabel('Recovery (Def-Adv)/Orig')
                    _plt.title('Class-wise Recovery (higher=better)')
                    _plt.tight_layout(); _plt.savefig(os.path.join(plots_dir, 'recovery_by_class.png'))
                    _plt.close()
                # 按图像的检测数变化
                if m["per_image"]["o"]:
                    _plt.figure(figsize=(10,4))
                    x = _np.arange(len(m["per_image"]["o"]))
                    _plt.plot(x, m["per_image"]["o"], label='Orig', color='#3b82f6')
                    _plt.plot(x, m["per_image"]["a"], label='Adv', color='#ef4444')
                    _plt.plot(x, m["per_image"]["d"], label='Def', color='#22c55e')
                    _plt.xlabel('Image idx'); _plt.ylabel('Detections'); _plt.title('Detections per Image (O/A/D)')
                    _plt.legend(); _plt.tight_layout(); _plt.savefig(os.path.join(plots_dir,'detection_counts_by_image.png')); _plt.close()

                    # 保留率曲线
                    o = _np.array(m["per_image"]["o"], dtype=float)
                    adv_rel = (_np.array(m["per_image"]["a"], dtype=float) / _np.maximum(o, 1))
                    def_rel = (_np.array(m["per_image"]["d"], dtype=float) / _np.maximum(o, 1))
                    _plt.figure(figsize=(10,4))
                    _plt.plot(x, adv_rel, label='Adv/Orig', color='#ef4444')
                    _plt.plot(x, def_rel, label='Def/Orig', color='#22c55e')
                    _plt.ylim(0, 1.2)
                    _plt.xlabel('Image idx'); _plt.ylabel('Ratio'); _plt.title('Retention per Image')
                    _plt.legend(); _plt.tight_layout(); _plt.savefig(os.path.join(plots_dir,'retention_by_image.png')); _plt.close()

                # 置信度分布三段
                if any(m["conf"].values()):
                    _plt.figure(figsize=(12,4))
                    _plt.subplot(1,3,1); _plt.hist(m["conf"]["o"], bins=20, color='#3b82f6', alpha=0.8); _plt.title('Original Confidence')
                    _plt.subplot(1,3,2); _plt.hist(m["conf"]["a"], bins=20, color='#ef4444', alpha=0.8); _plt.title('Adversarial Confidence')
                    _plt.subplot(1,3,3); _plt.hist(m["conf"]["d"], bins=20, color='#22c55e', alpha=0.8); _plt.title('Defended Confidence')
                    _plt.tight_layout(); _plt.savefig(os.path.join(plots_dir,'confidence_distribution_triplet.png')); _plt.close()

                # 类别恢复（绝对差值）
                if m["original_by_class"]:
                    labels = list(m["original_by_class"].keys())
                    delta = [m["defended_by_class"].get(k,0) - m["adversarial_by_class"].get(k,0) for k in labels]
                    _plt.figure(figsize=(10,4))
                    _plt.bar(labels, delta, color=['#22c55e' if v>0 else '#ef4444' for v in delta])
                    _plt.xticks(rotation=45, ha='right'); _plt.ylabel('Def-Adv'); _plt.title('Class-wise Delta (Def - Adv)')
                    _plt.tight_layout(); _plt.savefig(os.path.join(plots_dir,'delta_by_class.png')); _plt.close()

            except Exception as _e:
                print(f"生成三段对比图失败: {_e}")

            update_progress(task_id, {
                "status": "completed",
                "defense_type": defense_type,
                "attack_name": attack_name,
                "current_image": total_images,
                "total_images": total_images,
                "percent": 100,
                "message": "防御评估完成",
                "metrics": summary,
            })

            return {
                "status": "Completed",
                "result_path": save_dir,
                "num_images_tested": total_images,
                "defense_type": defense_type,
                "metrics": summary,
            }

        # 否则回退到“干净→防御”的对比评估
        evaluator = DefenseEvaluator(
            model=model,
            defense=defense,
            save_dir=save_dir,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )
        evaluator.metrics["defense_params"] = {"name": defense_type, **defense_kwargs}

        for idx, img_path in enumerate(image_paths):
            evaluator.evaluate_image(img_path)
            percent = min(100, int((idx + 1) / total_images * 100))
            update_progress(task_id, {
                "status": "running",
                "defense_type": defense_type,
                "current_image": idx + 1,
                "total_images": total_images,
                "percent": percent,
                "message": f"正在处理图像 {idx + 1}/{total_images}"
            })

        evaluator._summarize()
        evaluator.generate_visualizations()
        evaluator._save_metrics()

        metrics_summary = evaluator.metrics.get("summary", {})
        update_progress(task_id, {
            "status": "completed",
            "defense_type": defense_type,
            "current_image": total_images,
            "total_images": total_images,
            "percent": 100,
            "message": "防御评估完成",
            "metrics": metrics_summary
        })

        return {
            "status": "Completed",
            "result_path": save_dir,
            "num_images_tested": total_images,
            "defense_type": defense_type,
            "metrics": metrics_summary
        }

    except Exception as e:
        error_path = os.path.join("results", "defense_results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
            f.write("\n")
            traceback.print_exc(file=f)
        print(f"Error in defense eval task {task_id}: {str(e)}")
        traceback.print_exc()
        raise e

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
            "--result_file", result_file,
            "--workers", "2",
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
            result = original_evaluate_image(image_path)
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