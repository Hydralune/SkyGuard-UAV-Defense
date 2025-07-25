# 配置API使用指南

SkyGuard-UAV-Defense 项目提供了一组配置API，用于查询和管理模型和数据集配置。本文档将介绍如何使用这些API端点。

## API端点概览

所有配置API端点都以 `/config` 为前缀。

### 模型配置

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/config/models` | 列出所有可用的模型配置 |
| GET | `/config/models/{model_name}` | 获取指定模型的配置信息 |
| POST | `/config/models/{model_name}` | 更新或创建模型配置 |
| DELETE | `/config/models/{model_name}` | 删除模型配置 |
| GET | `/config/model-paths/{model_name}` | 获取模型文件路径 |

### 数据集配置

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/config/datasets` | 列出所有可用的数据集配置 |
| GET | `/config/datasets/{dataset_name}` | 获取指定数据集的配置信息 |
| POST | `/config/datasets/{dataset_name}` | 更新或创建数据集配置 |
| DELETE | `/config/datasets/{dataset_name}` | 删除数据集配置 |
| GET | `/config/dataset-paths/{dataset_name}` | 获取数据集路径 |

## 使用示例

### 列出所有模型配置

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/models' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "models": [
    {
      "name": "yolov8s-visdrone",
      "type": "detection",
      "framework": "yolov8",
      "description": "YOLOv8s 在 VisDrone 数据集上训练的模型"
    }
  ]
}
```

### 获取指定模型的配置信息

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/models/yolov8s-visdrone' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "name": "yolov8s-visdrone",
  "config": {
    "type": "detection",
    "framework": "yolov8",
    "description": "YOLOv8s 在 VisDrone 数据集上训练的模型",
    "path": {
      "baseline": "models/baseline/yolov8s-visdrone.pt",
      "active": "models/active/yolov8s-visdrone.pt"
    },
    "metadata": {
      "input_size": [640, 640],
      "classes": 10,
      "dataset": "visdrone"
    }
  }
}
```

### 更新或创建模型配置

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

响应示例：

```json
{
  "status": "success",
  "message": "模型 yolov8m-visdrone 配置已更新",
  "config": {
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
  }
}
```

### 删除模型配置

```bash
curl -X 'DELETE' \
  'http://127.0.0.1:8001/config/models/yolov8m-visdrone' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "status": "success",
  "message": "模型 yolov8m-visdrone 配置已删除"
}
```

### 获取模型文件路径

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/model-paths/yolov8s-visdrone?prefer_active=true' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "model_name": "yolov8s-visdrone",
  "path": "/root/projects/SkyGuard-UAV-Defense/backend/models/active/yolov8s-visdrone.pt",
  "exists": true
}
```

### 列出所有数据集配置

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/datasets' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "datasets": [
    {
      "name": "VisDrone",
      "type": "detection",
      "description": "无人机视角目标检测数据集",
      "classes": 10
    }
  ]
}
```

### 获取指定数据集的配置信息

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/datasets/VisDrone' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "name": "VisDrone",
  "config": {
    "type": "detection",
    "description": "无人机视角目标检测数据集",
    "path": {
      "root": "datasets/VisDrone_Dataset",
      "train": "VisDrone2019-DET-train/images",
      "val": "VisDrone2019-DET-val/images",
      "test": "VisDrone2019-DET-test-dev/images",
      "annotations": {
        "train": "VisDrone2019-DET-train/annotations",
        "val": "VisDrone2019-DET-val/annotations",
        "test": "VisDrone2019-DET-test-dev/annotations"
      }
    },
    "format": "visdrone",
    "classes": [
      "pedestrian", "people", "bicycle", "car", "van",
      "truck", "tricycle", "awning-tricycle", "bus", "motor"
    ]
  }
}
```

### 更新或创建数据集配置

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

响应示例：

```json
{
  "status": "success",
  "message": "数据集 COCO 配置已更新",
  "config": {
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
  }
}
```

### 删除数据集配置

```bash
curl -X 'DELETE' \
  'http://127.0.0.1:8001/config/datasets/COCO' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "status": "success",
  "message": "数据集 COCO 配置已删除"
}
```

### 获取数据集路径

```bash
curl -X 'GET' \
  'http://127.0.0.1:8001/config/dataset-paths/VisDrone?subset=test' \
  -H 'accept: application/json'
```

响应示例：

```json
{
  "dataset_name": "VisDrone",
  "subset": "test",
  "images_path": "/root/projects/SkyGuard-UAV-Defense/backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/images",
  "annotations_path": "/root/projects/SkyGuard-UAV-Defense/backend/datasets/VisDrone_Dataset/VisDrone2019-DET-test-dev/annotations",
  "images_exists": true,
  "annotations_exists": true
}
```

## 注意事项

1. 所有路径都是相对于 `backend/` 目录的相对路径。
2. 更新配置后，系统会自动重新加载配置，无需重启应用程序。
3. 删除配置不会删除实际的模型文件或数据集文件，只会删除配置信息。
4. 如果找不到配置的路径，系统会回退到旧的路径逻辑，以保持兼容性。 