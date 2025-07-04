# SkyGuard-UAV-Defense

低空无人智能体智能对抗攻防演练系统，用于研究和应对低空无人智能体的安全挑战。

## 项目概述

SkyGuard-UAV-Defense是一个现代化的无人机智能安全平台，专注于：
- 无人机目标检测模型的对抗攻击与防御
- 环境干扰条件下的鲁棒性增强
- 场景跃变情况下的适应性优化

系统提供了完整的攻防演练功能，包括攻击场景选择、防御策略配置、实时可视化、演练态势监控、评分报告等核心模块。

## 核心功能模块

1. **系统概览 (Dashboard)**
   - 攻防原理介绍
   - 系统状态监控
   - 快速操作入口

2. **攻击场景选择**
   - 对抗攻击配置 (PGD、FGSM、C&W、DeepFool、AdvPatch、DPatch)
   - 光电干扰设置 (亮度、高斯噪声、对比度、扭曲、场景跃变)

3. **防御场景选择**
   - 对抗训练 (PGD Training、FGM、FreeAT、YOPO、FreeLB)
   - 预处理防御 (高斯模糊、中值滤波、JPEG压缩、位深度降低)
   - 检测防御 (统计检测、神经网络检测、特征压缩)

4. **自定义场景**
   - 复合攻击场景配置
   - 执行调度管理

5. **攻防过程可视化**
   - 样本对比分析
   - 差异图和热力图
   - 攻击过程动画

6. **演练态势监控**
   - 实时状态监控
   - 性能指标展示

7. **评分报告**
   - 攻击成功率统计
   - 防御效果评估

8. **组队管理**
   - 团队创建和管理
   - 成员权限控制

9. **运维管理**
   - 任务监控
   - 系统管理

## 安装指南

### 环境要求
- Docker 和 Docker Compose
- NVIDIA GPU (推荐用于AI计算)
- NVIDIA Container Toolkit (需要GPU支持)
- Node.js 18+ (前端开发)

### 安装步骤
1. 克隆仓库
```
git clone https://github.com/yourusername/SkyGuard-UAV-Defense.git
cd SkyGuard-UAV-Defense
```

2. 下载模型权重
```
sh scripts/download_weights.sh
```

3. 使用Docker Compose启动所有服务
```
sh scripts/run_docker.sh
```

或直接使用
```
docker-compose up --build
```

### 前端开发

1. 安装依赖
```
cd frontend
npm install
```

2. 启动开发服务器
```
npm run dev
```

## 使用说明

1. 启动服务后，访问 http://localhost:8080 打开前端界面
2. 导航到"系统概览"页面，了解系统功能
3. 在"攻击场景选择"中配置对抗攻击或光电干扰参数
4. 在"防御场景选择"中配置防御算法和策略
5. 启动演练并在"可视化"页面监控攻防过程
6. 演练完成后在"评分报告"页面查看结果分析

## 技术架构

### 前端
- **框架**: React 18
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui
- **状态管理**: React Hooks
- **路由**: React Router

### 后端
- **API**: Python + FastAPI
- **异步任务**: Celery + Redis
- **AI核心**: PyTorch + Torchattacks + OpenCV-Python
- **部署**: Docker + Docker Compose

## 项目结构
```
SkyGuard-UAV-Defense/
├── backend/             # 后端API服务
│   ├── assets/          # 测试图像等资源
│   ├── celery_app.py    # Celery配置
│   ├── main.py          # FastAPI主程序
│   ├── tasks.py         # Celery任务定义
│   └── results/         # 存储任务结果
├── docs/                # 项目文档
├── frontend/            # React前端应用
│   ├── components/      # 通用组件
│   ├── pages/           # 页面组件
│   └── public/          # 静态资源
├── scripts/             # 辅助脚本
└── src/                 # AI模型代码
    ├── train.py         # 模型训练
    ├── eval.py          # 模型评估
    └── inference.py     # 模型推理
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

本项目仅供学习和研究使用。
