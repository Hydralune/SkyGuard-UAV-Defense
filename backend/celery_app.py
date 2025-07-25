#celery -A celery_app worker --loglevel=info
from celery import Celery
import os

# 允许通过环境变量覆盖 Redis 地址，方便 Docker / 生产部署
celery_app = Celery(
    "skyguard",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),  # Redis作为消息代理
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")  # Redis作为结果后端
)

# 配置Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True
)

# 自动发现和注册任务
celery_app.autodiscover_tasks(['tasks'])

# 导入所有任务函数，确保它们被注册
# 注意：导入需要放在celery_app定义之后，以避免循环导入
from tasks import test_model_task, run_attack_task
from defense import run_defense_task

# 将test_model_task注册为celery任务
test_model_task = celery_app.task(name="model.test")(test_model_task)

# 将run_defense_task注册为celery任务
run_defense_task = celery_app.task(name="defense.run")(run_defense_task)

if __name__ == "__main__":
    celery_app.start()
