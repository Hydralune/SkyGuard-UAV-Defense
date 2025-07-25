import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, List, Union

class ConfigManager:
    """配置管理器，负责加载和解析配置文件"""
    
    _ROOT_DIR = Path(__file__).resolve().parent.parent  # 指向 backend/
    _CONFIG_DIR = _ROOT_DIR / "config"
    
    _models_config = None
    _datasets_config = None
    
    @classmethod
    def _load_yaml(cls, filename: str) -> Dict[str, Any]:
        """加载YAML配置文件"""
        filepath = cls._CONFIG_DIR / filename
        if not filepath.exists():
            return {}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    @classmethod
    def get_models_config(cls) -> Dict[str, Any]:
        """获取模型配置"""
        if cls._models_config is None:
            cls._models_config = cls._load_yaml("models.yaml")
        return cls._models_config
    
    @classmethod
    def get_datasets_config(cls) -> Dict[str, Any]:
        """获取数据集配置"""
        if cls._datasets_config is None:
            cls._datasets_config = cls._load_yaml("datasets.yaml")
        return cls._datasets_config
    
    @classmethod
    def get_model_path(cls, model_name: str, prefer_active: bool = True) -> Optional[str]:
        """
        获取模型路径
        
        参数:
            model_name: 模型名称（支持别名）
            prefer_active: 是否优先使用active目录下的模型
            
        返回:
            模型路径，如果找不到则返回None
        """
        # 解析模型名称（处理别名）
        resolved_name = cls._resolve_model_name(model_name)
        models = cls.get_models_config().get("models", {})
        model_info = models.get(resolved_name)
        
        if not model_info:
            # 回退到旧的模型注册表
            from .model_registry import get_model_path
            return get_model_path(model_name, prefer_active)
        
        # 从配置中获取路径
        paths = model_info.get("path", {})
        
        # 优先使用active目录
        if prefer_active and "active" in paths:
            active_path = cls._ROOT_DIR / paths["active"]
            if active_path.exists():
                return str(active_path)
                
            # 尝试项目根目录
            root_active_path = Path(cls._ROOT_DIR).parent / paths["active"]
            if root_active_path.exists():
                return str(root_active_path)
        
        # 其次使用baseline目录
        if "baseline" in paths:
            baseline_path = cls._ROOT_DIR / paths["baseline"]
            if baseline_path.exists():
                return str(baseline_path)
                
            # 尝试项目根目录
            root_baseline_path = Path(cls._ROOT_DIR).parent / paths["baseline"]
            if root_baseline_path.exists():
                return str(root_baseline_path)
        
        # 回退到旧的模型注册表
        from .model_registry import get_model_path
        return get_model_path(model_name, prefer_active)
    
    @classmethod
    def get_dataset_path(cls, dataset_name: str, subset: str = "test") -> Optional[str]:
        """
        获取数据集路径
        
        参数:
            dataset_name: 数据集名称（支持别名）
            subset: 数据集子集，如'train', 'val', 'test'
            
        返回:
            数据集路径，如果找不到则返回None
        """
        # 解析数据集名称（处理别名）
        resolved_name = cls._resolve_dataset_name(dataset_name)
        datasets = cls.get_datasets_config().get("datasets", {})
        dataset_info = datasets.get(resolved_name)
        
        if not dataset_info:
            # 回退到旧的路径逻辑
            if dataset_name.lower() == "visdrone":
                if subset == "test":
                    # 尝试标准路径
                    test_dir = cls._ROOT_DIR / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "images"
                    if test_dir.exists():
                        return str(test_dir)
                    
                    # 尝试其他可能的路径
                    alt_dir = cls._ROOT_DIR / "datasets" / "VisDrone_Dataset" / "images"
                    if alt_dir.exists():
                        return str(alt_dir)
                    
                    # 尝试项目根目录下的数据集
                    root_test_dir = Path(cls._ROOT_DIR).parent / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "images"
                    if root_test_dir.exists():
                        return str(root_test_dir)
                    
                    # 尝试直接使用绝对路径
                    abs_test_dir = Path("/root/projects/SkyGuard-UAV-Defense/backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images")
                    if abs_test_dir.exists():
                        return str(abs_test_dir)
            
            # 如果找不到，返回None而不是默认路径
            return None
        
        # 从配置中获取路径
        paths = dataset_info.get("path", {})
        
        # 检查直接子集路径
        if subset in paths:
            # 直接使用子集路径
            subset_path = cls._ROOT_DIR / paths[subset]
            # 修复可能的路径问题
            fixed_path = cls._fix_path(str(subset_path))
            subset_path = Path(fixed_path)
            if subset_path.exists():
                return str(subset_path)
            
            # 尝试项目根目录
            root_subset_path = Path(cls._ROOT_DIR).parent / paths[subset]
            # 修复可能的路径问题
            fixed_path = cls._fix_path(str(root_subset_path))
            root_subset_path = Path(fixed_path)
            if root_subset_path.exists():
                return str(root_subset_path)
        
        # 检查根路径和子集路径组合
        if "root" in paths and subset in paths:
            # 组合根路径和子集路径
            combined_path = cls._ROOT_DIR / paths["root"] / paths[subset]
            # 修复可能的路径问题
            fixed_path = cls._fix_path(str(combined_path))
            combined_path = Path(fixed_path)
            if combined_path.exists():
                return str(combined_path)
            
            # 尝试项目根目录
            root_combined_path = Path(cls._ROOT_DIR).parent / paths["root"] / paths[subset]
            # 修复可能的路径问题
            fixed_path = cls._fix_path(str(root_combined_path))
            root_combined_path = Path(fixed_path)
            if root_combined_path.exists():
                return str(root_combined_path)
        
        # 尝试常见的路径模式
        if dataset_name.lower() == "visdrone":
            # 尝试标准路径
            test_dir = cls._ROOT_DIR / "datasets" / "VisDrone_Dataset" / f"VisDrone2019-DET-{subset}" / "images"
            if test_dir.exists():
                return str(test_dir)
        
        # 如果找不到，返回None而不是默认路径
        return None
    
    @classmethod
    def get_dataset_annotation_path(cls, dataset_name: str, subset: str = "test") -> Optional[str]:
        """
        获取数据集标注路径
        
        参数:
            dataset_name: 数据集名称（支持别名）
            subset: 数据集子集，如'train', 'val', 'test'
            
        返回:
            标注路径，如果找不到则返回None
        """
        # 解析数据集名称（处理别名）
        resolved_name = cls._resolve_dataset_name(dataset_name)
        datasets = cls.get_datasets_config().get("datasets", {})
        dataset_info = datasets.get(resolved_name)
        
        if not dataset_info:
            # 回退到旧的路径逻辑
            if dataset_name.lower() == "visdrone":
                if subset == "test":
                    anno_dir = cls._ROOT_DIR / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "annotations"
                    if anno_dir.exists():
                        return str(anno_dir)
                    
                    # 尝试项目根目录下的数据集
                    root_anno_dir = Path(cls._ROOT_DIR).parent / "datasets" / "VisDrone_Dataset" / "VisDrone2019-DET-test-dev" / "annotations"
                    if root_anno_dir.exists():
                        return str(root_anno_dir)
            return None
        
        # 从配置中获取路径
        paths = dataset_info.get("path", {})
        annotations = paths.get("annotations", {})
        
        if isinstance(annotations, dict) and subset in annotations:
            # 直接使用子集标注路径
            anno_path = cls._ROOT_DIR / annotations[subset]
            if anno_path.exists():
                return str(anno_path)
                
            # 尝试项目根目录
            root_anno_path = Path(cls._ROOT_DIR).parent / annotations[subset]
            if root_anno_path.exists():
                return str(root_anno_path)
        elif "root" in paths and isinstance(annotations, dict) and subset in annotations:
            # 组合根路径和子集标注路径
            combined_path = cls._ROOT_DIR / paths["root"] / annotations[subset]
            if combined_path.exists():
                return str(combined_path)
                
            # 尝试项目根目录
            root_combined_path = Path(cls._ROOT_DIR).parent / paths["root"] / annotations[subset]
            if root_combined_path.exists():
                return str(root_combined_path)
        
        return None
    
    @classmethod
    def get_dataset_classes(cls, dataset_name: str) -> List[str]:
        """
        获取数据集类别
        
        参数:
            dataset_name: 数据集名称（支持别名）
            
        返回:
            类别列表
        """
        # 解析数据集名称（处理别名）
        resolved_name = cls._resolve_dataset_name(dataset_name)
        datasets = cls.get_datasets_config().get("datasets", {})
        dataset_info = datasets.get(resolved_name)
        
        if dataset_info and "classes" in dataset_info:
            return dataset_info["classes"]
        
        # 回退到旧的逻辑
        if dataset_name.lower() == "visdrone":
            return [
                'pedestrian', 'people', 'bicycle', 'car', 'van', 
                'truck', 'tricycle', 'awning-tricycle', 'bus', 'motor'
            ]
        
        return []
    
    @classmethod
    def list_available_models(cls) -> List[Dict[str, Any]]:
        """
        列出所有可用的模型
        
        返回:
            模型信息列表，包含路径信息和别名
        """
        models = cls.get_models_config().get("models", {})
        result = []
        
        for name, info in models.items():
            # 获取实际路径
            baseline_path = None
            active_path = None
            
            if "path" in info and "baseline" in info["path"]:
                baseline = info["path"]["baseline"]
                path = cls._ROOT_DIR / baseline
                if path.exists():
                    baseline_path = str(path)
                else:
                    # 尝试项目根目录
                    root_path = Path(cls._ROOT_DIR).parent / baseline
                    if root_path.exists():
                        baseline_path = str(root_path)
            
            if "path" in info and "active" in info["path"]:
                active = info["path"]["active"]
                path = cls._ROOT_DIR / active
                if path.exists():
                    active_path = str(path)
                else:
                    # 尝试项目根目录
                    root_path = Path(cls._ROOT_DIR).parent / active
                    if root_path.exists():
                        active_path = str(root_path)
            
            # 获取别名列表，如果配置中没有，则使用默认别名
            aliases = info.get("aliases", [name.lower()])
            if name.lower() not in aliases:
                aliases.append(name.lower())
            
            result.append({
                "name": name,
                "type": info.get("type", "unknown"),
                "framework": info.get("framework", "unknown"),
                "description": info.get("description", ""),
                "path": {
                    "baseline": baseline_path,
                    "active": active_path
                },
                "aliases": aliases
            })
            
        return result
    
    @classmethod
    def list_available_datasets(cls) -> List[Dict[str, Any]]:
        """
        列出所有可用的数据集
        
        返回:
            数据集信息列表，包含路径信息和别名
        """
        datasets = cls.get_datasets_config().get("datasets", {})
        result = []
        
        for name, info in datasets.items():
            # 获取实际路径
            root_path = None
            if "path" in info and "root" in info["path"]:
                root = info["path"]["root"]
                path = cls._ROOT_DIR / root
                if path.exists():
                    root_path = str(path)
                else:
                    # 尝试项目根目录
                    root_path_alt = Path(cls._ROOT_DIR).parent / root
                    if root_path_alt.exists():
                        root_path = str(root_path_alt)
            
            # 使用更新后的辅助方法获取实际路径
            train_path = cls._get_dataset_path_str(info, "train")
            val_path = cls._get_dataset_path_str(info, "val")
            test_path = cls._get_dataset_path_str(info, "test")
            
            # 获取标注路径
            anno_train = cls._get_dataset_annotation_path_str(info, "train")
            anno_val = cls._get_dataset_annotation_path_str(info, "val")
            anno_test = cls._get_dataset_annotation_path_str(info, "test")
            
            # 获取别名列表，如果配置中没有，则使用默认别名
            aliases = info.get("aliases", [name.lower()])
            if name.lower() not in aliases:
                aliases.append(name.lower())
            
            result.append({
                "name": name,
                "type": info.get("type", "unknown"),
                "description": info.get("description", ""),
                "classes": len(info.get("classes", [])),
                "class_names": info.get("classes", []),
                "path": {
                    "root": root_path,
                    "train": train_path,
                    "val": val_path,
                    "test": test_path,
                    "annotations": {
                        "train": anno_train,
                        "val": anno_val,
                        "test": anno_test
                    }
                },
                "aliases": aliases
            })
            
        return result

    @classmethod
    def _get_dataset_path_str(cls, dataset_info: Dict[str, Any], subset: str) -> Optional[str]:
        """
        获取数据集子集路径的字符串表示
        
        参数:
            dataset_info: 数据集配置信息
            subset: 数据集子集，如'train', 'val', 'test'
            
        返回:
            路径字符串，如果找不到则返回None
        """
        paths = dataset_info.get("path", {})
        
        # 如果子集路径直接存在
        if subset in paths:
            path = cls._ROOT_DIR / paths[subset]
            if path.exists():
                return str(path)
            
            # 尝试项目根目录
            root_path = Path(cls._ROOT_DIR).parent / paths[subset]
            if root_path.exists():
                return str(root_path)
        
        # 如果存在根路径和子集路径
        if "root" in paths and subset in paths:
            combined_path = cls._ROOT_DIR / paths["root"] / paths[subset]
            if combined_path.exists():
                return str(combined_path)
            
            # 尝试项目根目录
            root_combined_path = Path(cls._ROOT_DIR).parent / paths["root"] / paths[subset]
            if root_combined_path.exists():
                return str(root_combined_path)
        
        return None
    
    @classmethod
    def _get_dataset_annotation_path_str(cls, dataset_info: Dict[str, Any], subset: str) -> Optional[str]:
        """
        获取数据集标注路径的字符串表示
        
        参数:
            dataset_info: 数据集配置信息
            subset: 数据集子集，如'train', 'val', 'test'
            
        返回:
            标注路径字符串，如果找不到则返回None
        """
        paths = dataset_info.get("path", {})
        annotations = paths.get("annotations", {})
        
        # 如果是字典类型且子集存在
        if isinstance(annotations, dict) and subset in annotations:
            # 直接使用子集标注路径
            anno_path = cls._ROOT_DIR / annotations[subset]
            if anno_path.exists():
                return str(anno_path)
            
            # 尝试项目根目录
            root_anno_path = Path(cls._ROOT_DIR).parent / annotations[subset]
            if root_anno_path.exists():
                return str(root_anno_path)
        
        # 如果存在根路径和标注子集
        if "root" in paths and isinstance(annotations, dict) and subset in annotations:
            # 组合根路径和子集标注路径
            combined_path = cls._ROOT_DIR / paths["root"] / annotations[subset]
            if combined_path.exists():
                return str(combined_path)
            
            # 尝试项目根目录
            root_combined_path = Path(cls._ROOT_DIR).parent / paths["root"] / annotations[subset]
            if root_combined_path.exists():
                return str(root_combined_path)
        
        return None 

    @classmethod
    def _resolve_model_name(cls, model_name: str) -> str:
        """
        根据别名解析实际的模型名称
        
        参数:
            model_name: 模型名称或别名
            
        返回:
            实际的模型名称，如果找不到则返回原始名称
        """
        models = cls.get_models_config().get("models", {})
        
        # 1. 直接匹配
        if model_name in models:
            return model_name
            
        # 2. 不区分大小写匹配
        for name in models:
            if name.lower() == model_name.lower():
                return name
        
        # 3. 别名匹配
        model_name_lower = model_name.lower()
        for name, info in models.items():
            aliases = info.get("aliases", [])
            for alias in aliases:
                if alias.lower() == model_name_lower:
                    return name
        
        # 找不到匹配，返回原始名称
        return model_name
    
    @classmethod
    def _resolve_dataset_name(cls, dataset_name: str) -> str:
        """
        根据别名解析实际的数据集名称
        
        参数:
            dataset_name: 数据集名称或别名
            
        返回:
            实际的数据集名称，如果找不到则返回原始名称
        """
        datasets = cls.get_datasets_config().get("datasets", {})
        
        # 1. 直接匹配
        if dataset_name in datasets:
            return dataset_name
            
        # 2. 不区分大小写匹配
        for name in datasets:
            if name.lower() == dataset_name.lower():
                return name
        
        # 3. 别名匹配
        dataset_name_lower = dataset_name.lower()
        for name, info in datasets.items():
            aliases = info.get("aliases", [])
            for alias in aliases:
                if alias.lower() == dataset_name_lower:
                    return name
        
        # 找不到匹配，返回原始名称
        return dataset_name 

    @classmethod
    def _fix_path(cls, path: str) -> str:
        """
        修复可能包含重复backend的路径
        
        参数:
            path: 原始路径
            
        返回:
            修复后的路径
        """
        # 检查路径是否包含重复的backend
        if isinstance(path, str) and "backend/backend" in path:
            return path.replace("backend/backend", "backend")
        return path 