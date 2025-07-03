from celery import Celery

# 创建Celery应用
celery_app = Celery(
    "skyguard",
    broker="redis://redis:6379/0",  # Redis作为消息代理
    backend="redis://redis:6379/1"  # Redis作为结果后端
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

if __name__ == "__main__":
    celery_app.start()
