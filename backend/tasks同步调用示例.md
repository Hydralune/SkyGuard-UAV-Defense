bash直接执行：

python - <<'PY'
from backend.tasks import pgd_dataset_attack_task

# task_id 可随意取名；num_images=-1 表示跑完整测试集
result = pgd_dataset_attack_task(
    task_id="visdrone_pgd_test",
    num_images=15,        # 例如只抽 10 张图像快速测试
    eps="8/255",
    alpha="2/255",
    steps=10
)
print(result)
PY