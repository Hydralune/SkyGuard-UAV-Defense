# backend/utils/model_loader.py
import os
import torch
from ultralytics import YOLO

# New centralized resolver
from .model_registry import get_model_path

def load_yolov8_model(model_path=None):
    """
    加载YOLOv8模型
    
    参数:
        model_path: 模型路径，如果为None则使用默认路径
        
    返回:
        加载的模型
    """
    if model_path is None:
        # 尝试通过模型注册表查找
        resolved = get_model_path('yolov8s-visdrone')
        if resolved is None:
            # 回退到旧路径逻辑以保持兼容
            current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            resolved = os.path.join(current_dir, 'yolov8s-visdrone', 'best.pt')

        model_path = resolved
    
    print(f"Loading model from: {model_path}")
    
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
