# backend/utils/model_loader.py
import os
import torch
from ultralytics import YOLO

from .config_manager import ConfigManager

def load_yolov8_model(model_name="yolov8s-visdrone"):
    """
    加载YOLOv8模型
    
    参数:
        model_name: 模型名称，如果为None则使用默认名称
        
    返回:
        加载的模型
    """
    # 通过配置管理器获取模型路径
    model_path = ConfigManager.get_model_path(model_name)
    
    if model_path is None:
        raise ValueError(f"找不到模型: {model_name}")
    
    print(f"从以下路径加载模型: {model_path}")
    
    # 临时修补torch.load函数
    original_torch_load = torch.load
    
    def patched_torch_load(f, *args, **kwargs):
        kwargs['weights_only'] = False
        return original_torch_load(f, *args, **kwargs)
    
    try:
        torch.load = patched_torch_load
        model = YOLO(model_path)
        return model
    finally:
        # 恢复原始函数
        torch.load = original_torch_load
