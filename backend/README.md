# SkyGuard UAV Defense – 后端开发指南

> SkyGuard UAV Defense 系统后端，提供无人机目标检测、对抗攻击生成与防御能力的 API 服务。

---

## 目录结构

```
backend/
├── algorithms/               # 算法实现
│   ├── attacks/              # 对抗攻击算法
│   │   ├── base.py           #   └ 攻击基类 (BaseAttack)
│   │   ├── pgd.py            #   └ PGD 实现
│   │   ├── fgsm.py           #   └ FGSM 实现
│   │   └── …                 #   └ 更多自定义算法
│   └── defenses/             # 对抗防御算法
│       ├── base.py           #   └ 防御基类 (Defense)
│       └── …                 #   └ 自定义防御
├── api.py                    # FastAPI 路由定义
├── assets/                   # 静态资源
├── callbacks/                # 训练回调 (AdvTrainingCallback 等)
├── celery_app.py             # Celery 配置与任务注册
├── config/                   # 配置文件
├── datasets/                 # 数据集（VisDrone 等）
├── defense.py                # 防御实现与任务
├── Dockerfile                # Docker 容器构建文件
├── download_dataset.py       # 自动下载并整理数据集
├── evaluate.py               # 统一评估入口
├── evaluate_adversarial.py   # 对抗样本评估脚本
├── evaluate_defense.py       # 防御效果评估脚本
├── evaluate_model.py         # 纯净样本评估脚本
├── main.py                   # FastAPI 应用入口
├── models/                   # 权重与训练输出
│   ├── active/               # 生产环境使用的权重软链
│   ├── baseline/             # 基线权重
│   └── runs/                 # Ultralytics 原生日志输出
├── results/                  # 结果输出目录
├── tasks.py                  # Celery 异步任务定义
├── train_model.py            # 统一训练脚本 (支持对抗训练)
├── utils/                    # 工具模块
│   ├── config_manager.py     #   └ 配置管理
│   ├── dataset_manager.py    #   └ 数据集管理
│   ├── evaluator.py          #   └ 评估工具
│   ├── model_loader.py       #   └ 模型加载
│   ├── model_manager.py      #   └ 模型管理
│   └── visualizer.py         #   └ 可视化工具
└── yolov8s-visdrone/         # 预训练 YOLOv8 权重及配置
```

---

## 核心功能模块说明

### API 模块 (api.py)
- `/api/ping` - API 健康检查
- `/api/model/test` - 启动模型测试任务
- `/api/attack/run` - 启动对抗攻击任务
- `/api/defense/run` - 启动防御任务
- `/api/task/{task_id}` - 获取任务状态和结果

### 异步任务模块 (tasks.py)
- `test_model_task` - 评估模型在纯净样本上的性能
- `run_attack_task` - 执行对抗攻击并评估效果
- `run_defense_task` - 应用防御策略并评估效果

### 评估模块
- `evaluate_model.py` - 纯净样本评估
- `evaluate_adversarial.py` - 对抗样本生成与评估
- `evaluate_defense.py` - 防御效果评估

### 算法模块 (algorithms/)
- `attacks/` - 对抗攻击算法实现
  - `pgd.py` - PGD (Projected Gradient Descent) 攻击
  - `fgsm.py` - FGSM (Fast Gradient Sign Method) 攻击
- `defenses/` - 防御算法实现

### 工具模块 (utils/)
- `config_manager.py` - 管理配置参数
- `dataset_manager.py` - 数据集加载与处理
- `model_manager.py` - 模型加载与管理
- `visualizer.py` - 结果可视化

---

## 环境配置

### 1. 创建 Conda 环境（推荐）
```bash
conda create -n skyguard python=3.9 -y
conda activate skyguard
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```
> 如果您在中国大陆，可考虑配置 `-i https://pypi.tuna.tsinghua.edu.cn/simple` 镜像源以加速下载。

### 3. 安装 Redis (用于 Celery)
#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### 使用 Docker
```bash
docker run -d --name redis -p 6379:6379 redis
```

### 4. 数据集准备
```bash
# 下载 VisDrone 数据集
python backend/download_dataset.py --dataset VisDrone
```

### 5. 模型准备
项目默认使用 YOLOv8 在 VisDrone 上的微调模型，权重已放置在 `backend/yolov8s-visdrone/` 中。

---

## 启动服务

### 1. 启动 FastAPI 服务
```bash
# 开发环境
cd /path/to/SkyGuard-UAV-Defense
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# 生产环境
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 2. 启动 Celery Worker
```bash
# 开发环境
cd /path/to/SkyGuard-UAV-Defense
celery -A backend.celery_app worker --loglevel=info

# 生产环境
cd /path/to/SkyGuard-UAV-Defense
celery -A backend.celery_app worker --loglevel=info --concurrency=4
```

### 3. 使用 Docker 部署（可选）
```bash
# 构建镜像
docker build -t skyguard-backend -f backend/Dockerfile .

# 启动容器
docker run -d --name skyguard-api -p 8000:8000 \
  -e CELERY_BROKER_URL=redis://redis:6379/0 \
  -e CELERY_RESULT_BACKEND=redis://redis:6379/1 \
  --link redis:redis \
  skyguard-backend
```

---

## API 使用指南

启动服务后，访问 Swagger UI 文档：http://127.0.0.1:8000/docs

### 基本流程

1. **检查 API 健康状态**
   - GET `/api/ping`
   - 预期响应: `{"msg": "pong"}`

2. **启动模型测试任务**
   - POST `/api/model/test`
   - 参数:
     - `model_name`: 模型名称，默认 "yolov8s-visdrone"
     - `dataset_name`: 数据集名称，默认 "VisDrone"
     - `num_images`: 评估图像数量，默认 20
     - `conf_threshold`: 置信度阈值，默认 0.25
     - `iou_threshold`: IoU 阈值，默认 0.5
   - 预期响应: `{"task_id": "uuid", "celery_task_id": "task_id"}`

3. **启动对抗攻击任务**
   - POST `/api/attack/run`
   - 参数:
     - `attack_name`: 攻击算法，如 "pgd", "fgsm"
     - `model_name`: 模型名称
     - `dataset_name`: 数据集名称
     - `num_images`: 图像数量
     - `eps`: 最大扰动大小，如 "8/255"
     - `alpha`: 每步扰动大小，如 "2/255"
     - `steps`: 攻击迭代步数
   - 预期响应: `{"task_id": "uuid", "celery_task_id": "task_id"}`

4. **查询任务状态**
   - GET `/api/task/{task_id}`
   - 预期响应: 
     ```json
     {
       "state": "SUCCESS",
       "status": "任务完成",
       "results": {
         "metrics": {...},
         "images": [...]
       }
     }
     ```

---

## 扩展攻击/防御算法

### 1. 添加新的攻击算法
1. 在 `backend/algorithms/attacks/` 新建文件，如 `new_attack.py`
2. 继承 `BaseAttack` 基类并实现 `forward()` 方法：
   ```python
   from .base import BaseAttack

   class NewAttack(BaseAttack):
       name = "new_attack"
       def forward(self, model, images, labels, eps):
           # 实现攻击逻辑
           return adversarial_images
   ```
3. 在 `backend/algorithms/attacks/__init__.py` 中注册：
   ```python
   from .new_attack import NewAttack  # noqa: F401
   ```

### 2. 添加新的防御算法
流程与攻击类似，目录位于 `backend/algorithms/defenses/`，基类为 `Defense`。

---

## 常见问题

### Q: Celery 任务无法启动
检查 Redis 服务是否正常运行，并确认 `CELERY_BROKER_URL` 和 `CELERY_RESULT_BACKEND` 环境变量设置正确。

### Q: 找不到数据集
确保已运行 `download_dataset.py` 下载数据集，或手动将数据集放置在 `backend/datasets/` 目录下。

### Q: 模型加载失败
检查 `backend/models/` 目录中是否存在对应的模型权重文件，或尝试运行 `train_model.py` 重新训练模型。

---

如对本项目有任何疑问或建议，欢迎提交 Issue 或 Pull Request！