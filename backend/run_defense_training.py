#!/usr/bin/env python
"""
对抗训练防御独立执行脚本

此脚本用于在独立进程中执行对抗训练防御，避免Celery守护进程的多进程限制。
"""

import os
import sys
import json
import argparse
from pathlib import Path

# 确保项目根目录在Python路径中
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# 导入训练函数
from backend.train_model import train_visdrone


def run_defense_training(
    defense_type="pgd",
    base_model="yolov8s.pt",
    data_yaml="backend/datasets/VisDrone_Dataset/visdrone.yaml",
    epochs=30,
    imgsz=640,
    batch=16,
    model_name=None,
    device=0,
    eps="8/255",
    alpha="2/255",
    steps=None,
    attack_ratio=0.5,
    task_id=None,
    result_file=None,
    workers=2,
):
    """
    执行对抗训练防御
    
    参数:
        defense_type: 防御算法类型，支持 "pgd", "fgm", "freeat", "yopo", "freelb" 等
        base_model: 基础模型路径或名称
        data_yaml: 数据集YAML定义路径
        epochs: 训练轮数
        imgsz: 输入图像大小
        batch: 批次大小
        model_name: 训练后的模型名称，如果为None则自动生成
        device: CUDA设备ID或"cpu"
        eps: 最大扰动幅度 (例如: "8/255")
        alpha: 单步扰动大小 (例如: "2/255")
        steps: 对抗攻击步数，如果为None则根据防御类型自动设置
        attack_ratio: 训练批次中使用对抗样本的比例
        task_id: 任务ID
        result_file: 结果保存文件路径
    """
    # 根据防御类型设置默认参数
    defense_type = defense_type.lower()
    
    # 如果未指定模型名称，则自动生成
    if model_name is None:
        model_name = f"yolov8s-{defense_type}-defended"
    
    # 根据防御类型设置默认步数
    if steps is None:
        if defense_type == "pgd":
            steps = 10  # PGD默认使用10步
        elif defense_type == "fgm":
            steps = 1   # FGM默认使用1步
        elif defense_type == "freeat":
            steps = 4   # FreeAT默认使用4步
        elif defense_type == "yopo":
            steps = 5   # YOPO默认使用5步
        elif defense_type == "freelb":
            steps = 5   # FreeLB默认使用5步
        elif defense_type == "genaf":
            steps = 3   # GenAF默认使用3步
        else:
            steps = 3   # 其他类型默认使用3步
    
    # 构建运行描述
    run_desc = f"{defense_type}_defense_{task_id}" if task_id else f"{defense_type}_defense"
    
    try:
        # 使用train_visdrone函数进行对抗训练防御
        result = train_visdrone(
            base_model=base_model,
            data_yaml=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            run_desc=run_desc,
            model_name=model_name,
            device=device,
            activate=True,
            adv_train=True,
            adv_ratio=attack_ratio,
            adv_eps=eps,
            adv_alpha=alpha,
            adv_steps=steps,
            adv_attack=defense_type,  # 使用指定的防御类型进行对抗训练
            workers=workers,
        )
        
        # 准备结果
        output = {
            "status": "Completed",
            "defense_type": defense_type,
            "model_name": model_name,
            "result": str(result)  # 转换为字符串，确保可序列化
        }
        
        # 保存结果到文件（如果指定）
        if result_file:
            with open(result_file, 'w') as f:
                json.dump(output, f)
        
        print(f"训练完成: {model_name}")
        return output
        
    except Exception as e:
        error_info = {
            "status": "Failed",
            "error": str(e)
        }
        
        # 保存错误信息到文件（如果指定）
        if result_file:
            with open(result_file, 'w') as f:
                json.dump(error_info, f)
        
        print(f"训练失败: {str(e)}")
        raise e


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="对抗训练防御执行脚本")
    parser.add_argument("--defense_type", type=str, default="pgd", help="防御算法类型")
    parser.add_argument("--base_model", type=str, default="yolov8s.pt", help="基础模型路径或名称")
    parser.add_argument("--data_yaml", type=str, default="backend/datasets/VisDrone_Dataset/visdrone.yaml", help="数据集YAML定义路径")
    parser.add_argument("--epochs", type=int, default=30, help="训练轮数")
    parser.add_argument("--imgsz", type=int, default=640, help="输入图像大小")
    parser.add_argument("--batch", type=int, default=16, help="批次大小")
    parser.add_argument("--model_name", type=str, default=None, help="训练后的模型名称")
    parser.add_argument("--device", type=str, default="0", help="CUDA设备ID或'cpu'")
    parser.add_argument("--eps", type=str, default="8/255", help="最大扰动幅度")
    parser.add_argument("--alpha", type=str, default="2/255", help="单步扰动大小")
    parser.add_argument("--steps", type=int, default=None, help="对抗攻击步数")
    parser.add_argument("--attack_ratio", type=float, default=0.5, help="训练批次中使用对抗样本的比例")
    parser.add_argument("--task_id", type=str, default=None, help="任务ID")
    parser.add_argument("--result_file", type=str, default=None, help="结果保存文件路径")
    parser.add_argument("--workers", type=int, default=2, help="DataLoader workers 数量，降低可减少内存占用")
    
    args = parser.parse_args()
    
    # 设置设备
    device = args.device
    if device.isdigit():
        device = int(device)
    
    # 执行训练
    run_defense_training(
        defense_type=args.defense_type,
        base_model=args.base_model,
        data_yaml=args.data_yaml,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        model_name=args.model_name,
        device=device,
        eps=args.eps,
        alpha=args.alpha,
        steps=args.steps,
        attack_ratio=args.attack_ratio,
        task_id=args.task_id,
        result_file=args.result_file,
        workers=args.workers,
    )
