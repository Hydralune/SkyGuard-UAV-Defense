# backend/visualization_api.py
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional
import os
import json
from pathlib import Path
import glob

# 引入可视化工具
from utils.visualizer import Visualizer

# 创建API路由
router = APIRouter(
    prefix="/visualization", 
    tags=["Visualization"], 
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"}
    }
)

@router.get("/latest-task")
async def get_latest_task():
    """
    获取最新完成的任务ID
    
    返回:
        最新完成任务的ID和基本信息
    """
    try:
        # 检查不同类型的结果目录
        result_dirs = [
            ("adversarial_results", "results/adversarial_results"),
            ("defense_results", "results/defense_results"), 
            ("evaluation_results", "results/evaluation_results")
        ]
        
        latest_task = None
        latest_time = 0
        
        for task_type, base_dir in result_dirs:
            if not os.path.exists(base_dir):
                continue
                
            for task_id in os.listdir(base_dir):
                task_dir = os.path.join(base_dir, task_id)
                if not os.path.isdir(task_dir):
                    continue
                    
                # 检查任务目录的修改时间
                mtime = os.path.getmtime(task_dir)
                
                # 检查progress.json文件获取任务信息
                progress_file = os.path.join(task_dir, "progress.json")
                task_data = {
                    "task_id": task_id,
                    "task_type": task_type,
                    "timestamp": mtime
                }
                
                if os.path.exists(progress_file):
                    try:
                        with open(progress_file, 'r') as f:
                            progress_data = json.load(f)
                        task_data.update({
                            "status": progress_data.get("status", "unknown"),
                            "attack_name": progress_data.get("attack_name"),
                            "message": progress_data.get("message")
                        })
                    except Exception as e:
                        print(f"读取进度文件失败: {e}")
                
                if mtime > latest_time:
                    latest_time = mtime
                    latest_task = task_data
        
        if latest_task:
            return latest_task
        else:
            raise HTTPException(status_code=404, detail="未找到任何完成的任务")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取最新任务失败: {str(e)}")

@router.get("/recent-tasks")
async def get_recent_tasks(limit: int = 10):
    """
    获取最近完成的多个任务（按时间倒序），包含任务类型与部分元信息。
    
    参数:
        limit: 返回的任务数量上限
    返回:
        任务信息列表 [{task_id, task_type, timestamp, status, attack_name, defense_type, message}]
    """
    try:
        result_dirs = [
            ("adversarial_results", "results/adversarial_results"),
            ("defense_results", "results/defense_results"),
            ("evaluation_results", "results/evaluation_results"),
        ]

        tasks = []
        for task_type, base_dir in result_dirs:
            if not os.path.exists(base_dir):
                continue
            for task_id in os.listdir(base_dir):
                task_dir = os.path.join(base_dir, task_id)
                if not os.path.isdir(task_dir):
                    continue
                mtime = os.path.getmtime(task_dir)

                task_data = {
                    "task_id": task_id,
                    "task_type": task_type,
                    "timestamp": mtime,
                }

                progress_file = os.path.join(task_dir, "progress.json")
                if os.path.exists(progress_file):
                    try:
                        with open(progress_file, "r") as f:
                            progress_data = json.load(f)
                        task_data.update({
                            "status": progress_data.get("status", "unknown"),
                            "attack_name": progress_data.get("attack_name"),
                            "defense_type": progress_data.get("defense_type"),
                            "message": progress_data.get("message"),
                        })
                    except Exception as e:
                        print(f"读取进度文件失败: {e}")

                tasks.append(task_data)

        # 按时间倒序并截断数量
        tasks.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return tasks[: max(1, min(100, limit))]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取最近任务失败: {str(e)}")

@router.get("/results/{task_id}")
async def get_task_results(task_id: str):
    """
    获取任务的可视化结果列表
    
    参数:
        task_id: 任务ID
        
    返回:
        任务结果列表，包含图像路径和元数据
    """
    # 检查任务类型并确定结果目录
    task_dirs = [
        os.path.join("results", "evaluation_results", task_id),
        os.path.join("results", "adversarial_results", task_id),
        os.path.join("results", "defense_results", task_id)
    ]
    
    # 找到存在的目录
    result_dir = None
    for dir_path in task_dirs:
        if os.path.exists(dir_path):
            result_dir = dir_path
            break
    
    if not result_dir:
        raise HTTPException(status_code=404, detail=f"未找到任务 {task_id} 的结果")
    
    # 获取结果文件列表
    result_files = {
        "images": [],
        "metrics": {},
        "metadata": {}
    }
    
    # 查找图像文件，按目录组织
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    
    # 遍历结果目录下的所有子目录
    for item in os.listdir(result_dir):
        item_path = os.path.join(result_dir, item)
        if os.path.isdir(item_path):
            # 在每个子目录中查找图像文件
            for ext in image_extensions:
                image_files = glob.glob(os.path.join(item_path, f"*{ext}"))
                
                for img_path in image_files:
                    rel_path = os.path.relpath(img_path, start=result_dir)
                    result_files["images"].append({
                        "path": rel_path,
                        "url": f"/visualization/image/{task_id}/{rel_path}",
                        "type": item,  # 使用目录名作为type
                        "filename": os.path.basename(img_path)
                    })
    
    # 也查找根目录下的图像文件
    for ext in image_extensions:
        image_files = glob.glob(os.path.join(result_dir, f"*{ext}"))
        
        for img_path in image_files:
            rel_path = os.path.relpath(img_path, start=result_dir)
            result_files["images"].append({
                "path": rel_path,
                "url": f"/visualization/image/{task_id}/{rel_path}",
                "type": "main",  # 根目录文件归为main类型
                "filename": os.path.basename(img_path)
            })
    
    # 查找JSON结果文件
    json_files = glob.glob(os.path.join(result_dir, "*.json"))
    for json_path in json_files:
        try:
            with open(json_path, 'r') as f:
                json_data = json.load(f)
                
            file_name = os.path.basename(json_path).replace('.json', '')
            result_files["metrics"][file_name] = json_data
        except Exception as e:
            print(f"读取JSON文件 {json_path} 出错: {str(e)}")
    
    # 获取任务元数据（如果存在）
    metadata_file = os.path.join(result_dir, "metadata.json")
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, 'r') as f:
                result_files["metadata"] = json.load(f)
        except Exception as e:
            print(f"读取元数据文件出错: {str(e)}")
    
    return result_files

@router.get("/image/{task_id}/{image_path:path}")
async def get_result_image(task_id: str, image_path: str):
    """
    获取任务结果中的图像文件
    
    参数:
        task_id: 任务ID
        image_path: 图像相对路径
        
    返回:
        图像文件
    """
    # 检查任务类型并确定结果目录
    task_dirs = [
        os.path.join("results", "evaluation_results", task_id),
        os.path.join("results", "adversarial_results", task_id),
        os.path.join("results", "defense_results", task_id)
    ]
    
    # 尝试在各个可能的目录中查找图像
    for base_dir in task_dirs:
        full_path = os.path.join(base_dir, image_path)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            return FileResponse(full_path)
    
    raise HTTPException(status_code=404, detail=f"未找到图像: {image_path}")

@router.get("/compare/{task_id}")
async def get_comparison_visualization(
    task_id: str,
    type: str = "attack",  # "attack" 或 "defense"
    image_index: int = 0
):
    """
    获取对比可视化结果
    
    参数:
        task_id: 任务ID
        type: 可视化类型，"attack"或"defense"
        image_index: 图像索引（如果有多张图像）
        
    返回:
        对比可视化图像的URL
    """
    # 确定结果目录
    if type == "attack":
        result_dir = os.path.join("results", "adversarial_results", task_id)
    elif type == "defense":
        result_dir = os.path.join("results", "defense_results", task_id)
    else:
        raise HTTPException(status_code=400, detail=f"不支持的可视化类型: {type}")
    
    if not os.path.exists(result_dir):
        raise HTTPException(status_code=404, detail=f"未找到任务 {task_id} 的结果")
    
    # 查找原始图像、对抗样本和防御结果（如果适用）
    original_images = glob.glob(os.path.join(result_dir, "original_*.jpg"))
    adversarial_images = glob.glob(os.path.join(result_dir, "adversarial_*.jpg"))
    defended_images = glob.glob(os.path.join(result_dir, "defended_*.jpg")) if type == "defense" else []
    
    # 确保有足够的图像
    if len(original_images) <= image_index or len(adversarial_images) <= image_index:
        raise HTTPException(status_code=404, detail=f"索引 {image_index} 超出可用图像范围")
    
    # 创建可视化器
    visualizer = Visualizer(save_dir=result_dir)
    
    # 生成对比可视化
    import cv2
    import numpy as np
    
    try:
        # 读取图像
        original_img = cv2.imread(original_images[image_index])
        original_img_rgb = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        
        adv_img = cv2.imread(adversarial_images[image_index])
        adv_img_rgb = cv2.cvtColor(adv_img, cv2.COLOR_BGR2RGB)
        
        # 生成对比可视化
        if type == "attack":
            comparison = visualizer.visualize_attack(original_img_rgb, adv_img_rgb)
            result_path = f"attack_comparison_{task_id}_{image_index}.jpg"
        else:  # defense
            if len(defended_images) <= image_index:
                raise HTTPException(status_code=404, detail=f"未找到防御结果图像")
                
            defended_img = cv2.imread(defended_images[image_index])
            defended_img_rgb = cv2.cvtColor(defended_img, cv2.COLOR_BGR2RGB)
            
            comparison = visualizer.visualize_defense(original_img_rgb, adv_img_rgb, defended_img_rgb)
            result_path = f"defense_comparison_{task_id}_{image_index}.jpg"
        
        # 返回图像URL
        return {
            "comparison_url": f"/visualization/image/{task_id}/{result_path}",
            "original_url": f"/visualization/image/{task_id}/{os.path.basename(original_images[image_index])}",
            "adversarial_url": f"/visualization/image/{task_id}/{os.path.basename(adversarial_images[image_index])}",
            "defended_url": f"/visualization/image/{task_id}/{os.path.basename(defended_images[image_index])}" if type == "defense" and defended_images else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成对比可视化失败: {str(e)}")

@router.get("/metrics/{task_id}")
async def get_metrics_visualization(task_id: str, metric_type: str = "performance"):
    """
    获取指标可视化
    
    参数:
        task_id: 任务ID
        metric_type: 指标类型，如"performance"、"pr_curve"等
        
    返回:
        指标可视化图像的URL
    """
    # 检查任务类型并确定结果目录
    task_dirs = [
        os.path.join("results", "evaluation_results", task_id),
        os.path.join("results", "adversarial_results", task_id),
        os.path.join("results", "defense_results", task_id)
    ]
    
    # 找到存在的目录
    result_dir = None
    for dir_path in task_dirs:
        if os.path.exists(dir_path):
            result_dir = dir_path
            break
    
    if not result_dir:
        raise HTTPException(status_code=404, detail=f"未找到任务 {task_id} 的结果")
    
    # 查找指标文件
    metrics_file = os.path.join(result_dir, "metrics.json")
    if not os.path.exists(metrics_file):
        raise HTTPException(status_code=404, detail=f"未找到任务 {task_id} 的指标数据")
    
    try:
        # 读取指标数据
        with open(metrics_file, 'r') as f:
            metrics_data = json.load(f)
        
        # 创建可视化器
        visualizer = Visualizer(save_dir=result_dir)
        
        # 根据指标类型生成可视化
        if metric_type == "performance":
            chart_path = visualizer.visualize_metrics(metrics_data, title=f"任务 {task_id} 性能指标")
        elif metric_type == "class_distribution":
            if "class_counts" not in metrics_data:
                raise HTTPException(status_code=404, detail=f"未找到类别分布数据")
            chart_path = visualizer.visualize_class_distribution(metrics_data["class_counts"])
        elif metric_type == "confidence":
            if "confidences" not in metrics_data:
                raise HTTPException(status_code=404, detail=f"未找到置信度数据")
            chart_path = visualizer.visualize_confidence_distribution(metrics_data["confidences"])
        else:
            raise HTTPException(status_code=400, detail=f"不支持的指标类型: {metric_type}")
        
        # 返回图像URL
        rel_path = os.path.relpath(chart_path, start=result_dir)
        return {
            "chart_url": f"/visualization/image/{task_id}/{rel_path}",
            "metrics_data": metrics_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成指标可视化失败: {str(e)}")