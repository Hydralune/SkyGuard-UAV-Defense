# FGM防御算法使用指南

## 算法介绍

FGM (Fast Gradient Method) 防御是一种基于对抗训练的防御方法，通过在训练过程中注入对抗样本来提高模型的鲁棒性。

### 主要特点

- **对抗训练**: 在训练过程中使用对抗样本，提高模型对对抗攻击的鲁棒性
- **支持YOLO**: 专门针对YOLO目标检测模型优化
- **灵活配置**: 支持多种参数配置，适应不同的训练需求
- **动态加载**: 支持通过名称动态加载，便于集成

## 算法原理

FGM防御的核心思想是在训练过程中，将一部分训练样本替换为对抗样本，使模型学会在对抗环境下进行正确的预测。

### 训练流程

1. **生成对抗样本**: 使用FGSM方法对原始图像生成对抗样本
2. **混合训练**: 将原始样本和对抗样本混合进行训练
3. **鲁棒性提升**: 通过对抗训练提高模型对对抗攻击的鲁棒性

## 使用方法

### 1. 基本使用

```python
from algorithms.defenses.fgm_defense import FGMDefense

# 初始化FGM防御算法
fgm_defense = FGMDefense(
    eps=8/255,           # 最大扰动幅度
    alpha=2/255,         # 单步扰动大小
    steps=1,             # 对抗攻击步数
    attack_ratio=0.5     # 训练批次中使用对抗样本的比例
)

# 生成对抗样本
adv_images = fgm_defense.generate_adversarial_examples(model, images, targets)
```

### 2. 训练时使用

```python
# 执行对抗训练
trained_model = fgm_defense.train(
    model=model,
    dataloader=dataloader,
    optimizer=optimizer,
    epochs=30
)
```

### 3. 通过命令行训练

```bash
# 使用FGSM进行对抗训练
python backend/train_model.py \
    --adv_train \
    --adv_attack fgsm \
    --adv_eps 8/255 \
    --adv_alpha 2/255 \
    --adv_steps 1 \
    --adv_ratio 0.5 \
    --epochs 30 \
    --run_desc fgm_defense_train
```

### 4. 通过API调用

```python
# 调用FGM防御训练任务
from backend.tasks import fgm_defense_train_task

result = fgm_defense_train_task.delay(
    task_id="fgm_train_001",
    epochs=30,
    eps="8/255",
    alpha="2/255",
    steps=1,
    attack_ratio=0.5
)
```

## 参数配置

### 初始化参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `eps` | float | 8/255 | 最大扰动幅度 |
| `alpha` | float | 2/255 | 单步扰动大小 |
| `steps` | int | 1 | 对抗攻击步数 |
| `attack_ratio` | float | 0.5 | 训练批次中使用对抗样本的比例 |

### 训练参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `epochs` | int | 30 | 训练轮数 |
| `batch_size` | int | 16 | 批次大小 |
| `model_name` | str | "yolov8s-fgm-defended" | 训练后的模型名称 |

## 性能评估

### 评估防御效果

```python
# 加载训练好的防御模型
defended_model = ModelManager.load_yolov8_model(model_name="yolov8s-fgm-defended")

# 在对抗样本上测试
results = defended_model.predict(adversarial_image, conf=0.25, iou=0.5)
```

### 对比实验

建议进行以下对比实验：

1. **原始模型 vs 防御模型**: 在干净样本上的性能对比
2. **对抗攻击测试**: 在对抗样本上的鲁棒性对比
3. **不同攻击方法**: 测试对PGD、FGSM等不同攻击的防御效果

## 注意事项

1. **训练时间**: 对抗训练比标准训练需要更多时间
2. **计算资源**: 需要足够的GPU内存和计算能力
3. **参数调优**: 需要根据具体任务调整eps、alpha等参数
4. **数据质量**: 确保训练数据的质量和标注准确性

## 示例代码

完整的使用示例请参考：
- `backend/examples/fgm_defense_example.py`

## 相关文件

- 算法实现: `backend/algorithms/defenses/fgm_defense.py`
- 任务函数: `backend/tasks.py` (fgm_defense_train_task)
- 使用示例: `backend/examples/fgm_defense_example.py`
- 训练脚本: `backend/train_model.py`

## 故障排除

### 常见问题

1. **内存不足**: 减少batch_size或使用梯度累积
2. **训练不稳定**: 调整学习率或eps参数
3. **防御效果差**: 增加训练轮数或调整attack_ratio

### 调试建议

1. 监控训练损失变化
2. 定期评估模型在验证集上的性能
3. 保存中间检查点以便恢复训练 