from __future__ import annotations

import os
import json
import time
import traceback
from typing import Any, Dict, List, Optional

# 统一从全局 Celery 实例注册任务
from celery_app import celery_app
from celery.result import AsyncResult


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _write_json(path: str, data: Dict[str, Any]) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def _append_error(result_dir: str, message: str) -> None:
    error_file = os.path.join(result_dir, "error.txt")
    try:
        with open(error_file, "a") as f:
            f.write(message.strip() + "\n")
    except Exception:
        pass


def _update_progress(result_dir: str, progress: Dict[str, Any]) -> None:
    progress_file = os.path.join(result_dir, "progress.json")
    progress.setdefault("status", "running")
    progress.setdefault("percent", 0)
    progress.setdefault("message", "")
    _write_json(progress_file, progress)


def _send_and_wait(task_name: str, kwargs: Dict[str, Any], timeout: Optional[int] = None) -> Dict[str, Any]:
    """
    发送一个已注册的 Celery 任务并等待返回结果字典。
    若任务失败，抛出异常。
    """
    task = celery_app.send_task(task_name, kwargs=kwargs)
    result = AsyncResult(task.id, app=celery_app)
    return result.get(timeout=timeout)  # 可能返回 None 或 dict，按各任务实现而定


def _build_steps_from_scenario(scenario: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    将前端场景描述转为执行步骤序列。
    简化策略：
    - 按 attacks -> defenses 的顺序顺序执行
    - 可选在 future 支持 schedule.sequence 与 parallel
    """
    steps: List[Dict[str, Any]] = []

    attacks = scenario.get("attacks") or []
    defenses = scenario.get("defenses") or []
    params = scenario.get("parameters") or {}
    attack_params: Dict[str, Any] = params.get("attack_params") or {}

    # 攻击步骤映射
    for attack_id in attacks:
        per_attack: Dict[str, Any] = attack_params.get(attack_id) or {}
        steps.append({
            "kind": "attack",
            "task": "attack.run",
            "kwargs": {
                # 统一 task_id 由外层注入
                "attack_name": attack_id,
                # 默认参数回退（由底层任务自行处理也可）
                "model_name": per_attack.get("model_name", params.get("model_name", "yolov8s-visdrone")),
                "dataset_name": per_attack.get("dataset_name", params.get("dataset_name", "VisDrone")),
                "num_images": int(per_attack.get("num_images", params.get("num_images", 10))),
                # 常见攻击参数（按需覆盖）
                "eps": per_attack.get("eps", params.get("eps", "8/255")),
                "alpha": per_attack.get("alpha", params.get("alpha", "2/255")),
                "steps": int(per_attack.get("steps", params.get("steps", 10))),
                # 其他可选参数（如 cw、patch、光电等）
                **({"confidence": per_attack["confidence"]} if "confidence" in per_attack else {}),
                **({"lr": per_attack["lr"]} if "lr" in per_attack else {}),
                **({"initial_const": per_attack["initial_const"]} if "initial_const" in per_attack else {}),
                **({"patch_size": per_attack["patch_size"]} if "patch_size" in per_attack else {}),
                **({"brightness_factor": per_attack["brightness_factor"]} if "brightness_factor" in per_attack else {}),
                **({"noise_std": per_attack["noise_std"]} if "noise_std" in per_attack else {}),
                **({"contrast_factor": per_attack["contrast_factor"]} if "contrast_factor" in per_attack else {}),
                **({"max_iter": per_attack["max_iter"]} if "max_iter" in per_attack else {}),
                **({"overshoot": per_attack["overshoot"]} if "overshoot" in per_attack else {}),
                **({"lr": per_attack["learning_rate"]} if "learning_rate" in per_attack else {}),
                **({"random_locations": per_attack["random_locations"]} if "random_locations" in per_attack else {}),
                **({"num_patches": per_attack["num_patches"]} if "num_patches" in per_attack else {}),
                **({"distortion_type": per_attack["distortion_type"]} if "distortion_type" in per_attack else {}),
                **({"severity": per_attack["severity"]} if "severity" in per_attack else {}),
                **({"transition_type": per_attack["transition_type"]} if "transition_type" in per_attack else {}),
                    # 兼容：部分前端将 advpatch 的最大迭代填写为 max_iter，这里映射为 steps
                    **({"steps": int(per_attack["max_iter"]) } if "max_iter" in per_attack else {}),
            }
        })

    # 防御步骤映射
    for defense_id in defenses:
        if defense_id in {"preprocessing"}:
            steps.append({
                "kind": "defense_eval",
                "task": "defense.eval",
                "kwargs": {
                    "defense_type": params.get("defense_type", "gaussian_blur"),
                    "model_name": params.get("model_name", "yolov8s-visdrone"),
                    "dataset_name": params.get("dataset_name", "VisDrone"),
                    "num_images": int(params.get("num_images", 10)),
                    "conf_threshold": float(params.get("conf_threshold", 0.25)),
                    "iou_threshold": float(params.get("iou_threshold", 0.5)),
                    # 若前一步有 attack，可继承其参数
                    "attack_name": params.get("attack_name", "pgd"),
                    "eps": params.get("eps", "8/255"),
                    "alpha": params.get("alpha", "2/255"),
                    "steps": int(params.get("steps", 10)),
                    # 具体预处理参数（按需生效）
                    **({"ksize": int(params["ksize"]) } if params.get("ksize") is not None else {}),
                    **({"sigma": float(params["sigma"]) } if params.get("sigma") is not None else {}),
                    **({"quality": int(params["quality"]) } if params.get("quality") is not None else {}),
                    **({"bits": int(params["bits"]) } if params.get("bits") is not None else {}),
                }
            })
        elif defense_id in {"detection"}:
            steps.append({
                "kind": "defense_detect",
                "task": "defense.detect.statistical",
                "kwargs": {
                    "model_name": params.get("model_name", "yolov8s-visdrone"),
                    "dataset_name": params.get("dataset_name", "VisDrone"),
                    "num_images": int(params.get("num_images", 10)),
                    "conf_threshold": float(params.get("conf_threshold", 0.25)),
                    "iou_threshold": float(params.get("iou_threshold", 0.5)),
                    "threshold": float(params.get("threshold", 0.35)),
                    "alpha": float(params.get("alpha_stats", 0.6)),
                    "hf_ratio": float(params.get("hf_ratio", 0.1)),
                    # 可选攻击链路
                    "attack_name": params.get("attack_name"),
                    "eps": params.get("eps", "8/255"),
                    "alpha_attack": params.get("alpha", "2/255"),
                    "steps": int(params.get("steps", 10)),
                }
            })
        elif defense_id in {"pgd_training", "fgm", "freeadv", "yopo", "freelb"}:
            steps.append({
                "kind": "defense_train",
                "task": "defense.train",
                "kwargs": {
                    "defense_type": (
                        "pgd" if defense_id == "pgd_training" else
                        "fgm" if defense_id == "fgm" else
                        "freeat" if defense_id == "freeadv" else
                        "yopo" if defense_id == "yopo" else
                        "freelb"
                    ),
                    "base_model": params.get("base_model", "yolov8s.pt"),
                    "data_yaml": params.get("data_yaml", "backend/datasets/VisDrone_Dataset/visdrone.yaml"),
                    "epochs": int(params.get("epochs", 30)),
                    "imgsz": int(params.get("imgsz", 640)),
                    "batch": int(params.get("batch", 16)),
                    "model_name": params.get("model_name"),
                    "device": params.get("device", 0),
                    "eps": params.get("eps", "8/255"),
                    "alpha": params.get("alpha", "2/255"),
                    "steps": params.get("steps"),
                    "attack_ratio": float(params.get("attack_ratio", 0.5)),
                }
            })

    return steps


def run_scenario_task(task_id: str, scenario: Dict[str, Any]) -> Dict[str, Any]:
    """
    执行自定义场景：将多个已实现的原子任务（攻击/防御/训练）编排顺序执行。

    参数
    - task_id: 外层生成的场景ID（即 scenario_id）
    - scenario: 前端传入的场景描述
    """
    result_dir = os.path.join("results", "scenario_results", task_id)
    _ensure_dir(result_dir)

    meta = {
        "task_id": task_id,
        "task_type": "scenario_results",
        "scenario": scenario,
    }
    _write_json(os.path.join(result_dir, "metadata.json"), meta)

    steps = _build_steps_from_scenario(scenario)

    total = max(1, len(steps))
    _update_progress(result_dir, {
        "status": "running",
        "message": "场景开始执行",
        "task_group": "scenario",
        "percent": 0,
        "total_steps": total,
        "current_step": 0,
    })

    step_results: List[Dict[str, Any]] = []

    try:
        for idx, step in enumerate(steps, start=1):
            kind = step.get("kind")
            task_name = step.get("task")
            kwargs = dict(step.get("kwargs") or {})
            # 将当前场景 task_id 作为下游子任务的 task_id，便于结果汇聚与可视化
            kwargs.setdefault("task_id", task_id)

            _update_progress(result_dir, {
                "status": "running",
                "message": f"执行步骤 {idx}/{total}: {kind or task_name}",
                "task_group": "scenario",
                "percent": int((idx - 1) * 100 / total),
                "current_step": idx,
                "total_steps": total,
            })

            try:
                ret = _send_and_wait(task_name, kwargs)
            except Exception as e:
                _append_error(result_dir, f"子任务失败[{task_name}]: {e}\n{traceback.format_exc()}")
                raise

            step_results.append({
                "kind": kind,
                "task": task_name,
                "kwargs": kwargs,
                "result": ret,
            })

        _update_progress(result_dir, {
            "status": "completed",
            "message": "场景执行完成",
            "task_group": "scenario",
            "percent": 100,
            "current_step": total,
            "total_steps": total,
        })

        summary = {"steps": len(steps)}
        _write_json(os.path.join(result_dir, "summary.json"), summary)
        return {"status": "completed", "task_id": task_id, "steps": len(steps)}

    except Exception as e:
        _update_progress(result_dir, {
            "status": "failed",
            "message": f"场景失败: {e}",
            "task_group": "scenario",
            "percent": 0,
        })
        return {"status": "failed", "task_id": task_id, "error": str(e)}


# 显式注册为 Celery 任务名，便于通过字符串名称调用
run_scenario_task = celery_app.task(name="scenario.run")(run_scenario_task)


