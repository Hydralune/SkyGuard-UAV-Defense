# 引入 FastAPI 核心组件与类型支持
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, File, UploadFile
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional, Union
from celery.result import AsyncResult
from uuid import uuid4
import os
import json

# 引入Celery任务
from celery_app import celery_app
# 不再直接导入任务函数，而是使用celery_app中已注册的任务
# from airsim_task.airsim_tasks import drone_mission_task

# 创建 API 路由对象（用于模块化组织接口）
router = APIRouter(
    prefix="/airsim", 
    tags=["airsim"], 
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"}
    }
)

# 获取已注册的任务
drone_mission = celery_app.tasks['airsim.drone_mission']

@router.post("/drone/mission")
async def start_drone_mission(
    ip: str = "172.21.208.1",
    port: int = 41451,
    step: Optional[str] = "demo"
):
    """
    启动无人机任务
    
    参数:
    - ip: AirSim服务器IP地址
    - port: AirSim服务器端口
    - step: 执行步骤，可选值: 
        - "connect": 连接到AirSim
        - "takeoff": 起飞
        - "move": 移动到指定位置
        - "image": 拍摄图像
        - "reset": 重置无人机状态
        - "all": 执行所有步骤
        - "demo": 执行完整演示流程（默认）
    """
    task_id = str(uuid4())
    task = drone_mission.delay(task_id=task_id, ip=ip, port=port, step=step)
    return {"task_id": task_id, "celery_task_id": task.id}

@router.post("/drone/mission/{task_id}")
async def continue_drone_mission(
    task_id: str,
    ip: str = "172.21.208.1",
    port: int = 41451,
    step: str = None
):
    """
    继续执行现有无人机任务的下一步骤
    
    参数:
    - task_id: 任务ID
    - ip: AirSim服务器IP地址
    - port: AirSim服务器端口
    - step: 执行步骤
    """
    task = drone_mission.delay(task_id=task_id, ip=ip, port=port, step=step)
    return {"task_id": task_id, "celery_task_id": task.id}

@router.get("/drone/mission/{task_id}/status")
async def get_mission_status(task_id: str):
    """
    获取无人机任务状态
    
    参数:
    - task_id: 任务ID
    """
    # 尝试从文件中读取任务状态
    status_file = os.path.join("results", "airsim_results", task_id, "status.json")
    if os.path.exists(status_file):
        with open(status_file, "r") as f:
            status = json.load(f)
        return status
    
    # 如果文件不存在，返回404
    raise HTTPException(status_code=404, detail="任务不存在")

@router.get("/drone/mission/{task_id}/image/{image_name}")
async def get_mission_image(task_id: str, image_name: str):
    """
    获取无人机任务图像
    
    参数:
    - task_id: 任务ID
    - image_name: 图像文件名
    """
    image_path = os.path.join("results", "airsim_results", task_id, image_name)
    if os.path.exists(image_path):
        return FileResponse(image_path)
    
    # 如果文件不存在，返回404
    raise HTTPException(status_code=404, detail="图像不存在")

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    获取Celery任务状态
    
    参数:
    - task_id: Celery任务ID
    """
    task_result = AsyncResult(task_id, app=celery_app)
    if task_result.state == 'PENDING':
        response = {
            'state': task_result.state,
            'status': '任务等待中...'
        }
    elif task_result.state == 'FAILURE':
        response = {
            'state': task_result.state,
            'status': '任务失败',
            'error': str(task_result.info)
        }
    else:
        response = {
            'state': task_result.state,
            'status': '任务进行中' if task_result.state == 'PROGRESS' else '任务完成',
        }
        if task_result.info:
            response.update(task_result.info)
    
    return response
