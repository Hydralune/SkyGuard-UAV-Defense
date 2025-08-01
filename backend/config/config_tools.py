#!/usr/bin/env python3
# backend/config/config_tools.py
import os
import yaml
import argparse
import sys
import glob
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def create_default_configs():
    """创建默认配置文件"""
    root_dir = Path(__file__).resolve().parent.parent
    config_dir = root_dir / "config"
    
    # 确保配置目录存在
    config_dir.mkdir(exist_ok=True)
    
    # 默认模型配置
    models_config = {
        "models": {
            "yolov8s-visdrone": {
                "type": "detection",
                "framework": "yolov8",
                "description": "YOLOv8s 在 VisDrone 数据集上训练的模型",
                "aliases": ["yolov8s", "yolov8s_visdrone", "yolo_visdrone"],
                "path": {
                    "baseline": "models/baseline/yolov8s-visdrone.pt",
                    "active": "models/active/yolov8s-visdrone.pt"
                },
                "metadata": {
                    "input_size": [640, 640],
                    "classes": 10,
                    "dataset": "visdrone"
                }
            }
        }
    }
    
    # 默认数据集配置
    datasets_config = {
        "datasets": {
            "VisDrone": {
                "type": "detection",
                "description": "无人机视角目标检测数据集",
                "aliases": ["visdrone", "vis_drone", "drone_dataset"],
                "path": {
                    "root": "datasets/VisDrone_Dataset",
                    "train": "VisDrone2019-DET-train/images",
                    "val": "VisDrone2019-DET-val/images",
                    "test": "VisDrone2019-DET-test-dev/images",
                    "annotations": {
                        "train": "VisDrone2019-DET-train/annotations",
                        "val": "VisDrone2019-DET-val/annotations",
                        "test": "VisDrone2019-DET-test-dev/annotations"
                    }
                },
                "format": "visdrone",
                "classes": [
                    "pedestrian", "people", "bicycle", "car", "van",
                    "truck", "tricycle", "awning-tricycle", "bus", "motor"
                ]
            }
        }
    }
    
    # 写入模型配置文件
    with open(config_dir / "models.yaml", "w", encoding="utf-8") as f:
        yaml.dump(models_config, f, default_flow_style=False, allow_unicode=True)
    
    # 写入数据集配置文件
    with open(config_dir / "datasets.yaml", "w", encoding="utf-8") as f:
        yaml.dump(datasets_config, f, default_flow_style=False, allow_unicode=True)
    
    print("已创建默认配置文件")

def detect_paths(base_dir: Path, pattern: str) -> List[Path]:
    """
    检测指定目录下符合模式的路径
    
    参数:
        base_dir: 基础目录
        pattern: 匹配模式
        
    返回:
        匹配的路径列表
    """
    # 使用glob查找匹配的路径
    matches = list(base_dir.glob(pattern))
    
    # 如果在当前目录下找不到，尝试在项目根目录下查找
    if not matches and base_dir.name == "backend":
        parent_dir = base_dir.parent
        matches = list(parent_dir.glob(pattern))
    
    return matches

def auto_detect_dataset_structure(root_path: str) -> Dict[str, Any]:
    """
    自动检测数据集结构
    
    参数:
        root_path: 数据集根目录
        
    返回:
        包含数据集路径结构的字典
    """
    root_dir = Path(__file__).resolve().parent.parent
    dataset_root = root_dir / root_path
    
    # 如果路径不存在，尝试使用绝对路径
    if not dataset_root.exists():
        dataset_root = Path(root_path)
        if not dataset_root.exists():
            print(f"警告: 数据集根目录 {root_path} 不存在")
            return {"root": root_path}
    
    # 初始化路径配置
    path_config = {"root": root_path}
    annotations_config = {}
    
    # 常见的数据集子集名称
    subsets = ["train", "val", "test", "test-dev", "test-challenge"]
    
    # 检测常见的目录结构模式
    for subset in subsets:
        # 标准化子集名称
        subset_key = subset.replace("-", "_").replace("_dev", "").replace("_challenge", "")
        
        # 检查常见的图像目录模式
        image_patterns = [
            f"*{subset}*/images",
            f"*{subset.replace('-', '_')}*/images",
            f"*{subset}*",
        ]
        
        # 检查常见的注释目录模式
        anno_patterns = [
            f"*{subset}*/annotations",
            f"*{subset}*/labels",
            f"*{subset.replace('-', '_')}*/annotations",
            f"*{subset.replace('-', '_')}*/labels",
        ]
        
        # 查找图像目录
        for pattern in image_patterns:
            image_dirs = detect_paths(dataset_root, pattern)
            if image_dirs:
                # 使用相对路径
                rel_path = os.path.relpath(str(image_dirs[0]), str(root_dir))
                path_config[subset_key] = rel_path
                print(f"找到 {subset_key} 图像目录: {rel_path}")
                break
        
        # 查找注释目录
        for pattern in anno_patterns:
            anno_dirs = detect_paths(dataset_root, pattern)
            if anno_dirs:
                # 使用相对路径
                rel_path = os.path.relpath(str(anno_dirs[0]), str(root_dir))
                annotations_config[subset_key] = rel_path
                print(f"找到 {subset_key} 注释目录: {rel_path}")
                break
    
    # 如果找到了注释目录，添加到配置中
    if annotations_config:
        path_config["annotations"] = annotations_config
    
    return path_config

def add_model(name, model_type, framework, description, baseline_path, active_path=None, metadata=None, aliases=None):
    """添加模型配置"""
    root_dir = Path(__file__).resolve().parent.parent
    config_file = root_dir / "config" / "models.yaml"
    
    # 加载现有配置
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
    else:
        config = {"models": {}}
    
    # 生成默认别名
    if aliases is None:
        aliases = [name.lower()]
        # 添加一些常见的别名变体
        aliases.extend([
            name.lower().replace("-", "_"),
            name.lower().replace("_", "-"),
            name.lower().replace(" ", "_"),
            name.lower().replace(" ", "-")
        ])
        # 去重
        aliases = list(set(aliases))
    
    # 添加新模型
    config["models"][name] = {
        "type": model_type,
        "framework": framework,
        "description": description,
        "aliases": aliases,
        "path": {
            "baseline": baseline_path
        },
        "metadata": metadata or {}
    }
    
    if active_path:
        config["models"][name]["path"]["active"] = active_path
    
    # 写入配置文件
    with open(config_file, "w", encoding="utf-8") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True)
    
    print(f"已添加模型: {name}")
    print(f"别名: {', '.join(aliases)}")

def add_dataset(name, dataset_type, description, root_path, paths=None, classes=None, aliases=None, auto_detect=True):
    """
    添加数据集配置
    
    参数:
        name: 数据集名称
        dataset_type: 数据集类型
        description: 描述
        root_path: 根路径
        paths: 路径配置（可选）
        classes: 类别列表（可选）
        aliases: 别名列表（可选）
        auto_detect: 是否自动检测路径结构
    """
    root_dir = Path(__file__).resolve().parent.parent
    config_file = root_dir / "config" / "datasets.yaml"
    
    # 加载现有配置
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
    else:
        config = {"datasets": {}}
    
    # 生成默认别名
    if aliases is None:
        aliases = [name.lower()]
        # 添加一些常见的别名变体
        aliases.extend([
            name.lower().replace("-", "_"),
            name.lower().replace("_", "-"),
            name.lower().replace(" ", "_"),
            name.lower().replace(" ", "-")
        ])
        # 去重
        aliases = list(set(aliases))
    
    # 自动检测路径结构
    if auto_detect:
        detected_paths = auto_detect_dataset_structure(root_path)
        
        # 如果提供了路径配置，与检测到的路径合并
        if paths:
            # 保留根路径
            detected_paths.update(paths)
        
        paths = detected_paths
    
    # 添加新数据集
    config["datasets"][name] = {
        "type": dataset_type,
        "description": description,
        "aliases": aliases,
        "path": {
            "root": root_path
        },
        "classes": classes or []
    }
    
    if paths:
        config["datasets"][name]["path"].update(paths)
    
    # 写入配置文件
    with open(config_file, "w", encoding="utf-8") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True)
    
    print(f"已添加数据集: {name}")
    print(f"别名: {', '.join(aliases)}")
    
    # 验证路径
    verify_dataset_paths(name)

def verify_dataset_paths(dataset_name):
    """
    验证数据集路径是否存在
    
    参数:
        dataset_name: 数据集名称
    """
    # 导入ConfigManager
    from utils.config_manager import ConfigManager
    
    print(f"\n验证数据集 {dataset_name} 的路径:")
    
    # 检查测试集路径
    test_path = ConfigManager.get_dataset_path(dataset_name, "test")
    print(f"测试集路径: {test_path}")
    print(f"路径存在: {os.path.exists(test_path) if test_path else False}")
    
    # 检查训练集路径
    train_path = ConfigManager.get_dataset_path(dataset_name, "train")
    print(f"训练集路径: {train_path}")
    print(f"路径存在: {os.path.exists(train_path) if train_path else False}")
    
    # 检查验证集路径
    val_path = ConfigManager.get_dataset_path(dataset_name, "val")
    print(f"验证集路径: {val_path}")
    print(f"路径存在: {os.path.exists(val_path) if val_path else False}")
    
    # 检查测试集注释路径
    test_anno_path = ConfigManager.get_dataset_annotation_path(dataset_name, "test")
    print(f"测试集注释路径: {test_anno_path}")
    print(f"路径存在: {os.path.exists(test_anno_path) if test_anno_path else False}")

def list_models():
    """列出所有模型"""
    # 修改导入路径
    from utils.config_manager import ConfigManager
    
    models = ConfigManager.list_available_models()
    if not models:
        print("没有找到任何模型配置")
        return
    
    print("可用模型:")
    for model in models:
        aliases_str = ", ".join(model.get('aliases', []))
        print(f"- {model['name']} ({model['framework']}/{model['type']}): {model['description']}")
        print(f"  别名: {aliases_str}")
        if 'path' in model:
            baseline = model['path'].get('baseline')
            active = model['path'].get('active')
            if baseline:
                print(f"  基准模型: {baseline}")
            if active:
                print(f"  活动模型: {active}")
        print()

def list_datasets():
    """列出所有数据集"""
    # 修改导入路径
    from utils.config_manager import ConfigManager
    
    datasets = ConfigManager.list_available_datasets()
    if not datasets:
        print("没有找到任何数据集配置")
        return
    
    print("可用数据集:")
    for dataset in datasets:
        aliases_str = ", ".join(dataset.get('aliases', []))
        print(f"- {dataset['name']} ({dataset['type']}): {dataset['description']} ({dataset['classes']} 类)")
        print(f"  别名: {aliases_str}")
        if 'path' in dataset:
            if 'root' in dataset['path']:
                print(f"  根目录: {dataset['path']['root']}")
            if 'test' in dataset['path']:
                print(f"  测试集: {dataset['path']['test']}")
                test_path = ConfigManager.get_dataset_path(dataset['name'], 'test')
                print(f"  测试集路径存在: {os.path.exists(test_path) if test_path else False}")
        print()

def scan_dataset_dir(directory=None):
    """
    扫描目录寻找可能的数据集
    
    参数:
        directory: 要扫描的目录，默认为backend/datasets
    """
    root_dir = Path(__file__).resolve().parent.parent
    
    if directory is None:
        directory = root_dir / "datasets"
    else:
        directory = Path(directory)
    
    if not directory.exists():
        print(f"目录 {directory} 不存在")
        return
    
    print(f"扫描目录 {directory} 寻找数据集...")
    
    # 查找可能的数据集目录
    potential_datasets = []
    for item in directory.iterdir():
        if item.is_dir():
            # 检查是否有images或annotations子目录
            has_images = any((item / subdir).exists() for subdir in ["images", "train/images", "val/images", "test/images"])
            has_annotations = any((item / subdir).exists() for subdir in ["annotations", "labels", "train/annotations", "train/labels"])
            
            if has_images or has_annotations:
                potential_datasets.append(item)
    
    if not potential_datasets:
        print("未找到可能的数据集")
        return
    
    print(f"找到 {len(potential_datasets)} 个可能的数据集:")
    
    for i, dataset_dir in enumerate(potential_datasets):
        print(f"{i+1}. {dataset_dir.name}")
        
        # 检测数据集结构
        paths = auto_detect_dataset_structure(str(dataset_dir))
        
        print(f"   检测到的路径结构:")
        for key, value in paths.items():
            if key == "annotations":
                print(f"   - {key}:")
                for anno_key, anno_val in value.items():
                    print(f"     - {anno_key}: {anno_val}")
            else:
                print(f"   - {key}: {value}")
        print()
    
    return potential_datasets

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="配置文件管理工具")
    subparsers = parser.add_subparsers(dest="command", help="子命令")
    
    # 创建默认配置
    create_parser = subparsers.add_parser("create", help="创建默认配置文件")
    
    # 添加模型
    model_parser = subparsers.add_parser("add-model", help="添加模型配置")
    model_parser.add_argument("--name", required=True, help="模型名称")
    model_parser.add_argument("--type", required=True, help="模型类型")
    model_parser.add_argument("--framework", required=True, help="框架")
    model_parser.add_argument("--description", required=True, help="描述")
    model_parser.add_argument("--baseline-path", required=True, help="基准模型路径")
    model_parser.add_argument("--active-path", help="活动模型路径")
    model_parser.add_argument("--aliases", nargs="+", help="别名列表")
    
    # 添加数据集
    dataset_parser = subparsers.add_parser("add-dataset", help="添加数据集配置")
    dataset_parser.add_argument("--name", required=True, help="数据集名称")
    dataset_parser.add_argument("--type", required=True, help="数据集类型")
    dataset_parser.add_argument("--description", required=True, help="描述")
    dataset_parser.add_argument("--root-path", required=True, help="根路径")
    dataset_parser.add_argument("--classes", nargs="+", help="类别列表")
    dataset_parser.add_argument("--aliases", nargs="+", help="别名列表")
    dataset_parser.add_argument("--no-auto-detect", action="store_true", help="禁用自动检测路径结构")
    
    # 验证数据集路径
    verify_parser = subparsers.add_parser("verify", help="验证数据集路径")
    verify_parser.add_argument("--name", required=True, help="数据集名称")
    
    # 扫描目录寻找数据集
    scan_parser = subparsers.add_parser("scan", help="扫描目录寻找可能的数据集")
    scan_parser.add_argument("--directory", help="要扫描的目录")
    
    # 列出模型
    list_models_parser = subparsers.add_parser("list-models", help="列出所有模型")
    
    # 列出数据集
    list_datasets_parser = subparsers.add_parser("list-datasets", help="列出所有数据集")
    
    args = parser.parse_args()
    
    if args.command == "create":
        create_default_configs()
    elif args.command == "add-model":
        add_model(args.name, args.type, args.framework, args.description, 
                 args.baseline_path, args.active_path, aliases=args.aliases)
    elif args.command == "add-dataset":
        add_dataset(args.name, args.type, args.description, args.root_path, 
                   classes=args.classes, aliases=args.aliases, auto_detect=not args.no_auto_detect)
    elif args.command == "verify":
        verify_dataset_paths(args.name)
    elif args.command == "scan":
        scan_dataset_dir(args.directory)
    elif args.command == "list-models":
        list_models()
    elif args.command == "list-datasets":
        list_datasets()
    else:
        parser.print_help() 