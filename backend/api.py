# 引入 FastAPI 核心组件与类型支持
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, File, UploadFile
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional, Union
from celery.result import AsyncResult
from uuid import uuid4
import os
import json

# 引入 Celery 异步任务
from celery_app import (
    celery_app,
    test_model_task,
    run_attack_task,
    run_defense_task,
    adv_defense_train_task,
    run_defense_eval_task,
)

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
    iou_threshold: float = 0.5,
    confidence: float = 0,
    lr: float = 0.01,
    initial_const: float = 0.1,
    patch_size: int = 30,
    brightness_factor: float = 1.5,
    noise_std: float = 0.1,
    contrast_factor: float = 1.5
):
    """
    启动对抗攻击任务，支持动态指定攻击算法
    
    参数:
    - attack_name: 攻击算法名称，如 "pgd", "fgsm", "cw_l2", "dpatch", "brightness", "gaussian", "contrast" 等
    - model_name: 模型名称
    - dataset_name: 数据集名称
    - num_images: 评估图像数量，-1表示全部
    - eps: 最大扰动大小 (如 "8/255")
    - alpha: 每步扰动大小 (如 "2/255")，仅PGD等迭代攻击使用
    - steps: 攻击迭代步数，仅迭代攻击使用
    - conf_threshold: 置信度阈值
    - iou_threshold: IoU阈值
    - confidence: 对抗样本置信度，仅CW_L2攻击使用
    - lr: 攻击学习率，仅CW_L2攻击使用
    - initial_const: 初始权衡常数c，仅CW_L2攻击使用
    - patch_size: DPatch攻击的贴片大小
    - brightness_factor: 亮度攻击的亮度调整因子
    - noise_std: 高斯噪声攻击的噪声标准差
    - contrast_factor: 对比度攻击的对比度调整因子
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
        iou_threshold=iou_threshold,
        confidence=confidence,
        lr=lr,
        initial_const=initial_const,
        patch_size=patch_size,
        brightness_factor=brightness_factor,
        noise_std=noise_std,
        contrast_factor=contrast_factor
    )
    return {"task_id": task_id, "celery_task_id": task.id}

@router.post("/defense/run")
async def run_defense(
    defense_type: str = "gaussian_blur",
    # 通用评估参数
    model_name: str = "yolov8s-visdrone",
    dataset_name: str = "VisDrone",
    num_images: int = 10,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.5,
    # 预处理防御参数
    ksize: Optional[int] = None,
    sigma: Optional[float] = None,
    quality: Optional[int] = None,
    bits: Optional[int] = None,
    # 兼容旧版：接收 params 字典并合并
    params: Optional[Dict[str, Any]] = None,
):
    """
    启动防御评估任务（输入预处理类），生成对比与指标，可配合 /visualization 使用。
    支持的防御：gaussian_blur, median_blur, jpeg_compression, bit_depth_reduction。
    """
    merged_params: Dict[str, Any] = {}
    if params:
        merged_params.update(params)
    if ksize is not None:
        merged_params["ksize"] = ksize
    if sigma is not None:
        merged_params["sigma"] = sigma
    if quality is not None:
        merged_params["quality"] = quality
    if bits is not None:
        merged_params["bits"] = bits

    task_id = str(uuid4())
    task = run_defense_eval_task.delay(
        task_id=task_id,
        defense_type=defense_type,
        model_name=model_name,
        dataset_name=dataset_name,
        num_images=num_images,
        conf_threshold=conf_threshold,
        iou_threshold=iou_threshold,
        **merged_params,
    )
    return {"task_id": task_id, "celery_task_id": task.id}


@router.post("/defense/train")
async def train_defense(
    defense_type: str = "pgd",
    base_model: str = "yolov8s.pt",
    data_yaml: str = "backend/datasets/VisDrone_Dataset/visdrone.yaml",
    epochs: int = 30,
    imgsz: int = 640,
    batch: int = 16,
    model_name: Optional[str] = None,
    device: Union[str, int] = 0,
    eps: str = "8/255",
    alpha: str = "2/255",
    steps: Optional[int] = None,
    attack_ratio: float = 0.5
):
    """
    启动对抗训练防御任务
    
    参数:
    - defense_type: 防御算法类型，支持 "pgd", "fgm", "freeat", "yopo", "freelb" 等
    - base_model: 基础模型路径或名称
    - data_yaml: 数据集YAML定义路径
    - epochs: 训练轮数
    - imgsz: 输入图像大小
    - batch: 批次大小
    - model_name: 训练后的模型名称，如果为None则自动生成
    - device: CUDA设备ID或"cpu"
    - eps: 最大扰动幅度 (例如: "8/255")
    - alpha: 单步扰动大小 (例如: "2/255")
    - steps: 对抗攻击步数，如果为None则根据防御类型自动设置
    - attack_ratio: 训练批次中使用对抗样本的比例
    """
    task_id = str(uuid4())
    task = adv_defense_train_task.delay(
        task_id=task_id,
        defense_type=defense_type,
        base_model=base_model,
        data_yaml=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        model_name=model_name,
        device=device,
        eps=eps,
        alpha=alpha,
        steps=steps,
        attack_ratio=attack_ratio
    )
    return {"task_id": task_id, "celery_task_id": task.id, "defense_type": defense_type}

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



