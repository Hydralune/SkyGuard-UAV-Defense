from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import os
import json
import time

try:
    import psutil  # type: ignore
except Exception as e:
    psutil = None  # 在无psutil环境下，仍可加载模块，调用时抛错


router = APIRouter(
    prefix="/system",
    tags=["System"],
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"},
    },
)


@router.get("/load")
async def get_system_load():
    """
    获取系统负载信息：CPU、内存、磁盘、平均负载。
    """
    if psutil is None:
        raise HTTPException(status_code=500, detail="psutil 未安装，请在后端安装依赖 psutil")

    try:
        cpu_percent = psutil.cpu_percent(interval=0.2)
        vm = psutil.virtual_memory()
        du = psutil.disk_usage("/")
        try:
            load1, load5, load15 = os.getloadavg()
        except Exception:
            load1 = load5 = load15 = 0.0

        net = psutil.net_io_counters()

        return {
            "cpu_percent": cpu_percent,
            "memory": {
                "total": vm.total,
                "used": vm.used,
                "percent": vm.percent,
            },
            "disk": {
                "total": du.total,
                "used": du.used,
                "percent": du.percent,
            },
            "load_avg": [load1, load5, load15],
            "net": {
                "bytes_sent": getattr(net, 'bytes_sent', None),
                "bytes_recv": getattr(net, 'bytes_recv', None),
            },
            "timestamp": time.time(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取系统负载失败: {str(e)}")


def _collect_task_logs(base_dir: str, type_label: str) -> List[Dict[str, Any]]:
    logs: List[Dict[str, Any]] = []
    if not os.path.exists(base_dir):
        return logs

    for task_id in os.listdir(base_dir):
        task_dir = os.path.join(base_dir, task_id)
        if not os.path.isdir(task_dir):
            continue

        # progress.json
        progress_file = os.path.join(task_dir, "progress.json")
        if os.path.exists(progress_file):
            try:
                with open(progress_file, "r") as f:
                    data = json.load(f)
                ts = data.get("timestamp")
                # 转换为epoch
                try:
                    # ISO格式处理
                    import datetime

                    dt = datetime.datetime.fromisoformat(ts) if isinstance(ts, str) else None
                    ts_epoch = dt.timestamp() if dt else os.path.getmtime(progress_file)
                except Exception:
                    ts_epoch = os.path.getmtime(progress_file)

                message = data.get("message") or data.get("status") or "状态更新"
                status = (data.get("status") or "").lower()
                severity = "info"
                if status in ("completed", "success", "succeeded"):
                    severity = "success"
                elif status in ("failed", "failure", "error"):
                    severity = "error"

                meta = {
                    k: v
                    for k, v in data.items()
                    if k
                    in (
                        "attack_name",
                        "defense_type",
                        "model_name",
                        "dataset_name",
                        "current_image",
                        "total_images",
                        "current_epoch",
                        "total_epochs",
                        "percent",
                    )
                }

                logs.append(
                    {
                        "task_id": task_id,
                        "type": type_label,
                        "severity": severity,
                        "message": message,
                        "timestamp": ts_epoch,
                        "meta": meta,
                    }
                )
            except Exception:
                pass

        # error.txt 作为错误日志
        error_file = os.path.join(task_dir, "error.txt")
        if os.path.exists(error_file):
            try:
                ts_epoch = os.path.getmtime(error_file)
                with open(error_file, "r") as f:
                    err_msg = f.read().strip()[:500]
                logs.append(
                    {
                        "task_id": task_id,
                        "type": type_label,
                        "severity": "error",
                        "message": err_msg or "任务错误",
                        "timestamp": ts_epoch,
                        "meta": {},
                    }
                )
            except Exception:
                pass

    return logs


@router.get("/logs")
async def get_system_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """
    聚合系统日志：汇总攻防评估与训练的进度与错误，按时间倒序。
    数据来源：results/*/progress.json 与 error.txt
    """
    try:
        result_dirs = [
            (os.path.join("results", "adversarial_results"), "attack"),
            (os.path.join("results", "defense_results"), "defense"),
            (os.path.join("results", "evaluation_results"), "evaluation"),
            (os.path.join("results", "airsim_results"), "airsim"),
            (os.path.join("results", "scenario_results"), "scenario"),
        ]

        logs: List[Dict[str, Any]] = []
        for base_dir, type_label in result_dirs:
            logs.extend(_collect_task_logs(base_dir, type_label))

        # 时间倒序
        logs.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return logs[: max(1, min(500, limit))]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取系统日志失败: {str(e)}")


