 # backend/train_model.py
import os
import torch
import argparse
import yaml
from celery_app import celery_app
import time
from tqdm import tqdm

@celery_app.task
def train_model_task(task_id, model_type="yolov5s", dataset="drone_detection_maciullo", 
                     epochs=50, batch_size=16, adv_training=False, 
                     adv_method="pgd", adv_ratio=0.5):
    """训练模型的Celery任务"""
    try:
        # 创建结果目录
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 记录训练配置
        config = {
            "model_type": model_type,
            "dataset": dataset,
            "epochs": epochs,
            "batch_size": batch_size,
            "adv_training": adv_training,
            "adv_method": adv_method if adv_training else None,
            "adv_ratio": adv_ratio if adv_training else None
        }
        
        with open(os.path.join(result_path, "training_config.yaml"), "w") as f:
            yaml.dump(config, f)
        
        # 检查数据集路径
        dataset_path = os.path.join("backend", "datasets", dataset)
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"数据集 {dataset} 不存在，请先下载")
        
        # 训练模型 - 使用YOLOv5
        if model_type.startswith("yolo"):
            # 克隆YOLOv5仓库（如果不存在）
            yolo_path = os.path.join("backend", "yolov5")
            if not os.path.exists(yolo_path):
                os.system(f"git clone https://github.com/ultralytics/yolov5 {yolo_path}")
            
            # 准备训练配置
            data_yaml = os.path.join(dataset_path, "data.yaml")
            if not os.path.exists(data_yaml):
                # 创建数据集配置文件
                create_data_yaml(dataset_path, data_yaml)
            
            # 开始训练
            train_cmd = f"cd {yolo_path} && python train.py --img 640 --batch {batch_size} --epochs {epochs} --data {data_yaml} --weights {model_type}.pt --project {result_path} --name model"
            os.system(train_cmd)
            
            # 复制最终模型到结果目录
            final_model_path = os.path.join(result_path, "model", "weights", "best.pt")
            if os.path.exists(final_model_path):
                os.system(f"cp {final_model_path} {os.path.join(result_path, 'final_model.pt')}")
        else:
            raise ValueError(f"不支持的模型类型: {model_type}")
        
        # 记录训练完成
        with open(os.path.join(result_path, "training_log.txt"), "a") as f:
            f.write(f"Training completed at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        return {
            "status": "Completed", 
            "result_path": result_path,
            "model_path": os.path.join(result_path, "final_model.pt")
        }
    
    except Exception as e:
        # 记录错误信息
        error_path = os.path.join("backend", "results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e

def create_data_yaml(dataset_path, output_path):
    """为YOLOv5创建数据集配置文件"""
    # 检查数据集结构
    train_path = os.path.join(dataset_path, "train", "images")
    val_path = os.path.join(dataset_path, "valid", "images")
    
    if not os.path.exists(train_path):
        train_path = os.path.join(dataset_path, "images", "train")
    
    if not os.path.exists(val_path):
        val_path = os.path.join(dataset_path, "images", "val")
    
    # 确定类别
    classes = ["drone"]  # 默认类别
    
    # 尝试从数据集中找到类别信息
    class_file = os.path.join(dataset_path, "classes.txt")
    if os.path.exists(class_file):
        with open(class_file, "r") as f:
            classes = [line.strip() for line in f.readlines()]
    
    # 创建YAML配置
    data = {
        "path": dataset_path,
        "train": train_path,
        "val": val_path,
        "test": val_path,  # 使用验证集作为测试集
        "nc": len(classes),
        "names": classes
    }
    
    # 写入YAML文件
    with open(output_path, "w") as f:
        yaml.dump(data, f)

def train_model(model_type="yolov5s", dataset="drone_detection_maciullo", 
                epochs=50, batch_size=16, adv_training=False, 
                adv_method="pgd", adv_ratio=0.5):
    """启动模型训练任务并返回任务ID"""
    import uuid
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    train_model_task.delay(
        task_id, model_type, dataset, epochs, batch_size, 
        adv_training, adv_method, adv_ratio
    )
    
    return task_id

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="训练UAV防御系统的目标检测模型")
    parser.add_argument("--model", default="yolov5s", help="模型类型")
    parser.add_argument("--dataset", default="drone_detection_maciullo", help="数据集名称")
    parser.add_argument("--epochs", type=int, default=50, help="训练轮数")
    parser.add_argument("--batch-size", type=int, default=16, help="批次大小")
    parser.add_argument("--adv-training", action="store_true", help="是否使用对抗训练")
    parser.add_argument("--adv-method", default="pgd", choices=["pgd", "fgsm"], help="对抗训练方法")
    parser.add_argument("--adv-ratio", type=float, default=0.5, help="对抗样本比例")
    
    args = parser.parse_args()
    
    task_id = train_model(
        args.model, args.dataset, args.epochs, args.batch_size,
        args.adv_training, args.adv_method, args.adv_ratio
    )
    
    print(f"训练任务已提交，任务ID: {task_id}")
    print(f"可以通过API查询任务状态: GET /api/get-training-status/{task_id}")