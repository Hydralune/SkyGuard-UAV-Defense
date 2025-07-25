# 配置管理系统使用指南

SkyGuard-UAV-Defense 项目使用集中式配置管理系统来管理模型和数据集的路径和元数据。本文档将介绍如何使用这些配置工具。

## 配置文件结构

配置文件位于 `backend/config/` 目录下，包括：

1. `models.yaml` - 模型配置文件
2. `datasets.yaml` - 数据集配置文件

### 模型配置文件示例 (models.yaml)

```yaml
# 模型配置文件
models:
  # 目标检测模型
  yolov8s-visdrone:
    type: detection
    framework: yolov8
    description: "YOLOv8s 在 VisDrone 数据集上训练的模型"
    path:
      baseline: "models/baseline/yolov8s-visdrone.pt"
      active: "models/active/yolov8s-visdrone.pt"
    metadata:
      input_size: [640, 640]
      classes: 10
      dataset: "visdrone"
```

### 数据集配置文件示例 (datasets.yaml)

```yaml
# 数据集配置文件
datasets:
  VisDrone:
    type: detection
    description: "无人机视角目标检测数据集"
    path:
      root: "datasets/VisDrone_Dataset"
      train: "VisDrone2019-DET-train/images"
      val: "VisDrone2019-DET-val/images"
      test: "VisDrone2019-DET-test-dev/images"
      annotations: 
        train: "VisDrone2019-DET-train/annotations"
        val: "VisDrone2019-DET-val/annotations"
        test: "VisDrone2019-DET-test-dev/annotations"
    format: "visdrone"
    classes:
      - pedestrian
      - people
      - bicycle
      - car
      - van
      - truck
      - tricycle
      - awning-tricycle
      - bus
      - motor
```

## 配置管理工具使用

项目提供了一个命令行工具 `backend/config/config_tools.py` 来管理配置文件。

### 创建默认配置文件

如果配置文件不存在，可以使用以下命令创建默认配置文件：

```bash
python -m backend.config.config_tools create
```

### 添加新模型

使用以下命令添加新模型：

```bash
python -m backend.config.config_tools add-model \
    --name "yolov8m-visdrone" \
    --type "detection" \
    --framework "yolov8" \
    --description "YOLOv8m 在 VisDrone 数据集上训练的模型" \
    --baseline-path "models/baseline/yolov8m-visdrone.pt" \
    --active-path "models/active/yolov8m-visdrone.pt"
```

### 添加新数据集

使用以下命令添加新数据集：

```bash
python -m backend.config.config_tools add-dataset \
    --name "COCO" \
    --type "detection" \
    --description "通用目标检测数据集" \
    --root-path "datasets/COCO" \
    --classes person bicycle car motorcycle airplane bus train truck boat
```

### 列出所有模型

使用以下命令列出所有可用的模型：

```bash
python -m backend.config.config_tools list-models
```

### 列出所有数据集

使用以下命令列出所有可用的数据集：

```bash
python -m backend.config.config_tools list-datasets
```

## 在代码中使用配置管理器

在代码中，您可以使用 `ConfigManager` 类来获取模型和数据集的路径和元数据。

### 获取模型路径

```python
from backend.utils.config_manager import ConfigManager

# 获取模型路径
model_path = ConfigManager.get_model_path('yolov8s-visdrone')
print(f"模型路径: {model_path}")

# 获取数据集路径
test_images_path = ConfigManager.get_dataset_path('VisDrone', 'test')
print(f"测试图像路径: {test_images_path}")

# 获取数据集标注路径
annotations_path = ConfigManager.get_dataset_annotation_path('VisDrone', 'test')
print(f"标注路径: {annotations_path}")

# 获取数据集类别
classes = ConfigManager.get_dataset_classes('VisDrone')
print(f"类别: {classes}")
```

## 模型目录结构

为了更好地管理模型文件，建议使用以下目录结构：

```
backend/
  ├── models/
  │    ├── baseline/
  │    │    ├── yolov8s-visdrone.pt      # 基准模型权重
  │    │    └── yolov8m-visdrone.pt      # 其他基准模型
  │    ├── active/
  │    │    └── yolov8s-visdrone.pt      # 当前使用的模型权重（可以是符号链接）
  │    └── runs/
  │         └── <run_id>/best.pt         # 训练运行产生的最佳权重
```

## 数据集目录结构

建议使用以下目录结构来组织数据集：

```
backend/
  ├── datasets/
  │    ├── VisDrone_Dataset/
  │    │    ├── VisDrone2019-DET-train/
  │    │    │    ├── images/            # 训练图像
  │    │    │    └── annotations/       # 训练标注
  │    │    ├── VisDrone2019-DET-val/
  │    │    │    ├── images/            # 验证图像
  │    │    │    └── annotations/       # 验证标注
  │    │    └── VisDrone2019-DET-test-dev/
  │    │         ├── images/            # 测试图像
  │    │         └── annotations/       # 测试标注
  │    └── COCO/
  │         ├── train2017/              # 另一个数据集
  │         └── ...
```

## 注意事项

1. 所有路径都是相对于 `backend/` 目录的相对路径。
2. 配置管理器会自动处理路径解析，将相对路径转换为绝对路径。
3. 如果找不到配置的路径，配置管理器会回退到旧的路径逻辑，以保持兼容性。 