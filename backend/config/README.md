# 配置系统

SkyGuard-UAV-Defense 项目使用集中式配置管理系统来管理模型和数据集的路径和元数据。本文档将介绍配置系统的结构和API使用方法。

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

## 配置管理工具

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

## 配置API使用

SkyGuard-UAV-Defense 项目提供了一组配置API，用于查询和管理模型和数据集配置。

### API端点概览

所有配置API端点都以 `/config` 为前缀。

#### 模型配置

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/config/models` | 列出所有可用的模型配置 |
| GET | `/config/models/{model_name}` | 获取指定模型的配置信息 |
| POST | `/config/models/{model_name}` | 更新或创建模型配置 |
| DELETE | `/config/models/{model_name}` | 删除模型配置 |
| GET | `/config/model-paths/{model_name}` | 获取模型文件路径 |

#### 数据集配置

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/config/datasets` | 列出所有可用的数据集配置 |
| GET | `/config/datasets/{dataset_name}` | 获取指定数据集的配置信息 |
| POST | `/config/datasets/{dataset_name}` | 更新或创建数据集配置 |
| DELETE | `/config/datasets/{dataset_name}` | 删除数据集配置 |
| GET | `/config/dataset-paths/{dataset_name}` | 获取数据集路径 |

### 使用示例

#### 列出所有模型配置

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/models' \
  -H 'accept: application/json'
```

#### 获取指定模型的配置信息

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/models/yolov8s-visdrone' \
  -H 'accept: application/json'
```

#### 更新或创建模型配置

```bash
curl -X 'POST' \
  'http://127.0.0.1:8001/config/models/yolov8m-visdrone' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "detection",
    "framework": "yolov8",
    "description": "YOLOv8m 在 VisDrone 数据集上训练的模型",
    "path": {
      "baseline": "models/baseline/yolov8m-visdrone.pt",
      "active": "models/active/yolov8m-visdrone.pt"
    },
    "metadata": {
      "input_size": [640, 640],
      "classes": 10,
      "dataset": "visdrone"
    }
  }'
```

#### 获取模型文件路径

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/model-paths/yolov8s-visdrone?prefer_active=true' \
  -H 'accept: application/json'
```

#### 更新或创建数据集配置

```bash
curl -X 'POST' \
  'http://127.0.0.1:8001/config/datasets/COCO' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "detection",
    "description": "通用目标检测数据集",
    "path": {
      "root": "datasets/COCO",
      "train": "train2017",
      "val": "val2017",
      "test": "test2017",
      "annotations": {
        "train": "annotations/instances_train2017.json",
        "val": "annotations/instances_val2017.json"
      }
    },
    "format": "coco",
    "classes": [
      "person", "bicycle", "car", "motorcycle", "airplane",
      "bus", "train", "truck", "boat", "traffic light"
    ]
  }'
```

## 在代码中使用配置管理器

在代码中，您可以使用 `ConfigManager` 类来获取模型和数据集的路径和元数据。

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

## 注意事项

1. 所有路径都是相对于 `backend/` 目录的相对路径。
2. 配置管理器会自动处理路径解析，将相对路径转换为绝对路径。
3. 如果找不到配置的路径，配置管理器会回退到旧的路径逻辑，以保持兼容性。
4. 更新配置后，系统会自动重新加载配置，无需重启应用程序。
5. 删除配置不会删除实际的模型文件或数据集文件，只会删除配置信息。 