# SkyGuard UAV 防御系统 Windows 环境部署指南

本文档提供在Windows环境下使用Conda部署SkyGuard UAV防御系统的完整步骤。

## 1. 环境准备

### 安装必要软件

1. **安装Anaconda或Miniconda**:
   - 下载地址: https://www.anaconda.com/download/ 或 https://docs.conda.io/en/latest/miniconda.html
   - 安装过程中勾选"Add Anaconda to my PATH environment variable"

2. **安装Redis**:
   - 下载Redis Windows版本: https://github.com/microsoftarchive/redis/releases
   - 下载最新的ZIP文件并解压到合适位置，如`C:\Redis`
   - 可以设置Redis为Windows服务: `C:\Redis\redis-server.exe --service-install`
   
3. **安装Node.js** (用于前端开发):
   - 下载地址: https://nodejs.org/ (推荐LTS版本)

### 创建Conda环境

打开PowerShell或Command Prompt并运行:

```powershell
# 创建名为skyguard的环境，使用Python 3.9
conda create -n skyguard python=3.9
# 激活环境
conda activate skyguard
```

### 安装依赖

```powershell
# 安装主要Python依赖
pip install fastapi uvicorn celery redis torch torchvision opencv-python pillow torchattacks ultralytics
```

## 2. 项目设置

### 目录结构准备

```powershell
# 创建项目目录
mkdir -p backend\assets backend\results
```

### 后端实现

#### 1. 创建celery_app.py

在`backend`目录下创建文件`celery_app.py`，内容如下:

```python
from celery import Celery

# 创建Celery应用
celery_app = Celery(
    "skyguard",
    broker="redis://localhost:6379/0",  # Redis作为消息代理
    backend="redis://localhost:6379/1"  # Redis作为结果后端
)

# 配置Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True
)

if __name__ == "__main__":
    celery_app.start()
```

#### 2. 创建tasks.py

在`backend`目录下创建文件`tasks.py`，内容如下:

```python
import torch
import cv2
import os
import numpy as np
from celery_app import celery_app
from torchvision.transforms.functional import to_tensor
import torchattacks

@celery_app.task
def run_attack_task(task_id):
    """执行对抗攻击任务"""
    try:
        # --- 1. 准备工作 ---
        # 创建结果目录
        # 注意Windows下路径使用反斜杠，但Python中可以使用正斜杠
        result_path = os.path.join("backend", "results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 加载模型 (YOLOv5)
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        
        # 加载测试图片 (如果不存在，则使用YOLOv5仓库的样例图片)
        image_path = os.path.join("backend", "assets", "test_image.jpg")
        if not os.path.exists(image_path):
            # 如果没有测试图片，使用COCO数据集中的图片（通过YOLOv5仓库获取）
            image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
        print(f"Using image: {image_path}")
        
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_tensor = to_tensor(image_rgb).unsqueeze(0)  # 转换成PyTorch Tensor
        
        # --- 2. 攻击前 ---
        # 对原始图片进行检测
        results_before = model(image_rgb)
        os.makedirs(os.path.join(result_path, "result_before"), exist_ok=True)
        results_before.save(save_dir=result_path, name="result_before")  # YOLOv5自带的保存结果功能
        
        # --- 3. 执行攻击 (使用 Torchattacks) ---
        # 硬编码一个FGSM攻击
        attack = torchattacks.FGSM(model, eps=8/255)
        adv_image_tensor = attack(img_tensor, torch.tensor([0]))  # 这里的label可以随便给
        
        # --- 4. 攻击后 ---
        # 对抗样本转换回图片格式
        adv_image_np = adv_image_tensor.squeeze(0).permute(1, 2, 0).detach().cpu().numpy() * 255
        adv_image_np = cv2.cvtColor(adv_image_np.astype('uint8'), cv2.COLOR_RGB2BGR)
        cv2.imwrite(os.path.join(result_path, "adversarial_image.jpg"), adv_image_np)
        
        # 对抗样本检测结果
        adv_image_rgb = cv2.cvtColor(adv_image_np, cv2.COLOR_BGR2RGB)
        results_after = model(adv_image_rgb)
        os.makedirs(os.path.join(result_path, "result_after"), exist_ok=True)
        results_after.save(save_dir=result_path, name="result_after")  # 保存攻击后的结果
        
        return {"status": "Completed", "result_path": result_path}
    
    except Exception as e:
        # 记录错误信息
        error_path = os.path.join("backend", "results", task_id, "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        print(f"Error in task {task_id}: {str(e)}")
        raise e
```

#### 3. 创建main.py

在`backend`目录下创建文件`main.py`，内容如下:

```python
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pydantic import BaseModel
from tasks import run_attack_task

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

## 3. 启动服务

### 启动Redis服务器

如果你安装了Redis Windows服务:
```powershell
# 启动服务
net start redis

# 或者直接运行Redis服务器
cd C:\Redis
.\redis-server.exe
```

### 启动后端API服务

在新的PowerShell窗口中:

```powershell
# 切换到项目目录
cd 你的项目路径

# 激活环境
conda activate skyguard

# 启动FastAPI服务器
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 启动Celery Worker

在另一个PowerShell窗口中:

```powershell
# 切换到项目目录
cd 你的项目路径

# 激活环境
conda activate skyguard

# Windows下Celery Worker的启动方式
cd backend
celery -A celery_app.celery_app worker --pool=solo -l info
```

> 注意：在Windows上，需要使用 `--pool=solo` 参数运行Celery。

### 启动前端开发服务器

在另一个PowerShell窗口中:

```powershell
# 切换到前端目录
cd 你的项目路径\frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 4. 测试图像准备

你可以下载一个测试图像到`backend/assets`目录:

1. 创建一个简单的脚本来下载测试图像:

```powershell
# 使用PowerShell下载图像
Invoke-WebRequest -Uri "https://github.com/ultralytics/yolov5/raw/master/data/images/bus.jpg" -OutFile "backend/assets/test_image.jpg"
```

或者手动从浏览器下载图像:
https://github.com/ultralytics/yolov5/raw/master/data/images/bus.jpg

## 5. 访问系统

- 后端API: http://localhost:8000
- 前端界面: http://localhost:5173 (或你的Vite开发服务器端口)

## 6. Windows下的常见问题排查

### Redis连接错误

确保Redis服务已启动:

```powershell
# 检查Redis服务状态
sc query redis

# 或者尝试连接Redis
cd C:\Redis
.\redis-cli.exe ping
# 应返回 PONG
```

### Celery Worker错误

Windows下使用Celery有一些限制，确保:

1. 使用 `--pool=solo` 参数
2. 避免使用守护进程模式
3. 如果有兼容性问题，可以尝试安装gevent: `pip install gevent`

### 文件路径问题

Windows使用反斜杠(`\`)作为路径分隔符，而大多数Python代码使用正斜杠(`/`)。如果出现路径错误:

1. 使用`os.path.join()`函数构建路径
2. 确保目录存在: `os.makedirs(path, exist_ok=True)`

### 模型下载失败

如果无法下载YOLOv5模型，可以手动下载:

1. 创建目录: `mkdir %USERPROFILE%\.cache\torch\hub\checkpoints`
2. 下载模型: 
   ```powershell
   Invoke-WebRequest -Uri "https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.pt" -OutFile "$env:USERPROFILE\.cache\torch\hub\checkpoints\yolov5s.pt"
   ```

## 7. 测试流程

1. 打开前端URL (http://localhost:5173)
2. 点击"开始演练"按钮
3. 观察后端终端，确认任务正在执行
4. 等待处理完成
5. 查看攻击前后的目标检测结果对比

如果一切顺利，你将看到攻击前的图像包含目标检测框，而攻击后的图像目标检测效果被干扰。 