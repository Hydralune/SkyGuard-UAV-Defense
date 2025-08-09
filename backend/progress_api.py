# backend/progress_api.py
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import os
import json
import asyncio
from datetime import datetime

# 创建API路由
router = APIRouter(
    prefix="/progress", 
    tags=["Progress"], 
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"}
    }
)

# 存储任务进度的内存字典
task_progress = {}

# WebSocket连接管理器
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)

    def disconnect(self, websocket: WebSocket, task_id: str):
        if task_id in self.active_connections:
            if websocket in self.active_connections[task_id]:
                self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    async def broadcast(self, task_id: str, message: Dict[str, Any]):
        if task_id in self.active_connections:
            for connection in self.active_connections[task_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket连接，用于实时获取任务进度
    """
    await manager.connect(websocket, task_id)
    try:
        # 发送当前进度（如果有）
        if task_id in task_progress:
            await websocket.send_json(task_progress[task_id])
        
        # 保持连接，直到客户端断开
        while True:
            # 接收客户端消息（可选）
            data = await websocket.receive_text()
            # 如果需要处理客户端消息，可以在这里添加代码
    except WebSocketDisconnect:
        manager.disconnect(websocket, task_id)

@router.post("/update/{task_id}")
async def update_progress(task_id: str, progress_data: Dict[str, Any]):
    """
    更新任务进度
    
    参数:
        task_id: 任务ID
        progress_data: 进度数据
        
    返回:
        操作结果
    """
    # 添加时间戳
    progress_data["timestamp"] = datetime.now().isoformat()
    
    # 更新内存中的进度
    task_progress[task_id] = progress_data
    
    # 保存进度到文件
    task_dirs = [
        os.path.join("results", "evaluation_results", task_id),
        os.path.join("results", "adversarial_results", task_id),
        os.path.join("results", "defense_results", task_id),
        os.path.join("results", "scenario_results", task_id),
    ]
    
    # 找到存在的目录或创建新目录
    result_dir = None
    for dir_path in task_dirs:
        if os.path.exists(dir_path):
            result_dir = dir_path
            break
    
    if not result_dir:
        # 根据任务类型确定目录
        if "defense_type" in progress_data:
            result_dir = os.path.join("results", "defense_results", task_id)
        elif "attack_name" in progress_data:
            result_dir = os.path.join("results", "adversarial_results", task_id)
        elif progress_data.get("task_group") == "scenario" or progress_data.get("is_scenario"):
            result_dir = os.path.join("results", "scenario_results", task_id)
        else:
            result_dir = os.path.join("results", "evaluation_results", task_id)
        
        os.makedirs(result_dir, exist_ok=True)
    
    # 保存进度文件
    progress_file = os.path.join(result_dir, "progress.json")
    try:
        with open(progress_file, 'w') as f:
            json.dump(progress_data, f)
    except Exception as e:
        print(f"保存进度文件失败: {str(e)}")
    
    # 通过WebSocket广播进度更新
    await manager.broadcast(task_id, progress_data)
    
    return {"status": "success", "message": "进度已更新"}

@router.get("/{task_id}")
async def get_progress(task_id: str):
    """
    获取任务进度
    
    参数:
        task_id: 任务ID
        
    返回:
        任务进度
    """
    # 首先检查内存中是否有进度
    if task_id in task_progress:
        return task_progress[task_id]
    
    # 如果内存中没有，尝试从文件读取
    task_dirs = [
        os.path.join("results", "evaluation_results", task_id),
        os.path.join("results", "adversarial_results", task_id),
        os.path.join("results", "defense_results", task_id),
        os.path.join("results", "scenario_results", task_id),
    ]
    
    for dir_path in task_dirs:
        progress_file = os.path.join(dir_path, "progress.json")
        if os.path.exists(progress_file):
            try:
                with open(progress_file, 'r') as f:
                    progress_data = json.load(f)
                    # 更新内存中的进度
                    task_progress[task_id] = progress_data
                    return progress_data
            except Exception as e:
                print(f"读取进度文件失败: {str(e)}")
    
    # 如果没有找到进度，返回404
    raise HTTPException(status_code=404, detail=f"未找到任务 {task_id} 的进度")