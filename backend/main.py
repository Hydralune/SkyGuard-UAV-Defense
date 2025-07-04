from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pydantic import BaseModel
from tasks import run_attack_task, pgd_attack_task, environment_attack_task
from typing import Optional, List
from train_model import train_model_task
from defense import run_defense_task
from visualization import generate_visualization
from evaluate import evaluate_defense_task

# 创建FastAPI应用实例
app = FastAPI(title="SkyGuard UAV Defense")

# 配置CORS（跨域资源共享）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境中应该指定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件服务 - 注意Windows路径
app.mount("/api/images", StaticFiles(directory="backend/results"), name="images")

# API模型
class DrillResponse(BaseModel):
    task_id: str
    message: str

class ResultResponse(BaseModel):
    status: str
    before_image_url: str = None
    after_image_url: str = None

class TrainingRequest(BaseModel):
    model_type: str = "yolov5s"
    dataset: str = "drone_detection_maciullo"
    epochs: int = 50
    batch_size: int = 16
    adv_training: bool = False
    adv_method: Optional[str] = "pgd"
    adv_ratio: Optional[float] = 0.5

class TrainingResponse(BaseModel):
    task_id: str
    message: str

class TrainingStatusResponse(BaseModel):
    status: str
    progress: Optional[float] = None
    model_path: Optional[str] = None
    metrics: Optional[dict] = None

class AttackRequest(BaseModel):
    image_path: Optional[str] = None
    model_path: Optional[str] = None
    attack_type: str = "fgsm"
    attack_params: dict = {}

class DefenseRequest(BaseModel):
    defense_type: str = "gaussian_blur"
    params: Optional[dict] = None

class EvaluationRequest(BaseModel):
    model_path: Optional[str] = None
    dataset_path: Optional[str] = None
    defense_type: Optional[str] = None

class VisualizationRequest(BaseModel):
    image_path: Optional[str] = None
    result_path: Optional[str] = None

@app.get("/")
def read_root():
    """API根路径，返回欢迎信息"""
    return {"message": "Welcome to SkyGuard UAV Defense API"}

@app.post("/api/start-basic-drill", response_model=DrillResponse)
async def start_basic_drill():
    """启动基础攻防演练"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    run_attack_task.delay(task_id)
    
    return {"task_id": task_id, "message": "Basic drill started"}

@app.get("/api/get-result/{task_id}", response_model=ResultResponse)
async def get_result(task_id: str):
    """获取演练结果"""
    result_path = os.path.join("backend", "results", task_id)
    
    # 检查结果是否已经生成
    if not os.path.exists(result_path):
        return {"status": "PENDING"}
    
    # 检查必要的结果文件是否存在
    before_path = os.path.join(result_path, "result_before", "test_image.jpg")
    after_path = os.path.join(result_path, "result_after", "test_image.jpg")
    
    if os.path.exists(before_path) and os.path.exists(after_path):
        return {
            "status": "COMPLETED",
            "before_image_url": f"/api/images/{task_id}/result_before/test_image.jpg",
            "after_image_url": f"/api/images/{task_id}/result_after/test_image.jpg"
        }
    
    # 如果文件夹存在但文件尚未生成，任务仍在处理中
    return {"status": "PROCESSING"}

@app.post("/api/start-training", response_model=TrainingResponse)
async def start_training(request: TrainingRequest):
    """启动模型训练任务"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    train_model_task.delay(
        task_id, 
        request.model_type, 
        request.dataset, 
        request.epochs, 
        request.batch_size,
        request.adv_training, 
        request.adv_method, 
        request.adv_ratio
    )
    
    return {"task_id": task_id, "message": "Training started"}

@app.get("/api/get-training-status/{task_id}", response_model=TrainingStatusResponse)
async def get_training_status(task_id: str):
    """获取训练任务状态"""
    result_path = os.path.join("backend", "results", task_id)
    
    # 检查结果是否已经生成
    if not os.path.exists(result_path):
        return {"status": "PENDING"}
    
    # 检查是否有错误
    error_path = os.path.join(result_path, "error.txt")
    if os.path.exists(error_path):
        with open(error_path, "r") as f:
            error_message = f.read()
        return {"status": "FAILED", "metrics": {"error": error_message}}
    
    # 检查最终模型是否已生成
    final_model_path = os.path.join(result_path, "final_model.pt")
    if os.path.exists(final_model_path):
        # 如果有评估指标文件，读取它
        metrics_path = os.path.join(result_path, "metrics.json")
        metrics = None
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                import json
                metrics = json.load(f)
                
        return {
            "status": "COMPLETED",
            "model_path": f"/api/models/{task_id}/final_model.pt",
            "metrics": metrics
        }
    
    # 检查训练进度
    log_path = os.path.join(result_path, "training_log.txt")
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            lines = f.readlines()
        
        # 尝试从日志中解析进度
        progress = 0.0
        for line in reversed(lines):
            if "Epoch" in line:
                try:
                    current, total = line.split("Epoch ")[1].split("/")[0:2]
                    current = int(current)
                    total = int(total.split()[0])
                    progress = current / total
                    break
                except:
                    pass
        
        return {"status": "PROCESSING", "progress": progress}
    
    # 如果文件夹存在但没有日志，任务可能刚开始
    return {"status": "PROCESSING", "progress": 0.0}

@app.post("/api/run-attack", response_model=DrillResponse)
async def run_attack(request: AttackRequest):
    """运行指定的攻击方法"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 根据攻击类型选择不同的任务
    if request.attack_type == "fgsm":
        # 使用FGSM攻击任务
        run_attack_task.delay(task_id)
    elif request.attack_type == "pgd":
        # 使用PGD攻击任务
        eps = request.attack_params.get("eps", 8/255)
        alpha = request.attack_params.get("alpha", 2/255)
        steps = request.attack_params.get("steps", 10)
        pgd_attack_task.delay(task_id, eps, alpha, steps)
    elif request.attack_type.startswith("env_"):
        # 环境干扰攻击
        env_type = request.attack_type[4:]  # 去掉'env_'前缀
        intensity = request.attack_params.get("intensity", 0.5)
        environment_attack_task.delay(task_id, env_type, intensity)
    else:
        raise HTTPException(status_code=400, detail=f"不支持的攻击类型: {request.attack_type}")
    
    return {"task_id": task_id, "message": f"{request.attack_type.upper()} attack started"}

@app.post("/api/run-defense", response_model=DrillResponse)
async def run_defense(request: DefenseRequest):
    """运行指定的防御方法"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    run_defense_task.delay(task_id, request.defense_type, request.params)
    
    return {"task_id": task_id, "message": f"{request.defense_type} defense started"}

@app.post("/api/evaluate-defense", response_model=DrillResponse)
async def evaluate_defense(request: EvaluationRequest):
    """评估防御效果"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    evaluate_defense_task.delay(task_id, request.model_path, request.dataset_path, request.defense_type)
    
    return {"task_id": task_id, "message": "Defense evaluation started"}

@app.post("/api/generate-visualization", response_model=DrillResponse)
async def create_visualization(request: VisualizationRequest):
    """生成可视化结果"""
    # 生成任务ID
    task_id = str(uuid.uuid4())
    
    # 将任务推送到队列
    generate_visualization.delay(task_id, request.image_path, request.result_path)
    
    return {"task_id": task_id, "message": "Visualization generation started"}

@app.get("/api/available-datasets")
async def get_available_datasets():
    """获取可用的数据集列表"""
    datasets_dir = os.path.join("backend", "datasets")
    if not os.path.exists(datasets_dir):
        return {"datasets": []}
    
    datasets = []
    for item in os.listdir(datasets_dir):
        item_path = os.path.join(datasets_dir, item)
        if os.path.isdir(item_path):
            datasets.append({
                "name": item,
                "path": item_path
            })
    
    return {"datasets": datasets}

@app.get("/api/available-models")
async def get_available_models():
    """获取可用的模型列表"""
    models = []
    
    # 检查预训练模型
    pretrained_models = ["yolov5s", "yolov5m", "yolov5l", "yolov5x"]
    for model in pretrained_models:
        models.append({
            "name": model,
            "type": "pretrained",
            "description": f"YOLOv5 {model} 预训练模型"
        })
    
    # 检查自定义训练模型
    results_dir = os.path.join("backend", "results")
    if os.path.exists(results_dir):
        for task_id in os.listdir(results_dir):
            model_path = os.path.join(results_dir, task_id, "final_model.pt")
            if os.path.exists(model_path):
                models.append({
                    "name": f"custom_{task_id}",
                    "type": "custom",
                    "path": model_path,
                    "task_id": task_id,
                    "description": f"自定义训练模型 (任务ID: {task_id})"
                })
    
    return {"models": models}

@app.get("/api/attack-types")
async def get_attack_types():
    """获取可用的攻击类型"""
    attack_types = [
        {
            "id": "fgsm",
            "name": "FGSM攻击",
            "description": "Fast Gradient Sign Method，一种快速梯度符号攻击方法",
            "params": {
                "eps": {
                    "type": "float",
                    "default": 8/255,
                    "description": "扰动大小"
                }
            }
        },
        {
            "id": "pgd",
            "name": "PGD攻击",
            "description": "Projected Gradient Descent，投影梯度下降攻击方法",
            "params": {
                "eps": {
                    "type": "float",
                    "default": 8/255,
                    "description": "扰动大小"
                },
                "alpha": {
                    "type": "float",
                    "default": 2/255,
                    "description": "步长"
                },
                "steps": {
                    "type": "int",
                    "default": 10,
                    "description": "迭代次数"
                }
            }
        },
        {
            "id": "env_brightness",
            "name": "亮度干扰",
            "description": "调整图像亮度进行干扰",
            "params": {
                "intensity": {
                    "type": "float",
                    "default": 0.5,
                    "description": "干扰强度"
                }
            }
        },
        {
            "id": "env_noise",
            "name": "噪声干扰",
            "description": "添加高斯噪声进行干扰",
            "params": {
                "intensity": {
                    "type": "float",
                    "default": 0.5,
                    "description": "干扰强度"
                }
            }
        },
        {
            "id": "env_contrast",
            "name": "对比度干扰",
            "description": "调整图像对比度进行干扰",
            "params": {
                "intensity": {
                    "type": "float",
                    "default": 0.5,
                    "description": "干扰强度"
                }
            }
        },
        {
            "id": "env_blur",
            "name": "模糊干扰",
            "description": "对图像进行模糊处理",
            "params": {
                "intensity": {
                    "type": "float",
                    "default": 0.5,
                    "description": "干扰强度"
                }
            }
        }
    ]
    
    return {"attack_types": attack_types}

@app.get("/api/defense-types")
async def get_defense_types():
    """获取可用的防御类型"""
    defense_types = [
        {
            "id": "gaussian_blur",
            "name": "高斯模糊",
            "description": "使用高斯模糊过滤对抗扰动",
            "params": {
                "kernel_size": {
                    "type": "int",
                    "default": 5,
                    "description": "核大小"
                }
            }
        },
        {
            "id": "median_blur",
            "name": "中值滤波",
            "description": "使用中值滤波过滤对抗扰动",
            "params": {
                "kernel_size": {
                    "type": "int",
                    "default": 5,
                    "description": "核大小"
                }
            }
        },
        {
            "id": "jpeg_compression",
            "name": "JPEG压缩",
            "description": "使用JPEG压缩过滤对抗扰动",
            "params": {
                "quality": {
                    "type": "int",
                    "default": 75,
                    "description": "压缩质量"
                }
            }
        },
        {
            "id": "bit_depth_reduction",
            "name": "位深度降低",
            "description": "降低图像位深度过滤对抗扰动",
            "params": {
                "depth": {
                    "type": "int",
                    "default": 5,
                    "description": "目标位深度"
                }
            }
        }
    ]
    
    return {"defense_types": defense_types}

# 挂载模型文件服务
app.mount("/api/models", StaticFiles(directory="backend/results"), name="models")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
