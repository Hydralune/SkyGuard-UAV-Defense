#!/bin/bash

# 确保在项目根目录执行
cd "$(dirname "$0")/.."

# 确保目录存在
mkdir -p backend/assets

# 使用PyTorch Hub下载YOLOv5预训练权重
python -c "import torch; torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)"

echo "YOLOv5预训练权重已下载"
