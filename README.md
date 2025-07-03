# SkyGuard-UAV-Defense

无人机防御系统，用于研究和应对低空无人智能体的安全挑战。

## 项目概述

本项目旨在开发一个无人机智能安全平台，专注于：
- 无人机目标检测模型的对抗攻击与防御
- 环境干扰条件下的鲁棒性增强
- 场景跃变情况下的适应性优化

## 安装指南

### 环境要求
- Docker 和 Docker Compose
- NVIDIA GPU (推荐用于AI计算)
- NVIDIA Container Toolkit (需要GPU支持)

### 安装步骤
1. 克隆仓库
```
git clone https://github.com/yourusername/SkyGuard-UAV-Defense.git
cd SkyGuard-UAV-Defense
```

2. 使用Docker Compose启动所有服务
```
docker-compose up --build
```

## 使用说明

1. 启动服务后，访问 http://localhost:8080 打开前端界面
2. 点击"开始基础攻防演练"按钮开始演示
3. 系统将执行无人机图像的对抗攻击，并展示攻击前后的检测效果对比

## 项目结构
```
SkyGuard-UAV-Defense/
├── backend/             # 后端API服务
│   ├── app/             # 应用代码
│   ├── assets/          # 测试图像等资源
│   └── results/         # 存储任务结果
├── docs/                # 文档
├── frontend/            # Vue前端应用
├── scripts/             # 辅助脚本
└── src/                 # AI模型代码
    ├── configs/         # 模型配置
    ├── models/          # 模型定义
    ├── datasets/        # 数据集加载
    └── utils/           # 工具函数
```
