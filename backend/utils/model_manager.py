# backend/utils/model_manager.py
import os
import torch
from ultralytics import YOLO

from .model_registry import get_model_path

class ModelManager:
    """模型管理器，负责加载和管理不同的模型"""
    
    @staticmethod
    def load_yolov8_model(model_path=None, model_name="yolov8s-visdrone"):
        """
        加载YOLOv8模型
        
        参数:
            model_path: 模型路径，如果为None则使用默认路径
            model_name: 模型名称，用于在默认路径中查找模型
            
        返回:
            加载的模型
        """
        if model_path is None:
            # 先通过 registry 查找 active / baseline
            resolved = get_model_path(model_name)
            if resolved is None:
                # 回退旧路径
                current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                resolved = os.path.join(current_dir, model_name, 'best.pt')

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
            
            # 设置模型参数
            model.overrides['conf'] = 0.25  # NMS confidence threshold
            model.overrides['iou'] = 0.45  # NMS IoU threshold
            model.overrides['agnostic_nms'] = False  # NMS class-agnostic
            model.overrides['max_det'] = 1000  # maximum number of detections per image
            
            return model
        finally:
            # 恢复原始函数
            torch.load = original_torch_load