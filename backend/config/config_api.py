# 引入 FastAPI 核心组件与类型支持
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import os
import yaml
from pathlib import Path
import sys

# 添加父目录到模块搜索路径
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# 引入配置管理器
from utils.config_manager import ConfigManager

# 创建 API 路由对象（用于模块化组织接口）
router = APIRouter(
    prefix="/config", 
    tags=["Configuration"], 
    responses={
        404: {"description": "资源未找到"},
        500: {"description": "服务器内部错误"}
    }
)

@router.get("/models")
async def list_models():
    """
    列出所有可用的模型配置
    
    返回:
        模型配置列表
    """
    try:
        models = ConfigManager.list_available_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")

@router.get("/datasets")
async def list_datasets():
    """
    列出所有可用的数据集配置
    
    返回:
        数据集配置列表
    """
    try:
        datasets = ConfigManager.list_available_datasets()
        return {"datasets": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据集列表失败: {str(e)}")

@router.get("/models/{model_name}")
async def get_model_config(model_name: str):
    """
    获取指定模型的配置信息
    
    参数:
        model_name: 模型名称
        
    返回:
        模型配置信息
    """
    models = ConfigManager.get_models_config().get("models", {})
    if model_name not in models:
        raise HTTPException(status_code=404, detail=f"模型 {model_name} 不存在")
    
    return {
        "name": model_name,
        "config": models[model_name]
    }

@router.get("/datasets/{dataset_name}")
async def get_dataset_config(dataset_name: str):
    """
    获取指定数据集的配置信息
    
    参数:
        dataset_name: 数据集名称
        
    返回:
        数据集配置信息
    """
    datasets = ConfigManager.get_datasets_config().get("datasets", {})
    if dataset_name not in datasets:
        raise HTTPException(status_code=404, detail=f"数据集 {dataset_name} 不存在")
    
    return {
        "name": dataset_name,
        "config": datasets[dataset_name]
    }

@router.post("/models/{model_name}")
async def update_model_config(model_name: str, config: Dict[str, Any]):
    """
    更新或创建模型配置
    
    参数:
        model_name: 模型名称
        config: 模型配置信息
        
    返回:
        更新后的模型配置
    """
    try:
        # 读取现有配置
        config_path = Path(ConfigManager._ROOT_DIR) / "config" / "models.yaml"
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                models_config = yaml.safe_load(f) or {"models": {}}
        else:
            models_config = {"models": {}}
        
        # 更新或添加模型配置
        models_config["models"][model_name] = config
        
        # 写入配置文件
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(models_config, f, default_flow_style=False, allow_unicode=True)
        
        # 重新加载配置
        ConfigManager._models_config = None
        
        return {
            "status": "success",
            "message": f"模型 {model_name} 配置已更新",
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新模型配置失败: {str(e)}")

@router.post("/datasets/{dataset_name}")
async def update_dataset_config(dataset_name: str, config: Dict[str, Any]):
    """
    更新或创建数据集配置
    
    参数:
        dataset_name: 数据集名称
        config: 数据集配置信息
        
    返回:
        更新后的数据集配置
    """
    try:
        # 读取现有配置
        config_path = Path(ConfigManager._ROOT_DIR) / "config" / "datasets.yaml"
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                datasets_config = yaml.safe_load(f) or {"datasets": {}}
        else:
            datasets_config = {"datasets": {}}
        
        # 更新或添加数据集配置
        datasets_config["datasets"][dataset_name] = config
        
        # 写入配置文件
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(datasets_config, f, default_flow_style=False, allow_unicode=True)
        
        # 重新加载配置
        ConfigManager._datasets_config = None
        
        return {
            "status": "success",
            "message": f"数据集 {dataset_name} 配置已更新",
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新数据集配置失败: {str(e)}")

@router.delete("/models/{model_name}")
async def delete_model_config(model_name: str):
    """
    删除模型配置
    
    参数:
        model_name: 模型名称
        
    返回:
        操作结果
    """
    try:
        # 读取现有配置
        config_path = Path(ConfigManager._ROOT_DIR) / "config" / "models.yaml"
        if not config_path.exists():
            raise HTTPException(status_code=404, detail="配置文件不存在")
        
        with open(config_path, "r", encoding="utf-8") as f:
            models_config = yaml.safe_load(f) or {"models": {}}
        
        # 检查模型是否存在
        if model_name not in models_config.get("models", {}):
            raise HTTPException(status_code=404, detail=f"模型 {model_name} 不存在")
        
        # 删除模型配置
        del models_config["models"][model_name]
        
        # 写入配置文件
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(models_config, f, default_flow_style=False, allow_unicode=True)
        
        # 重新加载配置
        ConfigManager._models_config = None
        
        return {
            "status": "success",
            "message": f"模型 {model_name} 配置已删除"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除模型配置失败: {str(e)}")

@router.delete("/datasets/{dataset_name}")
async def delete_dataset_config(dataset_name: str):
    """
    删除数据集配置
    
    参数:
        dataset_name: 数据集名称
        
    返回:
        操作结果
    """
    try:
        # 读取现有配置
        config_path = Path(ConfigManager._ROOT_DIR) / "config" / "datasets.yaml"
        if not config_path.exists():
            raise HTTPException(status_code=404, detail="配置文件不存在")
        
        with open(config_path, "r", encoding="utf-8") as f:
            datasets_config = yaml.safe_load(f) or {"datasets": {}}
        
        # 检查数据集是否存在
        if dataset_name not in datasets_config.get("datasets", {}):
            raise HTTPException(status_code=404, detail=f"数据集 {dataset_name} 不存在")
        
        # 删除数据集配置
        del datasets_config["datasets"][dataset_name]
        
        # 写入配置文件
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(datasets_config, f, default_flow_style=False, allow_unicode=True)
        
        # 重新加载配置
        ConfigManager._datasets_config = None
        
        return {
            "status": "success",
            "message": f"数据集 {dataset_name} 配置已删除"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除数据集配置失败: {str(e)}")

@router.get("/model-paths/{model_name}")
async def get_model_path(model_name: str, prefer_active: bool = True):
    """
    获取模型文件路径
    
    参数:
        model_name: 模型名称
        prefer_active: 是否优先使用active目录
        
    返回:
        模型文件路径
    """
    path = ConfigManager.get_model_path(model_name, prefer_active)
    if not path:
        raise HTTPException(status_code=404, detail=f"找不到模型 {model_name} 的路径")
    
    return {
        "model_name": model_name,
        "path": path,
        "exists": os.path.exists(path)
    }

@router.get("/dataset-paths/{dataset_name}")
async def get_dataset_paths(dataset_name: str, subset: str = "test"):
    """
    获取数据集路径
    
    参数:
        dataset_name: 数据集名称
        subset: 数据集子集，如'train', 'val', 'test'
        
    返回:
        数据集路径信息
    """
    images_path = ConfigManager.get_dataset_path(dataset_name, subset)
    annotations_path = ConfigManager.get_dataset_annotation_path(dataset_name, subset)
    
    if not images_path:
        raise HTTPException(status_code=404, detail=f"找不到数据集 {dataset_name} 的图像路径")
    
    return {
        "dataset_name": dataset_name,
        "subset": subset,
        "images_path": images_path,
        "annotations_path": annotations_path,
        "images_exists": os.path.exists(images_path),
        "annotations_exists": annotations_path and os.path.exists(annotations_path)
    }