# SkyGuard UAV Defense System

SkyGuard是一个针对低空无人机威胁的智能防御系统，使用计算机视觉和对抗学习技术来检测、识别和防御恶意无人机。

## 项目概述

SkyGuard系统包含以下主要功能：

- 无人机目标检测和识别
- 对抗攻击模拟（FGSM、PGD等）
- 防御策略实现和评估
- 可视化分析工具
- 模型训练和评估

## 系统架构

- **前端**：基于React的Web界面，使用Tailwind CSS进行样式设计
- **后端**：FastAPI + Celery异步任务队列
- **模型**：基于YOLOv5的目标检测模型，支持对抗训练

## 快速开始

### 使用Docker

最简单的方式是使用Docker Compose启动整个系统：

```bash
docker-compose up
```

### 手动安装

1. 安装后端依赖：

```bash
cd backend
pip install -r requirements.txt
```

2. 安装前端依赖：

```bash
cd frontend
npm install
```

3. 启动后端服务：

```bash
cd backend
uvicorn main:app --reload
```

4. 启动Celery worker：

```bash
cd backend
celery -A celery_app worker --loglevel=info
```

5. 启动前端开发服务器：

```bash
cd frontend
npm run dev
```

## 数据集

系统支持多种无人机数据集，可以使用以下命令下载：

```bash
cd backend
python download_dataset.py drone_detection_maciullo  # 下载DroneDetectionDataset
python download_dataset.py anti_uav  # 下载Anti-UAV数据集
python download_dataset.py all  # 下载所有数据集
```

可用的数据集包括：
- drone_detection_maciullo: DroneDetectionDataset - 包含无人机图像和标注
- drone_detection_test: DroneDetectionDataset测试集
- anti_uav: Anti-UAV数据集，包含红外和可见光无人机图像
- halmstad_drone: Halmstad Drone Dataset，包含红外、可见光和音频数据
- yolov7_drone: YOLOv7 Drone Detection数据集

## 模型训练

使用以下命令训练无人机检测模型：

```bash
cd backend
python train_model.py --model yolov5s --dataset drone_detection_maciullo --epochs 50
```

支持对抗训练：

```bash
python train_model.py --model yolov5s --dataset drone_detection_maciullo --adv-training --adv-method pgd
```

## API接口

系统提供了丰富的REST API接口：

- `/api/start-training`: 启动模型训练
- `/api/get-training-status/{task_id}`: 获取训练状态
- `/api/run-attack`: 执行对抗攻击
- `/api/run-defense`: 执行防御方法
- `/api/evaluate-defense`: 评估防御效果
- `/api/generate-visualization`: 生成可视化结果

完整API文档可访问：http://localhost:8000/docs

## 攻击方法

系统支持多种对抗攻击方法：

- FGSM (Fast Gradient Sign Method)
- PGD (Projected Gradient Descent)
- 环境干扰攻击（亮度、噪声、对比度、模糊）

## 防御方法

系统实现了多种防御策略：

- 高斯模糊
- 中值滤波
- JPEG压缩
- 位深度降低

## 后端开发指南

### 添加新的攻击方法

1. 在`backend/tasks.py`中添加新的Celery任务函数
2. 在`backend/main.py`的`run_attack`API中添加对应的处理逻辑
3. 在`backend/main.py`的`get_attack_types`API中添加新攻击类型的描述

### 添加新的防御方法

1. 在`backend/defense.py`中扩展`run_defense_task`函数
2. 在`backend/main.py`的`get_defense_types`API中添加新防御类型的描述

### 添加新的评估指标

在`backend/evaluate.py`中扩展`evaluate_defense_task`函数，添加新的评估指标。

## 前端开发指南

前端使用React + Tailwind CSS开发，UI组件基于Shadcn UI。

## 贡献指南

欢迎提交Pull Request或Issue来改进SkyGuard系统。

## 许可证

MIT
