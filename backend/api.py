# 引入 FastAPI 核心组件与类型支持
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, File, UploadFile
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional, Union
from celery.result import AsyncResult
from uuid import uuid4
import os
import json

# 引入 Celery 异步任务
from celery_app import celery_app, test_model_task, run_attack_task, run_defense_task

# 引入自定义功能函数（同步任务）
import download_dataset  # 或 from function import some_function

# 创建 API 路由对象（用于模块化组织接口）
router = APIRouter(
    prefix="/api", 
    tags=["General"], 
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"}
    }
)

@router.get("/ping")
async def ping():
    """
    API健康检查
    """
    return {"msg": "pong"}

@router.post("/model/test")
async def test_model(
    model_name: str = "yolov8s-visdrone", 
    dataset_name: str = "VisDrone", 
    num_images: int = 20,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.5
):
    """
    启动模型测试任务，评估模型在指定数据集上的性能
    """
    task_id = str(uuid4())
    task = test_model_task.delay(
        task_id,
        model_name=model_name, 
        dataset_name=dataset_name,
        num_images=num_images,
        conf_threshold=conf_threshold,
        iou_threshold=iou_threshold
    )
    return {"task_id": task_id, "celery_task_id": task.id}

@router.post("/attack/run")
async def run_attack(
    attack_name: str = "pgd",
    model_name: str = "yolov8s-visdrone",
    dataset_name: str = "VisDrone",
    num_images: int = 10,
    eps: str = "8/255",
    alpha: str = "2/255",
    steps: int = 10,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.5
):
    """
    启动对抗攻击任务，支持动态指定攻击算法
    
    参数:
    - attack_name: 攻击算法名称，如 "pgd", "fgsm" 等
    - model_name: 模型名称
    - dataset_name: 数据集名称
    - num_images: 评估图像数量，-1表示全部
    - eps: 最大扰动大小 (如 "8/255")
    - alpha: 每步扰动大小 (如 "2/255")，仅PGD等迭代攻击使用
    - steps: 攻击迭代步数，仅迭代攻击使用
    - conf_threshold: 置信度阈值
    - iou_threshold: IoU阈值
    """
    task_id = str(uuid4())
    task = run_attack_task.delay(
        task_id=task_id,
        attack_name=attack_name,
        model_name=model_name,
        dataset_name=dataset_name,
        num_images=num_images,
        eps=eps,
        alpha=alpha,
        steps=steps,
        conf_threshold=conf_threshold,
        iou_threshold=iou_threshold
    )
    return {"task_id": task_id, "celery_task_id": task.id}

@router.post("/defense/run")
async def run_defense(
    defense_type: str = "gaussian_blur",
    params: Optional[Dict[str, Any]] = None
):
    """
    启动防御任务，应用防御策略并评估效果
    """
    if params is None:
        params = {}
    
    task_id = str(uuid4())
    task = run_defense_task.delay(task_id, defense_type=defense_type, params=params)
    return {"task_id": task_id, "celery_task_id": task.id}

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    获取任务状态和结果
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



