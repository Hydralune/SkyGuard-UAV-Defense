# YOLOv8 模型训练脚本使用指南 (`backend/train_model.py`)

本脚本统一负责 **VisDrone 目标检测模型** 的常规训练与基于对抗样本的防御训练（Adversarial Training）。

---
## 1. 脚本入口
```bash
python backend/train_model.py [参数...]
```
> 运行前请确保依赖已安装，并且 `backend/datasets/VisDrone_Dataset/` 数据集路径正确。

---
## 2. 标准训练参数
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--base_model` | `yolov8s.pt` | Ultralytics 预训练权重或模型名 |
| `--data_yaml`  | `backend/datasets/VisDrone_Dataset/visdrone.yaml` | 数据集 YAML 定义 |
| `--epochs`     | `100` | 训练轮数 |
| `--imgsz`      | `640` | 输入分辨率 (方形) |
| `--batch`      | `16`  | Batch size/GPU |
| `--run_desc`   | `standard_train` | Ultralytics 的 *project* 子目录名称 |
| `--model_name` | `yolov8s-visdrone` | 用于保存权重、注册表键名 |
| `--device`     | `0` | CUDA 设备 id (如`0,1`) 或 `cpu` |
| `--activate`   | *(flag)* | 训练结束后是否将权重软链到 `backend/models/active/` 方便线上推理 |

**示例：**
```bash
# 100 epoch 基线训练
python backend/train_model.py \
    --epochs 100 \
    --run_desc baseline
```

---
## 3. 对抗训练参数（可选）
启用 `--adv_train` 后，下列参数生效。

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--adv_train` | *(flag)* | 开启对抗训练 |
| `--adv_attack` | `pgd` | 对抗样本生成算法，当前支持 `pgd`、`fgsm`，后续可扩展 |
| `--adv_ratio` | `0.5` | 每个 batch 中对抗样本比例 *(0-1)* |
| `--adv_eps` | `8/255` | 攻击强度 ε，可写成小数或分数串 |
| `--adv_alpha` | `2/255` | 步长 α（多步攻击） |
| `--adv_steps` | `10` | 迭代步数；FGSM 等单步攻击会忽略 |

**示例：PGD 对抗训练**
```bash
python backend/train_model.py \
    --adv_train \
    --adv_attack pgd \
    --adv_ratio 0.5 \
    --adv_eps 8/255 \
    --adv_alpha 2/255 \
    --adv_steps 10 \
    --epochs 100 \
    --run_desc pgd_advtrain
```

**示例：FGSM 对抗训练**
```bash
python backend/train_model.py --adv_train --adv_attack fgsm --epochs 50
```

---
## 4. 训练产物与目录结构
| 路径 | 说明 |
|-------|------|
| `backend/models/runs/<run_desc>/` | Ultralytics 原生输出（包含 `weights/best.pt` 等） |
| `backend/<model_name>/best.pt` | 训练完成后自动拷贝的权重，便于 `ModelManager` 加载 |
| `backend/models/active/<model_name>.pt` | 若加 `--activate`，此处会创建软链指向最新权重 |
| `backend/models/registry.json` | 记录全部训练 run 信息，字段 `adv_train`/`adv_attack` 可用于区分 |

**注意：** 对抗样本在训练过程中 **不会写入磁盘**，而是由 `AdvTrainingCallback` 在 GPU/CPU 内存中即时生成并替换 batch 张量。如需调试，可在 `backend/callbacks/advtrain.py` 内手动保存。 

---
## 5. 扩展自定义攻击 / 防御算法
1. 在 `backend/algorithms/attacks/` 新增 `<name>.py` 并继承 `BaseAttack`。  
2. 训练时指定 `--adv_attack <name>` 即可。

对于更复杂的防御策略（如 FreeAT、YOPO、FreeLB），推荐：
- 编写新的 Callback 并放到 `backend/callbacks/`；
- 或继承 `BaseTrainingDefense` 写成一个类，在训练脚本中按需注册。

---
## 6. 常见问题
**Q:** 只想普通训练，是否受对抗参数影响？  
**A:** 默认不启用 `--adv_train`，对抗逻辑完全关闭，脚本行为与旧版一致。

**Q:** 可以在多 GPU 上跑对抗训练吗？  
**A:** 可以，Ultralytics 会自动处理多卡同步；对抗样本生成也跟随模型设备。

---
如有更多疑问，请查看代码注释或提交 Issue。 