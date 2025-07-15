# SkyGuard UAV Defense – 后端开发指南

> 本文件为后端 (`backend/`) 目录的总体说明，涵盖目录结构、环境配置、数据与模型准备、常用脚本、扩展对抗算法/防御算法的方法，以及进一步的开发建议。

---

## 目录结构

```
backend/
├── adversarial_results/      # 生成的对抗攻击检测结果
│   ├── adversarial_results/  #   └ 各类对抗样本
│   ├── comparison_results/   #   └ 原图 / 对抗图对比
│   ├── detection_results/    #   └ YOLO 检测框结果
│   ├── metrics/              #   └ JSON & HTML 指标报告
│   ├── perturbation_results/ #   └ 扰动可视化
│   └── plots/                #   └ 统计图表
├── algorithms/
│   ├── attacks/              # 对抗攻击算法
│   │   ├── base.py           #   └ 攻击基类
│   │   ├── pgd.py            #   └ PGD 实现
│   │   ├── fgsm.py           #   └ FGSM 实现
│   │   └── …                 #   └ 更多自定义算法
│   └── defenses/             # 对抗防御算法
│       ├── base.py           #   └ 防御基类
│       └── …                 #   └ 自定义防御
├── callbacks/                # 训练回调 (AdvTrainingCallback 等)
│   └── advtrain.py
├── models/                   # 权重与训练输出
│   ├── active/               # 生产环境使用的权重软链
│   ├── baseline/             # 基线权重
│   ├── runs/                 # Ultralytics 原生日志输出
│   └── registry.json         # 训练 run 索引
├── train_model.py            # 统一训练脚本 (支持对抗训练)
├── datasets/                 # 数据集（VisDrone 等）
├── evaluate.py               # 统一评估入口（TODO）
├── evaluate_model.py         # 纯净样本评估脚本
├── evaluate_adversarial.py   # 对抗样本评估脚本
├── defense.py                # 在线推理 + 防御示例
├── download_dataset.py       # 自动下载并整理数据集
├── celery_app.py             # Celery 异步任务入口
├── tasks.py                  # 异步任务定义
├── utils/                    # 工具模块（数据加载/可视化等）
│   ├── dataset_manager.py
│   ├── evaluator.py
│   ├── model_loader.py
│   ├── model_manager.py
│   └── visualizer.py
└── yolov8s-visdrone/         # 预训练 YOLOv8 权重及配置
```

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

### 3. 安装额外框架（可选）
- **CUDA**: 若需 GPU 加速，请确保安装与显卡/驱动对应版本的 CUDA & cuDNN。
- **Node.js**: 仅在需要运行前端界面时安装。

---

## 数据与模型准备

### 1. 下载数据集
```bash
python backend/download_dataset.py --dataset VisDrone
```
脚本会自动下载并解压到 `backend/datasets/VisDrone_Dataset/`。

### 2. 下载权重
项目默认使用 [YOLOv8](https://github.com/ultralytics/ultralytics) 在 VisDrone 上的微调模型，权重已放置在 `backend/yolov8s-visdrone/` 中。若需重新训练或替换，请使用下方“模型训练”章节提供的脚本或自行调用 `ultralytics train`。

---

## 模型训练

### 标准训练示例

```bash
python -m backend.train_model --epochs 100 --run_desc baseline
```

### 对抗训练示例（PGD）

```bash
python -m backend.train_model \
    --adv_train \
    --adv_attack pgd \
    --adv_ratio 0.5 \
    --adv_eps 8/255 \
    --adv_alpha 2/255 \
    --adv_steps 10 \
    --epochs 100 \
    --run_desc pgd_advtrain
```

更多参数请查看：

```bash
python -m backend.train_model -h
```

训练输出会被整理到 `backend/models/`：

* `models/runs/<run_desc>/`   – Ultralytics 原生日志与权重
* `models/active/<model>.pt`  – 指向当前激活权重的软链 (若 `--activate`)
* `models/registry.json`      – 记录全部训练 run 信息

---

## 快速开始

### 纯净样本评估
```bash
python backend/evaluate_model.py \
       --model yolov8s-visdrone \
       --dataset VisDrone \
       --num_images 10 \
       --save_dir evaluation_results
```

### 对抗样本评估（PGD 示例）
```bash
python backend/evaluate_adversarial.py \
       --model yolov8s-visdrone \
       --dataset VisDrone \
       --num_images 10 \
       --save_dir adversarial_results \
       --attack pgd \
       --eps 8/255 \
       --steps 10 \
       --alpha 2/255
```

执行完毕后，在 `adversarial_results/`、`evaluation_results/` 文件夹中将生成可视化样本、评估指标 (`*.json`) 与图表 (`*.png`)。

---

## Celery 异步任务
本项目支持使用 Celery + Redis/MQ 进行异步推理与评估。快速启动示例：
```bash
# 启动 Redis（Docker 示例）
docker run -d --name redis -p 6379:6379 redis

# 启动 Celery Worker
cd backend
celery -A celery_app worker -l info
```
> 任务调用示例见 `backend/tasks.py`。

---

## 扩展攻击/防御算法

### 1. 攻击算法
1. 在 `backend/algorithms/attacks/` 新建文件，如 `fgsm.py`。
2. 继承 `Attack` 基类并实现 `forward()` 方法：
   ```python
   from .base import Attack

   class FGSM(Attack):
       name = "fgsm"
       def forward(self, model, images, labels, eps):
           # 1. 计算梯度
           # 2. 叠加扰动
           # 3. 返回对抗样本
           ...
   ```
3. 在 `backend/algorithms/attacks/__init__.py` 中注册：
   ```python
   from .fgsm import FGSM  # noqa: F401
   ```

### 2. 防御算法
流程与攻击类似，目录位于 `backend/algorithms/defenses/`，基类为 `Defense`。

### 3. 在评估脚本中调用
- `--attack <name>` 或 `--defense <name>` 参数将自动查找已注册类并实例化。

---

## 贡献规范

1. **代码风格**：遵循 `PEP8`，建议安装 `pre-commit` 钩子自动格式化。
2. **类型注解**：新增模块请尽量添加 `typing` 注解，提升可维护性。
3. **单元测试**：在 `tests/` 目录添加对应 `pytest` 用例。
4. **文档**：新增/修改公共 API 请同步更新本 README 或 `docs/`。

---

## TODO
- [ ] 完成 `evaluate.py` 统一入口封装
- [ ] 实现 **FGSM / DeepFool / C&W / AdvPatch** 等攻击
- [ ] 实现 **FreeLP / YOPO / PGDTraining** 等防御
- [ ] 部署 FastAPI 服务，提供 RESTful 推理接口

---

如对本项目有任何疑问或建议，欢迎提交 Issue 或 Pull Request！