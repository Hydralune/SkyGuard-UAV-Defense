# 引入 FastAPI 核心组件与类型支持
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Optional
from celery.result import AsyncResult
from uuid import uuid4
import os
import json

# ✅ 只引入 celery_app，不访问 tasks registry
from celery_app import celery_app


# 创建 API 路由对象（用于模块化组织接口）
router = APIRouter(
    prefix="/airsim",
    tags=["airsim"],
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"}
    }
)


@router.post("/drone/mission")
async def start_drone_mission(
    ip: str = "172.21.208.1",
    port: int = 41451,
    step: Optional[str] = "demo"
):
    """
    启动无人机任务
    """
    task_id = str(uuid4())

    payload = {
        "task_id": task_id,
        "ip": ip,
        "port": port,
        "step": step
    }

    # ✅ 正确方式：send_task（不依赖 registry）
    celery_task = celery_app.send_task(
        "airsim.drone_mission",
        kwargs=payload
    )

    return {
        "task_id": task_id,
        "celery_task_id": celery_task.id
    }


@router.post("/drone/mission/{task_id}")
async def continue_drone_mission(
    task_id: str,
    ip: str = "172.21.208.1",
    port: int = 41451,
    step: Optional[str] = None
):
    """
    继续执行现有无人机任务的下一步骤
    """
    payload = {
        "task_id": task_id,
        "ip": ip,
        "port": port,
        "step": step
    }

    celery_task = celery_app.send_task(
        "airsim.drone_mission",
        kwargs=payload
    )

    return {
        "task_id": task_id,
        "celery_task_id": celery_task.id
    }


@router.get("/drone/mission/{task_id}/status")
async def get_mission_status(task_id: str):
    """
    获取无人机任务状态（从结果文件）
    """
    status_file = os.path.join(
        "results", "airsim_results", task_id, "status.json"
    )

    if os.path.exists(status_file):
        with open(status_file, "r") as f:
            return json.load(f)

    raise HTTPException(status_code=404, detail="任务不存在")


@router.get("/drone/mission/{task_id}/image/{image_name}")
async def get_mission_image(task_id: str, image_name: str):
    """
    获取无人机任务图像
    """
    image_path = os.path.join(
        "results", "airsim_results", task_id, image_name
    )

    if os.path.exists(image_path):
        return FileResponse(image_path)

    raise HTTPException(status_code=404, detail="图像不存在")


@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    获取 Celery 任务状态
    """
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state == "PENDING":
        return {
            "state": task_result.state,
            "status": "任务等待中..."
        }

    if task_result.state == "FAILURE":
        return {
            "state": task_result.state,
            "status": "任务失败",
            "error": str(task_result.info)
        }

    response = {
        "state": task_result.state,
        "status": (
            "任务进行中"
            if task_result.state in ("PROGRESS", "STARTED")
            else "任务完成"
        )
    }

    if task_result.info:
        response.update(task_result.info)

    return response
