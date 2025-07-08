bash直接执行：
#1.PGD攻击任务
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
#2.FGSM攻击任务
python - <<'PY'
from backend.tasks import fgsm_dataset_attack_task   

result = fgsm_dataset_attack_task(
    task_id="visdrone_fgsm_test",
    num_images=20,
    eps="8/255"
)
print(result)
PY

#3.通用性泛化任务
python - <<'PY'
from backend.tasks import pgd_dataset_attack_task as adv_task

# 运行 FGSM
res1 = adv_task(
    task_id="fgsm_demo",
    attack_name="fgsm",
    num_images=20,
    eps="8/255"        # alpha/steps 可随意给或省略
)
print(res1)

# 运行 PGD（保持旧用法）
res2 = adv_task(
    task_id="pgd_demo",
    num_images=10,
    eps="8/255",
    alpha="2/255",
    steps=10
)
print(res2)
PY