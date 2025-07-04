# SkyGuard UAV 防御系统部署指南 (Linux环境)

本文档提供在Linux环境下部署SkyGuard UAV防御系统的完整步骤，包括环境准备、后端实现、前端配置以及系统运行。

## 1. 环境准备

### 基本环境

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基本工具
sudo apt install -y git python3 python3-pip python3-venv redis-server

# 为前端安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
python3 --version
node --version
npm --version
redis-server --version
```

### 克隆项目仓库

```bash
git clone https://github.com/your-username/SkyGuard-UAV-Defense.git
cd SkyGuard-UAV-Defense
```

### 创建Python虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate
```

### 安装Python依赖

```bash
# 安装主要依赖
pip install fastapi uvicorn celery redis torch torchvision torchattacks opencv-python pillow ultralytics

# 或者从requirements.txt安装
pip install -r requirements.txt
```

## 2. 后端实现

### 目录结构准备

```bash
# 创建必要的目录
mkdir -p backend/assets backend/results
```

### 创建核心后端文件

#### 1. celery_app.py

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

#### 2. tasks.py

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
        result_path = os.path.join("backend/results", task_id)
        os.makedirs(result_path, exist_ok=True)
        
        # 加载模型 (YOLOv5)
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).eval()
        
        # 加载测试图片 (如果不存在，则使用YOLOv5仓库的样例图片)
        image_path = "backend/assets/test_image.jpg"
        if not os.path.exists(image_path):
            # 如果没有测试图片，使用COCO数据集中的图片（通过YOLOv5仓库获取）
            image_path = torch.hub.get_dir() + '/ultralytics_yolov5_master/data/images/zidane.jpg'
        
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
        error_path = os.path.join(f"backend/results/{task_id}", "error.txt")
        os.makedirs(os.path.dirname(error_path), exist_ok=True)
        with open(error_path, "w") as f:
            f.write(str(e))
        raise e
```

#### 3. main.py

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

# 挂载静态文件服务
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
    result_path = f"backend/results/{task_id}"
    
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

## 3. 使用Docker部署（可选）

### 创建Dockerfile

```bash
cat > backend/Dockerfile << 'EOF'
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 复制并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p /app/assets /app/results

# 设置默认命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
```

### 创建docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  # 后端API服务
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app # 挂载代码和结果
    depends_on:
      - redis
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # 前端服务 (用一个简单的Nginx来托管)
  frontend:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - backend

  # Redis 消息队列
  redis:
    image: redis:6.2-alpine

  # Celery 计算节点 (需要GPU支持)
  worker:
    build: ./backend
    command: celery -A celery_app.celery_app worker -l info
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    # 如果需要GPU，需要配置runtime
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
EOF
```

### 使用Docker Compose启动服务

```bash
# 构建和启动服务
docker-compose up --build -d

# 查看服务日志
docker-compose logs -f
```

## 4. 直接在主机运行（无Docker）

### 1. 启动Redis服务

```bash
# 启动Redis服务
sudo systemctl start redis-server
sudo systemctl status redis-server
```

### 2. 启动后端API服务

```bash
cd SkyGuard-UAV-Defense
source venv/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 启动Celery Worker

```bash
# 新开一个终端
cd SkyGuard-UAV-Defense
source venv/bin/activate
cd backend
celery -A celery_app.celery_app worker -l info
```

### 4. 前端开发服务

```bash
# 新开一个终端
cd SkyGuard-UAV-Defense/frontend
npm install
npm run dev
```

## 5. 可选：下载测试图像

```bash
# 下载一个示例图像用于测试
wget -O backend/assets/test_image.jpg https://github.com/ultralytics/yolov5/raw/master/data/images/bus.jpg
```

## 6. 访问系统

- 后端API: http://localhost:8000
- 前端界面: http://localhost:5173 (使用npm run dev的开发模式)
  或 http://localhost:8080 (使用Docker Compose)

## 7. GPU支持（可选）

如果您有NVIDIA GPU并希望加速模型处理:

```bash
# 安装CUDA支持的PyTorch
pip install torch==1.13.1+cu116 torchvision==0.14.1+cu116 --extra-index-url https://download.pytorch.org/whl/cu116
```

## 8. 常见问题排查

### 无法下载YOLOv5模型

如果YOLOv5模型下载失败，可以手动下载并放置:

```bash
mkdir -p ~/.cache/torch/hub/ultralytics_yolov5_master/
wget -O ~/.cache/torch/hub/checkpoints/yolov5s.pt https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.pt
```

### Redis连接错误

检查Redis服务是否正在运行:

```bash
sudo systemctl status redis-server
# 如果没有运行，启动它
sudo systemctl start redis-server
```

### CORS错误

如果前端无法连接后端，请检查CORS配置和网络连接:

```bash
# 测试API可用性
curl http://localhost:8000
```

### 模型加载缓慢

首次运行时模型加载可能较慢，因为需要下载权重。后续运行会更快。

### 确认目录权限

确保目录权限正确:

```bash
chmod -R 755 backend/results
chmod -R 755 backend/assets
```

## 9. 系统测试

1. 访问前端URL (http://localhost:5173 或 http://localhost:8080)
2. 点击"开始演练"按钮
3. 等待处理完成
4. 查看攻击前后的目标检测结果对比

## 10. 下一步开发建议

1. 添加用户认证系统
2. 实现更多攻击算法选择
3. 集成真实无人机视频流
4. 添加详细的攻击效果分析报告
5. 实现防御模型训练功能 