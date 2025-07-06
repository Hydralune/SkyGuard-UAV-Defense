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

# 自动发现 backend 包下的任务模块
celery_app.autodiscover_tasks(["backend"], force=True)

if __name__ == "__main__":
    celery_app.start()
