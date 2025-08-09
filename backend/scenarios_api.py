from fastapi import APIRouter, HTTPException
from typing import Any, Dict, Optional
from uuid import uuid4
import os
import json

from celery.result import AsyncResult
from celery_app import celery_app


router = APIRouter(
    prefix="/scenarios",
    tags=["Scenarios"],
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"},
    },
)


def _read_json(path: str) -> Optional[Dict[str, Any]]:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return None


@router.post("/run")
async def run_scenario(scenario: Dict[str, Any]):
    """
    启动自定义场景任务：将多步骤攻击/防御编排执行。
    返回：统一的 task_id(=scenario_id) 与 Celery 任务ID
    """
    task_id = str(uuid4())
    scenario_run = celery_app.tasks.get("scenario.run")
    if scenario_run is None:
        raise HTTPException(status_code=500, detail="后端未注册 scenario.run 任务")

    task = scenario_run.delay(task_id=task_id, scenario=scenario)
    return {"task_id": task_id, "celery_task_id": task.id}


@router.get("/{task_id}")
async def get_scenario_status(task_id: str):
    """
    获取场景执行进度/状态。优先读取 results/scenario_results/<task_id>/progress.json
    回退到 Celery 状态查询。
    """
    result_dir = os.path.join("results", "scenario_results", task_id)
    progress_file = os.path.join(result_dir, "progress.json")
    progress = _read_json(progress_file)
    if progress:
        return progress

    # 回退：Celery 状态
    task_result = AsyncResult(task_id, app=celery_app)
    state = task_result.state
    if state == "PENDING":
        return {"state": state, "status": "任务等待中..."}
    elif state == "FAILURE":
        return {"state": state, "status": "任务失败", "error": str(task_result.info)}
    else:
        resp: Dict[str, Any] = {
            "state": state,
            "status": "任务进行中" if state == "PROGRESS" else "任务完成",
        }
        if task_result.info:
            if isinstance(task_result.info, dict):
                resp.update(task_result.info)
            else:
                resp["info"] = str(task_result.info)
        return resp


